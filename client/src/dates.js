const DAY = 24 * 60 * 60 * 1000;

const toISO = (d) => d.toISOString().slice(0, 10);

export function mondayOf(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  const shift = (d.getUTCDay() + 6) % 7;
  return toISO(new Date(d.getTime() - shift * DAY));
}

export function shiftWeek(weekStart, weeks) {
  return toISO(new Date(new Date(`${weekStart}T00:00:00Z`).getTime() + weeks * 7 * DAY));
}

export function weekEnd(weekStart) {
  return toISO(new Date(new Date(`${weekStart}T00:00:00Z`).getTime() + 6 * DAY));
}

// Минулий тиждень відносно сьогодні (локальна дата).
export function lastWeekStart() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return shiftWeek(mondayOf(today), -1);
}

export const formatDate = (iso) => iso.split('-').reverse().join('.');

// У шрифті DniproCity немає нерозривного пробілу, яким Intl розділяє розряди, — міняємо на звичайний.
export const formatNumber = (n) => new Intl.NumberFormat('uk-UA').format(n).replace(/ /g, ' ');
