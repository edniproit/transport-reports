// Переносить тижні з локального server/data/reports.json на розгорнутий сервер.
// Запуск: APP_PASSWORD=... node scripts/import-local-data.mjs https://ваш-застосунок.up.railway.app
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const baseUrl = process.argv[2]?.replace(/\/$/, '');
if (!baseUrl) {
  console.error('Вкажіть адресу сервера: node scripts/import-local-data.mjs https://...');
  process.exit(1);
}

const file = process.env.DATA_FILE || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'server', 'data', 'reports.json');
const weeks = JSON.parse(await readFile(file, 'utf8'));

const headers = { 'Content-Type': 'application/json' };
if (process.env.APP_PASSWORD) {
  headers.Authorization = `Basic ${Buffer.from(`${process.env.APP_USER || 'admin'}:${process.env.APP_PASSWORD}`).toString('base64')}`;
}

// Від найранішого до найпізнішого: сервер не приймає звіти раніше за перший.
for (const weekStart of Object.keys(weeks).sort()) {
  const res = await fetch(`${baseUrl}/api/weeks/${weekStart}`, { method: 'PUT', headers, body: JSON.stringify(weeks[weekStart]) });
  console.log(weekStart, res.ok ? 'ok' : `помилка ${res.status} ${await res.text()}`);
}
