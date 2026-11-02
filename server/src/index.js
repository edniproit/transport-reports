import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { SECTIONS } from './schema.js';
import { formatDate, isMonday, weekEnd } from './dates.js';
import { renderPdf } from './pdf.js';
import { buildReport, normalizeEntry } from './report.js';
import { readAll, update } from './store.js';

const port = process.env.PORT || 3001;
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'client', 'dist');

const app = express();
app.use(cors());
app.use(express.json());

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

// ?download=1 — віддати як файл, інакше PDF відкривається для перегляду без завантаження.
app.get('/api/report/:weekStart/pdf', checkWeek, async (req, res) => {
  const { weekStart } = req.params;
  try {
    // Друкуємо клієнт з тієї ж адреси, з якої прийшов запит (Vite у розробці, сам сервер у продакшені).
    const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('x-forwarded-host') || req.get('host')}`;
    const pdf = await renderPdf(`${clientUrl}/#print=${weekStart}`);
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
  console.error(err);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
});

app.listen(port, () => console.log(`Server: http://localhost:${port}`));
