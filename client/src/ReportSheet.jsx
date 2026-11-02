import { formatDate, formatNumber as fmt } from './dates.js';
import { Band, Shield } from './Logo.jsx';

const PERIODS = ['week', 'month', 'year'];
const MARKS = { week: '***', month: '**', year: '*' };
const LABELS = { week: 'Тиждень', month: 'Місяць', year: 'Рік' };

// Таблиця зі зразка: жовта шапка, сірі рядки, блакитний підсумковий рядок.
function SheetTable({ title, unit, marks = true, rows, total }) {
  return (
    <table className="sheet-table">
      <thead>
        <tr>
          <th className="title-cell">{title}</th>
          {PERIODS.map((p) => (
            <th key={p}>
              {marks && <div className="mark">{MARKS[p]}</div>}
              {LABELS[p]}
              <div>({unit})</div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.title}>
            <td>{r.title}</td>
            {r.values.map((v, i) => (
              <td key={i}>{fmt(v)}</td>
            ))}
          </tr>
        ))}
        <tr className="total">
          <td>{total.title}</td>
          {total.values.map((v, i) => (
            <td key={i}>{fmt(v)}</td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

// Аркуш звіту A4 — його ж друкує сервер у PDF.
export default function ReportSheet({ schema, report }) {
  const lineValues = (line, field) => PERIODS.map((p) => report[p].lines[line.id][field]);
  const totalValues = (pick) => PERIODS.map((p) => pick(report[p].totals));
  const title = (l) => l.sheetTitle || l.title;

  const [tram, bus] = schema.sections;
  const countRows = (section) => section.lines.filter((l) => !l.fine).map((l) => ({ title: title(l), values: lineValues(l, 'count') }));
  const sumRows = (section) => section.lines.map((l) => ({ title: title(l), values: lineValues(l, 'sum') }));

  return (
    <article className="sheet">
      <div className="sheet-top">
        <Shield />
        <h1>
          Загальний звіт з {formatDate(report.weekStart)} по {formatDate(report.weekEnd)}
        </h1>
      </div>
      <Band />
      <h2 className="sheet-subtitle">Статистика з оплати транспорту</h2>

      <div className="footnotes">
        <p>*інформація за рік формується за календарний рік (від {formatDate(report.yearStart)} на поточний день)</p>
        <p>**інформація за місяць формується з початку місяця (від {formatDate(report.monthStart)} на поточний день)</p>
        <p>***інформація за тиждень формується з початку тижня (з понеділка на поточний день)</p>
      </div>

      <div className="sheet-cols">
        <div className="col">
          <table className="sheet-table">
            <thead>
              <tr>
                <th className="title-cell">Статистика платежів</th>
                <th>К-сть</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Загальна кількість платежів</td>
                <td>{fmt(report.year.totals.payments)}</td>
              </tr>
              <tr>
                <td>Успішна кількість платежів</td>
                <td>{fmt(report.year.totals.payments)}</td>
              </tr>
            </tbody>
          </table>

          <SheetTable
            title="Статистика оплати проїзду в електротранспорті"
            unit="к-сть."
            rows={countRows(tram)}
            total={{ title: 'Загальна кількість', values: totalValues((t) => t.sections.tram.count) }}
          />
          <SheetTable
            title="Статистика оплати проїзду в автобусах"
            unit="к-сть."
            rows={countRows(bus)}
            total={{ title: 'Загальна кількість', values: totalValues((t) => t.sections.bus.count) }}
          />
          <SheetTable
            title="Штрафи"
            unit="к-сть."
            marks={false}
            rows={[
              { title: 'В електротранспорті', values: totalValues((t) => t.sections.tram.fines) },
              { title: 'В автобусах', values: totalValues((t) => t.sections.bus.fines) },
            ]}
            total={{ title: 'Загальна кількість', values: totalValues((t) => t.all.fines) }}
          />
        </div>

        <div className="col">
          <SheetTable
            title="Сума оплат в електротранспорті"
            unit="грн."
            rows={sumRows(tram)}
            total={{ title: 'Загальна сума в електротранспорті', values: totalValues((t) => t.sections.tram.sum) }}
          />
          <SheetTable
            title="Сума оплат в автобусах"
            unit="грн."
            rows={sumRows(bus)}
            total={{ title: 'Загальна сума в автобусах', values: totalValues((t) => t.sections.bus.sum) }}
          />
          <SheetTable
            title="Сума всіх сплат"
            unit="грн."
            rows={[
              { title: 'Загальна сума в електротранспорті', values: totalValues((t) => t.sections.tram.sum) },
              { title: 'Загальна сума в автобусах', values: totalValues((t) => t.sections.bus.sum) },
            ]}
            total={{ title: 'Загальна сума', values: totalValues((t) => t.all.sum) }}
          />
        </div>
      </div>
    </article>
  );
}
