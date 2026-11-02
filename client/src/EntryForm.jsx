import { useEffect, useState } from 'react';
import { api } from './api.js';
import { formatNumber } from './dates.js';

const toValue = (n) => (n ? String(n) : '');

export default function EntryForm({ schema, weekStart, onSaved, onDone }) {
  const [entry, setEntry] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.getWeek(weekStart).then(setEntry).catch((e) => setStatus(e.message));
  }, [weekStart]);

  if (!entry) return <p className="muted">{status || 'Завантаження…'}</p>;

  const setLine = (id, field, value) => {
    const n = Math.max(0, Number(value) || 0);
    setEntry((e) => ({ ...e, lines: { ...e.lines, [id]: { ...e.lines[id], [field]: n } } }));
  };

  const setAdjust = (period, id, field, value) =>
    setEntry((e) => ({
      ...e,
      adjust: { ...e.adjust, [period]: { ...e.adjust[period], [id]: { ...e.adjust[period][id], [field]: Number(value) || 0 } } },
    }));

  const save = async () => {
    try {
      setStatus('Збереження…');
      await api.saveWeek(weekStart, entry);
      setStatus('Збережено');
      onSaved();
      onDone();
    } catch (e) {
      setStatus(e.message);
    }
  };

  const clear = async () => {
    if (!window.confirm('Видалити дані за цей тиждень?')) return;
    await api.deleteWeek(weekStart);
    setEntry(await api.getWeek(weekStart));
    setStatus('Дані тижня видалено');
    onSaved();
  };

  return (
    <div className="no-print">
      <div className="sections">
        {schema.sections.map((section) => (
          <section key={section.id} className="card">
            <h2>{section.title}</h2>
            <div className="rows head">
              <span>Показник</span>
              <span>Кількість</span>
              <span>Сума, грн</span>
            </div>
            {section.lines.map((line) => {
              const v = entry.lines[line.id];
              return (
                <div key={line.id} className="rows">
                  <label htmlFor={`${line.id}-count`}>{line.title}</label>
                  <input id={`${line.id}-count`} type="number" min="0" inputMode="numeric" placeholder="0" value={toValue(v.count)} onChange={(e) => setLine(line.id, 'count', e.target.value)} />
                  {line.price ? (
                    <span className="auto" title="Рахується автоматично">
                      {formatNumber(v.count * line.price)}
                    </span>
                  ) : (
                    <input type="number" min="0" inputMode="decimal" placeholder="0" aria-label={`${line.title}: сума`} value={toValue(v.sum)} onChange={(e) => setLine(line.id, 'sum', e.target.value)} />
                  )}
                </div>
              );
            })}
          </section>
        ))}
      </div>

      <details className="card adjust">
        <summary>Коригування місяця і року</summary>
        <p className="muted">
          Місяць і рік додаються з тижнів автоматично. Тут вносять те, чого в тижнях немає: накопичене з початку року до першого тижня або частину
          тижня, що припадає на попередній місяць (тоді значення від'ємне).
        </p>
        <div className="rows adjust-rows head">
          <span>Показник</span>
          <span>Місяць, к-сть</span>
          <span>Місяць, грн</span>
          <span>Рік, к-сть</span>
          <span>Рік, грн</span>
        </div>
        {schema.sections.flatMap((s) => s.lines).map((line) => (
          <div key={line.id} className="rows adjust-rows">
            <span>{line.title}</span>
            {[['month', 'count'], ['month', 'sum'], ['year', 'count'], ['year', 'sum']].map(([period, field]) => (
              <input
                key={period + field}
                type="number"
                inputMode="decimal"
                placeholder="0"
                aria-label={`${line.title}: ${period === 'month' ? 'місяць' : 'рік'}, ${field === 'count' ? 'кількість' : 'сума'}`}
                value={toValue(entry.adjust[period][line.id][field])}
                onChange={(e) => setAdjust(period, line.id, field, e.target.value)}
              />
            ))}
          </div>
        ))}
      </details>

      <div className="actions">
        <button className="btn primary" onClick={save}>Зберегти і показати звіт</button>
        <button className="btn" onClick={clear}>Очистити тиждень</button>
        <span className="muted">{status}</span>
      </div>
    </div>
  );
}
