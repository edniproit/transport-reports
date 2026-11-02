import { useState } from 'react';
import { formatDate, weekEnd } from './dates.js';

// Перегляд справжнього PDF у вбудованому переглядачі, без завантаження файлу.
export default function Report({ weekStart }) {
  const [loaded, setLoaded] = useState(false);
  const pdfUrl = `/api/report/${weekStart}/pdf`;
  const fileName = `звіт ${formatDate(weekStart)}-${formatDate(weekEnd(weekStart))}.pdf`;

  return (
    <div>
      <div className="report-actions">
        <a className="btn primary" href={`${pdfUrl}?download=1`} download={fileName}>
          Завантажити PDF
        </a>
        <a className="btn" href={pdfUrl} target="_blank" rel="noreferrer">
          Відкрити в новій вкладці
        </a>
        <span className="muted">{fileName}</span>
      </div>

      <div className="pdf-frame">
        {!loaded && <div className="pdf-loading">Формуємо PDF…</div>}
        <iframe title={fileName} src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`} onLoad={() => setLoaded(true)} />
      </div>
    </div>
  );
}
