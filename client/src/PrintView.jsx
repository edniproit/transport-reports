import { useEffect, useState } from 'react';
import { api } from './api.js';
import ReportSheet from './ReportSheet.jsx';

// Сторінка лише з аркушем: її відкриває сервер, щоб надрукувати PDF (#print=YYYY-MM-DD).
export default function PrintView({ weekStart }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([api.schema(), api.report(weekStart)]).then(([schema, report]) => setData({ schema, report }));
  }, [weekStart]);

  return data ? <ReportSheet schema={data.schema} report={data.report} /> : null;
}
