import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, normalizeEntry } from './report.js';

// Звіт із кількостями; ціни беруться за замовчуванням (разовий електротранспорт 10, автобус по 25 грн).
const entry = (busCount, tramCount = 10, extra = {}) => ({
  lines: { bus_25: { count: busCount }, tram_single: { count: tramCount } },
  ...extra,
});

test('сума рядка = кількість * ціна, а ціну можна змінити в звіті', () => {
  const r = buildReport('2026-10-19', { '2026-10-19': entry(4, 10, { prices: { tram_single: 12 } }) });
  assert.equal(r.week.lines.bus_25.sum, 100);
  assert.equal(r.week.lines.tram_single.sum, 120);
  assert.equal(r.week.totals.all.sum, 220);
});

test('новий звіт успадковує ціни, а відсутні ціни беруться за замовчуванням', () => {
  assert.equal(normalizeEntry({}, { tram_single: 11 }).prices.tram_single, 11);
  assert.equal(normalizeEntry({}).prices.tram_1m, 600);
  assert.equal(normalizeEntry({ prices: { tram_1m: 650 } }, { tram_1m: 700 }).prices.tram_1m, 650);
});

test('місяць накопичується за тижнями й обнуляється з початком нового місяця', () => {
  const all = {
    '2026-10-05': entry(1),
    '2026-10-12': entry(2),
    '2026-10-19': entry(3),
  };
  assert.equal(buildReport('2026-10-19', all).month.lines.bus_25.count, 6);
  assert.equal(buildReport('2026-10-12', all).month.lines.bus_25.count, 3);
  // Тиждень 02.11–08.11 повністю в листопаді: місяць = лише він.
  all['2026-11-02'] = entry(5);
  assert.equal(buildReport('2026-11-02', all).month.lines.bus_25.count, 5);
});

test('тиждень на межі місяців: без ручних даних місяць 0, з ними — внесене значення', () => {
  const all = { '2026-10-19': entry(3), '2026-10-26': entry(100) };
  const auto = buildReport('2026-10-26', all);
  assert.equal(auto.week.lines.bus_25.count, 100);
  assert.equal(auto.month.lines.bus_25.count, 0);

  all['2026-10-26'] = entry(100, 10, { month: { bus_25: { count: 36, sum: 900 }, tram_single: { count: 0, sum: 0 } } });
  const manual = buildReport('2026-10-26', all);
  assert.equal(manual.month.lines.bus_25.count, 36);
  assert.equal(manual.month.lines.bus_25.sum, 900);
  assert.equal(manual.month.lines.tram_single.sum, 0);
});

test('місяць, внесений вручну, замінює накопичене, а далі тижні додаються до нього', () => {
  const all = {
    '2026-10-05': entry(1),
    '2026-10-12': entry(2, 10, { month: { bus_25: { count: 500 } } }),
    '2026-10-19': entry(3),
  };
  assert.equal(buildReport('2026-10-12', all).month.lines.bus_25.count, 500);
  assert.equal(buildReport('2026-10-12', all).month.lines.bus_25.sum, 500 * 25); // сума без введення = кількість * ціна
  assert.equal(buildReport('2026-10-19', all).month.lines.bus_25.count, 503);
});

test('старе поле monthPart читається як ручний місяць', () => {
  const r = buildReport('2026-10-26', { '2026-10-26': entry(100, 10, { monthPart: { bus_25: { count: 36, sum: 900 } } }) });
  assert.equal(r.month.lines.bus_25.count, 36);
});

test('рік: тижні календарного року плюс накопичене до тижня, попередній рік не враховується', () => {
  const all = {
    '2025-12-22': entry(7),
    '2026-01-05': entry(1, 10, { yearBefore: { bus_25: { count: 1000, sum: 25000 } } }),
  };
  const r = buildReport('2026-01-05', all);
  assert.equal(r.year.lines.bus_25.count, 1001);
  assert.equal(r.year.lines.bus_25.sum, 25025);
  assert.equal(r.week.lines.bus_25.count, 1);
});

test('штрафи: окремо в кількостях, у сумах входять до розділу, у платежах враховані', () => {
  const e = entry(2, 10);
  e.lines.tram_fine = { count: 3, sum: 600 };
  const r = buildReport('2026-10-19', { '2026-10-19': e });
  const tram = r.week.totals.sections.tram;
  assert.equal(tram.count, 10);
  assert.equal(tram.fines, 3);
  assert.equal(tram.sum, 100 + 600);
  assert.equal(r.week.totals.payments, 10 + 2 + 3);
});
