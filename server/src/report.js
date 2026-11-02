import { ALL_LINES, SECTIONS, PAYMENT_STATS } from './schema.js';
import { weekEnd } from './dates.js';

const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0);

// Нормалізує введені дані тижня: рахує суму для рядків з фіксованою ціною.
export function normalizeEntry(raw = {}) {
  const lines = {};
  for (const line of ALL_LINES) {
    const count = num(raw.lines?.[line.id]?.count);
    const sum = line.price ? count * line.price : num(raw.lines?.[line.id]?.sum);
    lines[line.id] = { count, sum };
  }
  const payments = {};
  for (const p of PAYMENT_STATS) payments[p.id] = num(raw.payments?.[p.id]);
  return { lines, payments };
}

function emptyPeriod() {
  return { lines: Object.fromEntries(ALL_LINES.map((l) => [l.id, { count: 0, sum: 0 }])), payments: Object.fromEntries(PAYMENT_STATS.map((p) => [p.id, 0])) };
}

function add(acc, entry) {
  for (const l of ALL_LINES) {
    acc.lines[l.id].count += entry.lines[l.id].count;
    acc.lines[l.id].sum += entry.lines[l.id].sum;
  }
  for (const p of PAYMENT_STATS) acc.payments[p.id] += entry.payments[p.id];
}

function withTotals(period) {
  const sections = {};
  let count = 0;
  let sum = 0;
  for (const s of SECTIONS) {
    const t = s.lines.reduce(
      (a, l) => ({ count: a.count + period.lines[l.id].count, sum: a.sum + period.lines[l.id].sum }),
      { count: 0, sum: 0 },
    );
    sections[s.id] = t;
    count += t.count;
    sum += t.sum;
  }
  return { ...period, totals: { sections, all: { count, sum } } };
}

// entries: { [weekStart]: entry }. Місяць і рік рахуються за тижнями, що закінчуються
// в тому ж місяці/році, що й обраний тиждень, і не пізніше за нього.
export function buildReport(weekStart, entries) {
  const end = weekEnd(weekStart);
  const month = end.slice(0, 7);
  const year = end.slice(0, 4);
  const week = emptyPeriod();
  const monthP = emptyPeriod();
  const yearP = emptyPeriod();

  for (const [ws, raw] of Object.entries(entries)) {
    const we = weekEnd(ws);
    if (we > end) continue;
    const entry = normalizeEntry(raw);
    if (ws === weekStart) add(week, entry);
    if (we.slice(0, 7) === month) add(monthP, entry);
    if (we.slice(0, 4) === year) add(yearP, entry);
  }

  return {
    weekStart,
    weekEnd: end,
    week: withTotals(week),
    month: withTotals(monthP),
    year: withTotals(yearP),
  };
}
