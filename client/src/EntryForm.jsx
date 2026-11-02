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

  if (!entry) return <p>{status || 'Завантаження…'}</p>;

  const setLine = (id, field, value) => {
    const n = Math.max(0, Number(value) || 0);
    setEntry((e) => ({ ...e, lines: { ...e.lines, [id]: { ...e.lines[id], [field]: n } } }));
  };
  const setPayment = (id, value) =>
    setEntry((e) => ({ ...e, payments: { ...e.payments, [id]: Math.max(0, Number(value) || 0) } }));

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
    <div>
      {schema.sections.map((section) => (
        <section key={section.id}>
          <h2>{section.title}</h2>
          <table>
            <thead>
              <tr>
                <th>Показник</th>
                <th>Кількість</th>
                <th>Сума, грн</th>
              </tr>
            </thead>
            <tbody>
              {section.lines.map((line) => {
                const v = entry.lines[line.id];
                return (
                  <tr key={line.id}>
                    <td>{line.title}</td>
                    <td>
                      <input type="number" min="0" inputMode="numeric" value={toValue(v.count)} onChange={(e) => setLine(line.id, 'count', e.target.value)} />
                    </td>
                    <td>
                      {line.price ? (
                        <span className="auto">{formatNumber(v.count * line.price)}</span>
                      ) : (
                        <input type="number" min="0" inputMode="decimal" value={toValue(v.sum)} onChange={(e) => setLine(line.id, 'sum', e.target.value)} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}

      <section>
        <h2>Статистика платежів</h2>
        <table>
          <tbody>
            {schema.payments.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>
                  <input type="number" min="0" inputMode="numeric" value={toValue(entry.payments[p.id])} onChange={(e) => setPayment(p.id, e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="actions">
        <button className="primary" onClick={save}>Зберегти і показати звіт</button>
        <button onClick={clear}>Очистити тиждень</button>
        <span className="status">{status}</span>
      </div>
    </div>
  );
}
