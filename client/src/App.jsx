import { useEffect, useState } from 'react';
import { api } from './api.js';
import { formatDate, lastWeekStart, shiftWeek, todayISO, weekEnd } from './dates.js';
import EntryForm from './EntryForm.jsx';
import PrintView from './PrintView.jsx';
import Report from './Report.jsx';
import { Logo } from './Logo.jsx';

export default function App() {
  const printWeek = window.location.hash.match(/^#print=(\d{4}-\d{2}-\d{2})$/)?.[1];
  return printWeek ? <PrintView weekStart={printWeek} /> : <Main />;
}

function Main() {
  const [schema, setSchema] = useState(null);
  const [weeks, setWeeks] = useState(null); // створені звіти, найновіші зверху
  const [weekStart, setWeekStart] = useState(null);
  const [tab, setTab] = useState(window.location.hash === '#report' ? 'report' : 'entry');
  const [error, setError] = useState('');

  const loadWeeks = async () => {
    const list = await api.weeks();
    setWeeks(list);
    return list;
  };

  useEffect(() => {
    api.schema().then(setSchema).catch((e) => setError(e.message));
    loadWeeks()
      .then((list) => setWeekStart(list[0] ?? null))
      .catch((e) => setError(e.message));
  }, []);

  const firstWeek = weeks?.length ? weeks[weeks.length - 1] : null;
  // Новий звіт — тиждень після останнього створеного (або минулий тиждень, якщо звітів ще немає).
  const nextWeek = weeks?.length ? shiftWeek(weeks[0], 1) : lastWeekStart();
  const canAdd = weeks !== null && nextWeek <= todayISO();

  const addWeek = async () => {
    try {
      setError('');
      await api.saveWeek(nextWeek, {});
      await loadWeeks();
      setWeekStart(nextWeek);
      setTab('entry');
    } catch (e) {
      setError(e.message);
    }
  };

  const onDeleted = async () => {
    const list = await loadWeeks();
    setWeekStart(list[0] ?? null);
  };

  return (
    <div className="shell">
      <aside className="sidebar no-print">
        <h2>Звіти</h2>
        <ul className="week-list">
          {weeks?.map((w) => (
            <li key={w}>
              <button className={w === weekStart ? 'active' : ''} onClick={() => setWeekStart(w)}>
                <span>
                  {formatDate(w)} – {formatDate(weekEnd(w))}
                </span>
                {w === firstWeek && <small>перший звіт</small>}
              </button>
            </li>
          ))}
          {weeks?.length === 0 && <li className="muted empty">Звітів ще немає</li>}
        </ul>
        <button
          className="add-btn"
          onClick={addWeek}
          disabled={!canAdd}
          aria-label="Додати звіт за новий тиждень"
          title={canAdd ? `Додати звіт: ${formatDate(nextWeek)} – ${formatDate(weekEnd(nextWeek))}` : 'Наступний тиждень ще не розпочався'}
        >
          +
        </button>
      </aside>

      <div className="page">
        <div className="topbar no-print">
          <span className="eyebrow">Щотижнева статистика · оплата транспорту</span>
          <Logo />
        </div>

        <section className="hero no-print">
          <h1>
            Звіт з оплати <span>проїзду</span>
          </h1>
          <p>Внесіть результати тижня — зведений звіт за тиждень, місяць і рік сформується сам.</p>
          <div className="pills">
            <span className="pill">Електротранспорт</span>
            <span className="pill">Автобуси</span>
            <span className="pill">Штрафи</span>
          </div>
        </section>

        {error && <p className="error">{error}</p>}

        {weeks !== null && !weekStart ? (
          <section className="card no-print">
            <h2>Ще немає жодного звіту</h2>
            <p className="muted">Натисніть «+» внизу зліва, щоб створити звіт за минулий тиждень.</p>
          </section>
        ) : (
          weekStart && (
            <>
              <section className="card week-card no-print">
                <div className="week-range">
                  <small>Звітний тиждень{weekStart === firstWeek ? ' · перший звіт' : ''}</small>
                  <strong>
                    {formatDate(weekStart)} – {formatDate(weekEnd(weekStart))}
                  </strong>
                </div>
              </section>

              <nav className="tabs no-print">
                <button className={tab === 'entry' ? 'active' : ''} onClick={() => setTab('entry')}>
                  1 · Введення даних
                </button>
                <button className={tab === 'report' ? 'active' : ''} onClick={() => setTab('report')}>
                  2 · Зведений звіт
                </button>
              </nav>

              {!schema ? (
                <p className="muted">Завантаження…</p>
              ) : tab === 'entry' ? (
                <EntryForm
                  key={weekStart}
                  schema={schema}
                  weekStart={weekStart}
                  isFirst={weekStart === firstWeek}
                  onDone={() => setTab('report')}
                  onDeleted={onDeleted}
                />
              ) : (
                <Report key={weekStart} weekStart={weekStart} />
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
