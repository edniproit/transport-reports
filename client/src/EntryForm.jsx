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

      <div className="actions">
        <button className="btn primary" onClick={save}>Зберегти і показати звіт</button>
        <button className="btn" onClick={clear}>Очистити тиждень</button>
        <span className="muted">{status}</span>
      </div>
    </div>
  );
}
