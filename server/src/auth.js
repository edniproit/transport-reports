import { timingSafeEqual } from 'node:crypto';

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

export function basicAuth(req, res, next) {
  const expected = credentials();
  if (!expected) return next();

  const [type, token] = (req.get('authorization') || '').split(' ');
  if (type === 'Basic' && token) {
    const [user, ...rest] = Buffer.from(token, 'base64').toString('utf8').split(':');
    if (safeEqual(user, expected.username) && safeEqual(rest.join(':'), expected.password)) return next();
  }
  // Значення заголовка має бути ASCII, тому realm латиницею.
  res.set('WWW-Authenticate', 'Basic realm="Transport reports", charset="UTF-8"').status(401).send('Потрібен вхід');
}
