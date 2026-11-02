// Будь-яка відповідь 401 означає, що сесія закінчилась: застосунок покаже сторінку входу.
export const UNAUTHORIZED_EVENT = 'unauthorized';

async function request(url, options) {
  const res = await fetch(url, options);
  if (res.status === 401 && !url.endsWith('/api/login')) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Помилка ${res.status}`);
  return res.status === 204 ? null : res.json();
}

const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const api = {
  session: () => request('/api/session'),
  login: (username, password) => request('/api/login', json('POST', { username, password })),
  logout: () => request('/api/logout', { method: 'POST' }),
  schema: () => request('/api/schema'),
  weeks: () => request('/api/weeks'),
  getWeek: (ws) => request(`/api/weeks/${ws}`),
  saveWeek: (ws, entry) => request(`/api/weeks/${ws}`, json('PUT', entry)),
  deleteWeek: (ws) => request(`/api/weeks/${ws}`, { method: 'DELETE' }),
  report: (ws) => request(`/api/report/${ws}`),
};
