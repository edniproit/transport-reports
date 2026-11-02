// Дати зберігаємо як рядки YYYY-MM-DD і працюємо в UTC, щоб уникнути зсувів часових поясів.

const DAY = 24 * 60 * 60 * 1000;

export function parseISO(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
}

export function toISO(d) {
  return d.toISOString().slice(0, 10);
}

export function isMonday(s) {
  const d = parseISO(s);
  return d !== null && d.getUTCDay() === 1;
}

export function weekEnd(weekStart) {
  return toISO(new Date(parseISO(weekStart).getTime() + 6 * DAY));
}
