import { useEffect, useState } from 'react';
import { api } from './api.js';
import { formatDate, formatNumber } from './dates.js';

const fmt = formatNumber;

export default function Report({ schema, weekStart }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.report(weekStart).then(setReport).catch((e) => setError(e.message));
  }, [weekStart]);

  if (error) return <p className="error">{error}</p>;
  if (!report) return <p>Завантаження…</p>;

  const cell = (period, id) => period.lines[id];

  return (
    <div className="report">
      <div className="no-print actions">
        <button className="primary" onClick={() => window.print()}>Друк / зберегти як PDF</button>
      </div>
      <h2 className="report-title">
        Загальний звіт з {formatDate(report.weekStart)} по {formatDate(report.weekEnd)}
      </h2>
      <p className="hint">
        Тиждень — за обраний період; місяць — з початку місяця; рік — з початку календарного року на кінець тижня.
      </p>

      {schema.sections.map((section) => (
        <section key={section.id}>
          <h3>{section.title}</h3>
          <table>
            <thead>
              <tr>
                <th rowSpan="2">Показник</th>
                <th colSpan="3">Кількість</th>
                <th colSpan="3">Сума, грн</th>
              </tr>
              <tr>
                <th>Тиждень</th><th>Місяць</th><th>Рік</th>
                <th>Тиждень</th><th>Місяць</th><th>Рік</th>
              </tr>
            </thead>
            <tbody>
              {section.lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.title}</td>
                  {['count', 'sum'].flatMap((f) =>
                    ['week', 'month', 'year'].map((p) => <td key={f + p}>{fmt(cell(report[p], line.id)[f])}</td>),
                  )}
                </tr>
              ))}
              <tr className="total">
                <td>Разом: {section.title.toLowerCase()}</td>
                {['count', 'sum'].flatMap((f) =>
                  ['week', 'month', 'year'].map((p) => <td key={f + p}>{fmt(report[p].totals.sections[section.id][f])}</td>),
                )}
              </tr>
            </tbody>
          </table>
        </section>
      ))}

      <section>
        <h3>Загальна сума</h3>
        <table>
          <thead>
            <tr><th></th><th>Тиждень</th><th>Місяць</th><th>Рік</th></tr>
          </thead>
          <tbody>
            <tr className="total">
              <td>Загальна кількість</td>
              {['week', 'month', 'year'].map((p) => <td key={p}>{fmt(report[p].totals.all.count)}</td>)}
            </tr>
            <tr className="total">
              <td>Загальна сума, грн</td>
              {['week', 'month', 'year'].map((p) => <td key={p}>{fmt(report[p].totals.all.sum)}</td>)}
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3>Статистика платежів</h3>
        <table>
          <thead>
            <tr><th></th><th>Тиждень</th><th>Місяць</th><th>Рік</th></tr>
          </thead>
          <tbody>
            {schema.payments.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                {['week', 'month', 'year'].map((per) => <td key={per}>{fmt(report[per].payments[p.id])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
