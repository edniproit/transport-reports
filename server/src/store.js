import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = process.env.DATA_FILE || path.join(here, '..', 'data', 'reports.json');

let queue = Promise.resolve();

export async function readAll() {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw e;
  }
}

// Записи серіалізуємо в чергу, щоб паралельні запити не затирали один одного.
export function update(fn) {
  const run = queue.then(async () => {
    const data = await readAll();
    const result = await fn(data);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(data, null, 2));
    return result;
  });
  queue = run.catch(() => {});
  return run;
}
