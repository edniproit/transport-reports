import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { SECTIONS, PAYMENT_STATS } from './schema.js';
import { isMonday } from './dates.js';
import { buildReport, normalizeEntry } from './report.js';
import { readAll, update } from './store.js';

const app = express();
app.use(cors());
app.use(express.json());

const checkWeek = (req, res, next) => {
  if (!isMonday(req.params.weekStart)) {
    return res.status(400).json({ error: 'weekStart має бути понеділком у форматі YYYY-MM-DD' });
  }
  next();
};

app.get('/api/schema', (_req, res) => res.json({ sections: SECTIONS, payments: PAYMENT_STATS }));

app.get('/api/weeks', async (_req, res) => {
  const all = await readAll();
  res.json(Object.keys(all).sort().reverse());
});

app.get('/api/weeks/:weekStart', checkWeek, async (req, res) => {
  const all = await readAll();
  res.json(normalizeEntry(all[req.params.weekStart]));
});

app.put('/api/weeks/:weekStart', checkWeek, async (req, res) => {
  const entry = normalizeEntry(req.body);
  await update((all) => {
    all[req.params.weekStart] = entry;
  });
  res.json(entry);
});

app.delete('/api/weeks/:weekStart', checkWeek, async (req, res) => {
  await update((all) => {
    delete all[req.params.weekStart];
  });
  res.status(204).end();
});

app.get('/api/report/:weekStart', checkWeek, async (req, res) => {
  res.json(buildReport(req.params.weekStart, await readAll()));
});

// У продакшені віддаємо зібраний клієнт.
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'client', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server: http://localhost:${port}`));
