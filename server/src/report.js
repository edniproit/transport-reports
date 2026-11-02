import { ALL_LINES, SECTIONS, defaultPrices } from './schema.js';
import { weekEnd } from './dates.js';

const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0);
const optional = (v) => (v === null || v === undefined || v === '' ? null : num(v));

// Нормалізує введені дані тижня.
// prices — ціни цього звіту (за відсутності беруться fallbackPrices); сума рядка = кількість * ціна, у штрафів — вручну.
// month — місяць, внесений вручну (null = не внесено): це накопичене з початку місяця значення, воно замінює розрахунок.
// yearBefore — накопичене з початку року до цього тижня.
export function normalizeEntry(raw = {}, fallbackPrices = defaultPrices()) {
  const prices = {};
  const lines = {};
  const month = {};
  const yearBefore = {};
  for (const line of ALL_LINES) {
    const id = line.id;
    if (!line.fine) prices[id] = num(raw.prices?.[id] ?? fallbackPrices[id] ?? line.price);

    const count = num(raw.lines?.[id]?.count);
    lines[id] = { count, sum: line.fine ? num(raw.lines?.[id]?.sum) : count * prices[id] };

    const manual = raw.month?.[id] ?? raw.monthPart?.[id]; // monthPart — стара назва поля
    month[id] = { count: optional(manual?.count), sum: optional(manual?.sum) };

    yearBefore[id] = { count: num(raw.yearBefore?.[id]?.count), sum: num(raw.yearBefore?.[id]?.sum) };
  }
  return { prices, lines, month, yearBefore };
}

// Значення місяця, внесене вручну, або null, якщо рядок рахується автоматично.
function manualMonth(entry, line) {
  const { count, sum } = entry.month[line.id];
  if (count === null && sum === null) return null;
  const counted = count ?? 0;
  return { count: counted, sum: sum ?? (line.fine ? 0 : counted * entry.prices[line.id]) };
}

function emptyPeriod() {
  return { lines: Object.fromEntries(ALL_LINES.map((l) => [l.id, { count: 0, sum: 0 }])) };
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

// entries: { [weekStart]: entry }. Звіти йдуть від першого до обраного.
// Рік — календарний: сума тижнів року плюс накопичене «до тижня».
// Місяць — календарний, перераховується від першого звіту: накопичується за тижнями, а з початку нового місяця
// обнуляється. Тиждень, що перетинає межу місяців, дає в новий місяць лише дні з 1-го числа (за правилом їх
// не можна вивести з тижневих підсумків), тому для нього місяць вносять вручну; без цього він дорівнює 0.
// Місяць, внесений вручну, замінює накопичене значення, а наступні тижні того ж місяця додаються до нього.
export function buildReport(weekStart, entries) {
  const end = weekEnd(weekStart);
  const year = end.slice(0, 4);
  const week = emptyPeriod();
  const monthP = emptyPeriod();
  const yearP = emptyPeriod();
  let monthKey = null;

  for (const ws of Object.keys(entries).filter((k) => k <= weekStart).sort()) {
    const we = weekEnd(ws);
    const entry = normalizeEntry(entries[ws]);

    const monthOfEnd = we.slice(0, 7);
    if (monthOfEnd !== monthKey) {
      monthKey = monthOfEnd;
      for (const l of ALL_LINES) monthP.lines[l.id] = { count: 0, sum: 0 };
    }
    const crossesMonth = ws.slice(0, 7) !== monthOfEnd;

    for (const l of ALL_LINES) {
      const own = entry.lines[l.id];
      if (ws === weekStart) week.lines[l.id] = { ...own };

      if (we.slice(0, 4) === year) {
        yearP.lines[l.id].count += own.count + entry.yearBefore[l.id].count;
        yearP.lines[l.id].sum += own.sum + entry.yearBefore[l.id].sum;
      }

      const manual = manualMonth(entry, l);
      if (manual) monthP.lines[l.id] = manual;
      else if (!crossesMonth) {
        monthP.lines[l.id].count += own.count;
        monthP.lines[l.id].sum += own.sum;
      }
    }
  }

  return {
    weekStart,
    weekEnd: end,
    monthStart: `${end.slice(0, 7)}-01`,
    yearStart: `${year}-01-01`,
    week: withTotals(week),
    month: withTotals(monthP),
    year: withTotals(yearP),
  };
}
