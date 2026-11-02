import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_NAME = 'session';
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

// Вхід за паролем вмикається змінною APP_PASSWORD (логін — APP_USER, за замовчуванням admin).
// Без неї застосунок відкритий, що годиться лише для локальної роботи.
export function credentials() {
  const password = process.env.APP_PASSWORD;
  return password ? { username: process.env.APP_USER || 'admin', password } : null;
}

// Ключ підпису залежить від пароля: після його зміни всі сесії стають недійсними.
const secret = () => process.env.SESSION_SECRET || createHash('sha256').update(`session:${credentials()?.password}`).digest();
const sign = (expires) => createHmac('sha256', secret()).update(String(expires)).digest('base64url');

export function createSessionToken(now = Date.now()) {
  const expires = now + SESSION_MS;
  return `${expires}.${sign(expires)}`;
}

export function verifySessionToken(token, now = Date.now()) {
  const [expires, signature] = String(token || '').split('.');
  return Boolean(signature) && Number(expires) > now && safeEqual(signature, sign(expires));
}

const readCookie = (req, name) => {
  for (const part of (req.get('cookie') || '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return null;
};

// Сесійний cookie для людей; заголовок Basic лишається для скриптів (імпорт даних).
export function isAuthenticated(req) {
  const expected = credentials();
  if (!expected) return true;
  if (verifySessionToken(readCookie(req, COOKIE_NAME))) return true;

  const [type, token] = (req.get('authorization') || '').split(' ');
  if (type !== 'Basic' || !token) return false;
  const [user, ...rest] = Buffer.from(token, 'base64').toString('utf8').split(':');
  return safeEqual(user, expected.username) && safeEqual(rest.join(':'), expected.password);
}

export function requireAuth(req, res, next) {
  if (isAuthenticated(req)) return next();
  res.status(401).json({ error: 'Потрібен вхід' });
}

// Не більше 5 невдалих спроб входу з однієї адреси за 15 хвилин.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export function login(req, res) {
  const expected = credentials();
  if (!expected) return res.json({ ok: true });

  const now = Date.now();
  const record = attempts.get(req.ip);
  if (record && record.resetAt > now && record.failures >= MAX_FAILURES) {
    return res.status(429).json({ error: 'Забагато невдалих спроб. Спробуйте за кілька хвилин.' });
  }

  const { username = '', password = '' } = req.body ?? {};
  if (!safeEqual(String(username), expected.username) || !safeEqual(String(password), expected.password)) {
    const current = record && record.resetAt > now ? record : { failures: 0, resetAt: now + WINDOW_MS };
    attempts.set(req.ip, { ...current, failures: current.failures + 1 });
    return res.status(401).json({ error: 'Невірний логін або пароль' });
  }

  attempts.delete(req.ip);
  res.cookie(COOKIE_NAME, createSessionToken(), { httpOnly: true, sameSite: 'lax', secure: req.secure, maxAge: SESSION_MS });
  res.json({ ok: true });
}

export function logout(_req, res) {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
}
