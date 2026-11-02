import { useEffect, useState } from 'react';
import { api } from './api.js';
import { formatDate, lastWeekStart, mondayOf, shiftWeek, weekEnd } from './dates.js';
import EntryForm from './EntryForm.jsx';
import Report from './Report.jsx';

export default function App() {
  const [schema, setSchema] = useState(null);
  const [weekStart, setWeekStart] = useState(lastWeekStart());
  const [tab, setTab] = useState('entry');
  const [savedWeeks, setSavedWeeks] = useState([]);
  const [error, setError] = useState('');

  const refreshWeeks = () => api.weeks().then(setSavedWeeks).catch((e) => setError(e.message));

  useEffect(() => {
    api.schema().then(setSchema).catch((e) => setError(e.message));
    refreshWeeks();
  }, []);

  const end = weekEnd(weekStart);

  return (
    <div className="app">
      <header className="no-print">
        <h1>Звіт з оплати проїзду</h1>
        <div className="week-picker">
          <button onClick={() => setWeekStart(shiftWeek(weekStart, -1))}>←</button>
          <label>
            Тиждень з
            <input
              type="date"
              value={weekStart}
              onChange={(e) => e.target.value && setWeekStart(mondayOf(e.target.value))}
            />
          </label>
          <button onClick={() => setWeekStart(shiftWeek(weekStart, 1))}>→</button>
          <span className="range">
            {formatDate(weekStart)} – {formatDate(end)}
          </span>
        </div>
        <nav>
          <button className={tab === 'entry' ? 'active' : ''} onClick={() => setTab('entry')}>
            Введення даних
          </button>
          <button className={tab === 'report' ? 'active' : ''} onClick={() => setTab('report')}>
            Зведений звіт
          </button>
        </nav>
        {savedWeeks.length > 0 && (
          <p className="saved">
            Збережені тижні:{' '}
            {savedWeeks.slice(0, 8).map((w) => (
              <button key={w} className="chip" onClick={() => setWeekStart(w)}>
                {formatDate(w)}
              </button>
            ))}
          </p>
        )}
      </header>

      {error && <p className="error">{error}</p>}
      {!schema ? (
        <p>Завантаження…</p>
      ) : tab === 'entry' ? (
        <EntryForm key={weekStart} schema={schema} weekStart={weekStart} onSaved={refreshWeeks} onDone={() => setTab('report')} />
      ) : (
        <Report key={weekStart} schema={schema} weekStart={weekStart} />
      )}
    </div>
  );
}
