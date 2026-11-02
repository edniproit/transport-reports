import { ALL_LINES, SECTIONS } from './schema.js';
import { weekEnd } from './dates.js';

const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0);
const optional = (v) => (v === null || v === undefined || v === '' ? null : num(v));

// Нормалізує введені дані тижня: рахує суму для рядків з фіксованою ціною.
// monthPart — частина тижня, що потрапляє в місяць звіту, якщо тиждень перетинає межу місяців
// (null = увесь тиждень). yearBefore — накопичене з початку року до цього тижня.
export function normalizeEntry(raw = {}) {
  const lines = {};
  const monthPart = {};
  const yearBefore = {};
  for (const line of ALL_LINES) {
    const count = num(raw.lines?.[line.id]?.count);
    lines[line.id] = { count, sum: line.price ? count * line.price : num(raw.lines?.[line.id]?.sum) };

    const partCount = optional(raw.monthPart?.[line.id]?.count);
    const partSum = line.price ? (partCount === null ? null : partCount * line.price) : optional(raw.monthPart?.[line.id]?.sum);
    monthPart[line.id] = { count: partCount, sum: partSum };

    yearBefore[line.id] = { count: num(raw.yearBefore?.[line.id]?.count), sum: num(raw.yearBefore?.[line.id]?.sum) };
  }
  return { lines, monthPart, yearBefore };
}

function emptyPeriod() {
  return { lines: Object.fromEntries(ALL_LINES.map((l) => [l.id, { count: 0, sum: 0 }])) };
}

// period: 'month' бере monthPart замість повного тижня, 'year' додає yearBefore.
function add(acc, entry, period) {
  for (const l of ALL_LINES) {
    const own = entry.lines[l.id];
    let { count, sum } = own;
    if (period === 'month') {
      count = entry.monthPart[l.id].count ?? own.count;
      sum = entry.monthPart[l.id].sum ?? own.sum;
    } else if (period === 'year') {
      count += entry.yearBefore[l.id].count;
      sum += entry.yearBefore[l.id].sum;
    }
    acc.lines[l.id].count += count;
    acc.lines[l.id].sum += sum;
  }
}

// Як у зразку звіту: «Загальна кількість» розділу — без штрафів (вони в окремій таблиці),
// «Загальна сума» — разом зі штрафами. Кількість платежів = усі кількості, включно зі штрафами.
function withTotals(period) {
  const sections = {};
  const all = { count: 0, fines: 0, sum: 0 };
  for (const s of SECTIONS) {
    const t = { count: 0, fines: 0, sum: 0 };
    for (const l of s.lines) {
      const v = period.lines[l.id];
      if (l.fine) t.fines += v.count;
      else t.count += v.count;
      t.sum += v.sum;
    }
    sections[s.id] = t;
    all.count += t.count;
    all.fines += t.fines;
    all.sum += t.sum;
  }
  return { ...period, totals: { sections, all, payments: all.count + all.fines } };
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
    if (we.slice(0, 7) === month) add(monthP, entry, 'month');
    if (we.slice(0, 4) === year) add(yearP, entry, 'year');
  }

  return {
    weekStart,
    weekEnd: end,
    monthStart: `${month}-01`,
    yearStart: `${year}-01-01`,
    week: withTotals(week),
    month: withTotals(monthP),
    year: withTotals(yearP),
  };
}
