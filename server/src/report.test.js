import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport } from './report.js';

const entry = (busCount, tramSum, tramFines = 0) => ({
  lines: {
    bus_25: { count: busCount },
    tram_single: { count: 10, sum: tramSum },
    tram_fine: { count: tramFines, sum: tramFines * 200 },
  },
});

test('сума для фіксованої ціни рахується автоматично', () => {
  const r = buildReport('2026-10-19', { '2026-10-19': entry(4, 100) });
  assert.equal(r.week.lines.bus_25.sum, 100);
  assert.equal(r.week.totals.all.sum, 200);
});

test('місяць і рік накопичуються за тижнями до обраного включно', () => {
  const all = {
    '2026-10-05': entry(1, 10),
    '2026-10-12': entry(2, 20),
    '2026-10-19': entry(3, 30),
    '2026-10-26': entry(100, 1000), // пізніше за обраний — не враховується
  };
  const r = buildReport('2026-10-19', all);
  assert.equal(r.week.lines.bus_25.count, 3);
  assert.equal(r.month.lines.bus_25.count, 6);
  assert.equal(r.year.lines.tram_single.sum, 60);
});

test('попередній рік не потрапляє в річну суму', () => {
  const all = { '2025-12-22': entry(7, 70), '2026-01-05': entry(1, 10) };
  const r = buildReport('2026-01-05', all);
  assert.equal(r.year.lines.bus_25.count, 1);
});

test('штрафи: окремо в кількостях, у сумах входять до розділу, у платежах враховані', () => {
  const r = buildReport('2026-10-19', { '2026-10-19': entry(2, 100, 3) });
  const tram = r.week.totals.sections.tram;
  assert.equal(tram.count, 10);
  assert.equal(tram.fines, 3);
  assert.equal(tram.sum, 100 + 600);
  assert.equal(r.week.totals.payments, 10 + 2 + 3);
});
