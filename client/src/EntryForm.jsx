import { useEffect, useState } from 'react';
import { api } from './api.js';
import { formatDate, formatNumber, weekEnd } from './dates.js';

const toValue = (n) => (n ? String(n) : '');
const cellValue = (n) => (n === null || n === undefined ? '' : String(n));
const days = (n) => (n === 1 ? 'день' : n < 5 ? 'дні' : 'днів');

export default function EntryForm({ schema, weekStart, isFirst, onDone, onDeleted }) {
  const [entry, setEntry] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.getWeek(weekStart).then(setEntry).catch((e) => setStatus(e.message));
  }, [weekStart]);

  if (!entry) return <p className="muted">{status || 'Завантаження…'}</p>;

  const lines = schema.sections.flatMap((s) => s.lines);
  const end = weekEnd(weekStart);
  const crossesMonth = weekStart.slice(0, 7) !== end.slice(0, 7);
  const daysInNewMonth = Number(end.slice(8));

  const setLine = (id, field, value) => {
    const n = Math.max(0, Number(value) || 0);
    setEntry((e) => ({ ...e, lines: { ...e.lines, [id]: { ...e.lines[id], [field]: n } } }));
  };
  const setPrice = (id, value) => setEntry((e) => ({ ...e, prices: { ...e.prices, [id]: Math.max(0, Number(value) || 0) } }));

  // Порожнє поле місяця = null: місяць рахується автоматично.
  const setMonth = (id, field, value) =>
    setEntry((e) => ({ ...e, month: { ...e.month, [id]: { ...e.month[id], [field]: value === '' ? null : Math.max(0, Number(value) || 0) } } }));
  const setYearBefore = (id, field, value) =>
    setEntry((e) => ({ ...e, yearBefore: { ...e.yearBefore, [id]: { ...e.yearBefore[id], [field]: Math.max(0, Number(value) || 0) } } }));

  const save = async () => {
    try {
      setStatus('Збереження…');
      await api.saveWeek(weekStart, entry);
      setStatus('Збережено');
      onDone();
    } catch (e) {
      setStatus(e.message);
    }
  };

  const remove = async () => {
    if (!window.confirm('Видалити звіт за цей тиждень?')) return;
    try {
      await api.deleteWeek(weekStart);
      onDeleted();
    } catch (e) {
      setStatus(e.message);
    }
  };

  return (
    <div className="no-print">
      <div className="sections">
        {schema.sections.map((section) => (
          <section key={section.id} className="card">
            <h2>{section.title}</h2>
            <div className="rows head">
              <span>Показник</span>
              <span>Ціна, грн</span>
              <span>Кількість</span>
              <span>Сума, грн</span>
            </div>
            {section.lines.map((line) => {
              const v = entry.lines[line.id];
              return (
                <div key={line.id} className="rows">
                  <label htmlFor={`${line.id}-count`}>{line.title}</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    aria-label={`${line.title}: ціна`}
                    title="Ціна за замовчуванням з поточних тарифів; можна змінити"
                    value={cellValue(entry.prices[line.id])}
                    onChange={(e) => setPrice(line.id, e.target.value)}
                  />
                  <input id={`${line.id}-count`} type="number" min="0" inputMode="numeric" placeholder="0" value={toValue(v.count)} onChange={(e) => setLine(line.id, 'count', e.target.value)} />
                  <span className="auto" title="Кількість × ціна">
                    {formatNumber(v.count * entry.prices[line.id])}
                  </span>
                </div>
              );
            })}
          </section>
        ))}
      </div>

      <details className="card adjust" open={crossesMonth}>
        <summary>Місяць: внести вручну</summary>
        {crossesMonth && (
          <p className="notice">
            Цей тиждень ({formatDate(weekStart)} – {formatDate(end)}) перетинає межу місяців: у новий місяць потрапляє лише {daysInNewMonth}{' '}
            {days(daysInNewMonth)}. Їх не можна вивести з тижневих підсумків, тому внесіть місячні цифри нижче. Поки поля порожні, місяць у звіті дорівнює 0.
          </p>
        )}
        <p className="muted">
          Звичайно місяць рахується автоматично з початку місяця. Якщо ввести значення, воно замінить розрахунок для цього рядка (внесіть накопичене з початку
          місяця), а наступні тижні цього місяця додаватимуться до нього. Порожньо = автоматично. Якщо сума порожня, вона = кількість × ціна.
        </p>
        <div className="rows month-rows head">
          <span>Показник</span>
          <span>Місяць, к-сть</span>
          <span>Місяць, грн</span>
        </div>
        {lines.map((line) => {
          const m = entry.month[line.id];
          const autoSum = m.count !== null ? String(m.count * entry.prices[line.id]) : 'авто';
          return (
            <div key={line.id} className="rows month-rows">
              <span>{line.title}</span>
              <input type="number" min="0" inputMode="decimal" placeholder="авто" aria-label={`${line.title}: місяць, кількість`} value={cellValue(m.count)} onChange={(e) => setMonth(line.id, 'count', e.target.value)} />
              <input type="number" min="0" inputMode="decimal" placeholder={autoSum} aria-label={`${line.title}: місяць, сума`} value={cellValue(m.sum)} onChange={(e) => setMonth(line.id, 'sum', e.target.value)} />
            </div>
          );
        })}
      </details>

      <details className="card adjust">
        <summary>Рік: накопичене до цього тижня</summary>
        <p className="muted">Рік складається з тижнів автоматично. Тут вносять накопичене з початку року до цього тижня, зазвичай один раз — у першому звіті.</p>
        <div className="rows month-rows head">
          <span>Показник</span>
          <span>До тижня, к-сть</span>
          <span>До тижня, грн</span>
        </div>
        {lines.map((line) => (
          <div key={line.id} className="rows month-rows">
            <span>{line.title}</span>
            {['count', 'sum'].map((field) => (
              <input
                key={field}
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="0"
                aria-label={`${line.title}: рік до тижня, ${field === 'count' ? 'кількість' : 'сума'}`}
                value={toValue(entry.yearBefore[line.id][field])}
                onChange={(e) => setYearBefore(line.id, field, e.target.value)}
              />
            ))}
          </div>
        ))}
      </details>

      <div className="actions">
        <button className="btn primary" onClick={save}>Зберегти і показати звіт</button>
        {!isFirst && <button className="btn" onClick={remove}>Видалити звіт</button>}
        <span className="muted">{status}</span>
      </div>
    </div>
  );
}
