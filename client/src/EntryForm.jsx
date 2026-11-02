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

  // Порожнє поле «частини тижня» = null: у місяць іде весь тиждень.
  const setPart = (group, id, field, value) =>
    setEntry((e) => ({
      ...e,
      [group]: { ...e[group], [id]: { ...e[group][id], [field]: value === '' ? null : Math.max(0, Number(value) || 0) } },
    }));
  const cellValue = (n) => (n === null || n === undefined ? '' : String(n));

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
        <summary>Місяць і рік: додаткові дані</summary>
        <p className="muted">
          Місяць і рік складаються з тижнів автоматично. Заповнюйте лише якщо потрібно: «У місяці» — скільки з цього тижня припадає на місяць звіту,
          коли тиждень перетинає межу місяців (порожньо = увесь тиждень); «Рік до тижня» — накопичене з початку року до цього тижня.
        </p>
        <div className="rows adjust-rows head">
          <span>Показник</span>
          <span>У місяці, к-сть</span>
          <span>У місяці, грн</span>
          <span>Рік до тижня, к-сть</span>
          <span>Рік до тижня, грн</span>
        </div>
        {schema.sections.flatMap((s) => s.lines).map((line) => (
          <div key={line.id} className="rows adjust-rows">
            <span>{line.title}</span>
            {[['monthPart', 'count'], ['monthPart', 'sum'], ['yearBefore', 'count'], ['yearBefore', 'sum']].map(([group, field]) => {
              const label = `${line.title}: ${group === 'monthPart' ? 'у місяці' : 'рік до тижня'}, ${field === 'count' ? 'кількість' : 'сума'}`;
              if (group === 'monthPart' && field === 'sum' && line.price) {
                const count = entry.monthPart[line.id].count;
                return <span key={group + field} className="auto">{count === null ? '' : formatNumber(count * line.price)}</span>;
              }
              return (
                <input
                  key={group + field}
                  type="number"
                  min="0"
                  inputMode="decimal"
                  placeholder={group === 'monthPart' ? 'весь' : '0'}
                  aria-label={label}
                  value={group === 'monthPart' ? cellValue(entry[group][line.id][field]) : toValue(entry[group][line.id][field])}
                  onChange={(e) => setPart(group, line.id, field, e.target.value)}
                />
              );
            })}
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
