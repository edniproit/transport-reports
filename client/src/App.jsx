import { useEffect, useState } from 'react';
import { api } from './api.js';
import { formatDate, lastWeekStart, mondayOf, shiftWeek, weekEnd } from './dates.js';
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
  const [weekStart, setWeekStart] = useState(lastWeekStart());
  const [tab, setTab] = useState(window.location.hash === '#report' ? 'report' : 'entry');
  const [savedWeeks, setSavedWeeks] = useState([]);
  const [error, setError] = useState('');

  const refreshWeeks = () => api.weeks().then(setSavedWeeks).catch((e) => setError(e.message));

  useEffect(() => {
    api.schema().then(setSchema).catch((e) => setError(e.message));
    refreshWeeks();
  }, []);

  const end = weekEnd(weekStart);

  return (
    <div className="page">
      <div className="topbar no-print">
        <span className="eyebrow">Щотижнева статистика · оплата транспорту</span>
        <Logo />
      </div>

      <section className="hero no-print">
        <h1>
          Звіт з оплати <span>проїзду</span>
        </h1>
        <p>Внесіть результати минулого тижня — зведений звіт за тиждень, місяць і рік сформується сам.</p>
        <div className="pills">
          <span className="pill">Електротранспорт</span>
          <span className="pill">Автобуси</span>
          <span className="pill">Штрафи</span>
        </div>
      </section>

      <section className="card week-card no-print">
        <div className="stepper">
          <button className="icon-btn" aria-label="Попередній тиждень" onClick={() => setWeekStart(shiftWeek(weekStart, -1))}>
            ←
          </button>
          <div className="week-range">
            <small>Звітний тиждень</small>
            <strong>
              {formatDate(weekStart)} – {formatDate(end)}
            </strong>
          </div>
          <button className="icon-btn" aria-label="Наступний тиждень" onClick={() => setWeekStart(shiftWeek(weekStart, 1))}>
            →
          </button>
          <input
            className="date-input"
            type="date"
            aria-label="Будь-яка дата тижня"
            value={weekStart}
            onChange={(e) => e.target.value && setWeekStart(mondayOf(e.target.value))}
          />
        </div>
        {savedWeeks.length > 0 && (
          <div className="saved">
            <span className="muted">Збережені:</span>
            {savedWeeks.slice(0, 8).map((w) => (
              <button key={w} className={`chip ${w === weekStart ? 'active' : ''}`} onClick={() => setWeekStart(w)}>
                {formatDate(w)}
              </button>
            ))}
          </div>
        )}
      </section>

      <nav className="tabs no-print">
        <button className={tab === 'entry' ? 'active' : ''} onClick={() => setTab('entry')}>
          1 · Введення даних
        </button>
        <button className={tab === 'report' ? 'active' : ''} onClick={() => setTab('report')}>
          2 · Зведений звіт
        </button>
      </nav>

      {error && <p className="error">{error}</p>}
      {!schema ? (
        <p className="muted">Завантаження…</p>
      ) : tab === 'entry' ? (
        <EntryForm key={weekStart} schema={schema} weekStart={weekStart} onSaved={refreshWeeks} onDone={() => setTab('report')} />
      ) : (
        <Report key={weekStart} weekStart={weekStart} />
      )}
    </div>
  );
}
