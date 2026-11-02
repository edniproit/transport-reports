async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Помилка ${res.status}`);
  return res.status === 204 ? null : res.json();
}

export const api = {
  schema: () => request('/api/schema'),
  weeks: () => request('/api/weeks'),
  getWeek: (ws) => request(`/api/weeks/${ws}`),
  saveWeek: (ws, entry) =>
    request(`/api/weeks/${ws}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }),
  deleteWeek: (ws) => request(`/api/weeks/${ws}`, { method: 'DELETE' }),
  report: (ws) => request(`/api/report/${ws}`),
};
