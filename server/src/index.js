import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { SECTIONS, defaultPrices } from './schema.js';
import { COOKIE_NAME, createSessionToken, credentials, isAuthenticated, login, logout, requireAuth } from './auth.js';
import { formatDate, isMonday, weekEnd } from './dates.js';
import { renderPdf } from './pdf.js';
import { buildReport, normalizeEntry } from './report.js';
import { readAll, update } from './store.js';

const port = process.env.PORT || 3001;
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'client', 'dist');

const app = express();
app.set('trust proxy', 1); // за проксі хостингу: правильні req.secure та req.ip
app.use(cors());
app.use(express.json());

// Відкриті маршрути: перевірка стану й вхід. Усе інше під /api — лише для авторизованих.
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/session', (req, res) => res.json({ authRequired: Boolean(credentials()), authenticated: isAuthenticated(req) }));
app.post('/api/login', login);
app.post('/api/logout', logout);
app.use('/api', requireAuth);

class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Express 4 не ловить відхилені проміси: передаємо помилки в обробник вручну.
const handle = (fn) => (req, res, next) => fn(req, res).catch(next);

const checkWeek = (req, res, next) => {
  if (!isMonday(req.params.weekStart)) {
    return res.status(400).json({ error: 'weekStart має бути понеділком у форматі YYYY-MM-DD' });
  }
  next();
};

app.get('/api/schema', (_req, res) => res.json({ sections: SECTIONS }));

app.get('/api/weeks', async (_req, res) => {
  const all = await readAll();
  res.json(Object.keys(all).sort().reverse());
});

// Ціни нового звіту: ті, що в останньому створеному звіті (інакше — тарифи за замовчуванням зі schema.js).
const inheritedPrices = (all) => {
  const latest = Object.keys(all).sort().pop();
  return latest ? normalizeEntry(all[latest]).prices : defaultPrices();
};

app.get('/api/weeks/:weekStart', checkWeek, async (req, res) => {
  const all = await readAll();
  const entry = all[req.params.weekStart];
  res.json(entry ? normalizeEntry(entry) : normalizeEntry(undefined, inheritedPrices(all)));
});

// Перший (найраніший) збережений тиждень — точка відліку: раніше за нього звітів немає і не буде.
app.put('/api/weeks/:weekStart', checkWeek, handle(async (req, res) => {
  const { weekStart } = req.params;
  if (weekStart > new Date().toISOString().slice(0, 10)) throw new HttpError('Цей тиждень ще не розпочався');
  let entry;
  await update((all) => {
    const first = Object.keys(all).sort()[0];
    if (first && weekStart < first) throw new HttpError(`Не можна створювати звіти раніше за перший тиждень (${formatDate(first)})`);
    entry = normalizeEntry(req.body, all[weekStart] ? undefined : inheritedPrices(all));
    all[weekStart] = entry;
  });
  res.json(entry);
}));

app.delete('/api/weeks/:weekStart', checkWeek, handle(async (req, res) => {
  await update((all) => {
    if (req.params.weekStart === Object.keys(all).sort()[0]) throw new HttpError('Перший звіт видалити не можна');
    delete all[req.params.weekStart];
  });
  res.status(204).end();
}));

app.get('/api/report/:weekStart', checkWeek, async (req, res) => {
  res.json(buildReport(req.params.weekStart, await readAll()));
});

// ?download=1 — віддати як файл, інакше PDF відкривається для перегляду без завантаження.
app.get('/api/report/:weekStart/pdf', checkWeek, async (req, res) => {
  const { weekStart } = req.params;
  try {
    // У продакшені клієнта віддає сам сервер; у розробці друкуємо з адреси, з якої прийшов запит (Vite).
    const clientUrl =
      process.env.CLIENT_URL ||
      (process.env.NODE_ENV === 'production' ? `http://localhost:${port}` : `${req.protocol}://${req.get('x-forwarded-host') || req.get('host')}`);
    // Браузер для PDF входить із власною короткою сесією, пароль йому не передається.
    const session = credentials() ? { name: COOKIE_NAME, value: createSessionToken() } : null;
    const pdf = await renderPdf(`${clientUrl}/#print=${weekStart}`, session);
    const name = `звіт ${formatDate(weekStart)}-${formatDate(weekEnd(weekStart))}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${req.query.download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(name)}`,
    });
    res.send(pdf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// У продакшені віддаємо зібраний клієнт.
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
});

app.listen(port, () => console.log(`Server: http://localhost:${port}`));
