import { useState } from 'react';
import { api } from './api.js';
import bandUrl from './assets/band.svg';

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.login(username.trim(), password);
      onSuccess();
    } catch (e) {
      setError(e.message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <form className="login-card" onSubmit={submit}>
        <img className="login-band" src={bandUrl} alt="єДніпро" />
        <div className="login-body">
          <span className="eyebrow">Щотижнева статистика · оплата транспорту</span>
          <h1>
            Вхід до <span>звітів</span>
          </h1>
          <p className="muted">Введіть логін і пароль, щоб відкрити звіти з оплати проїзду.</p>

          <label className="field">
            <span>Логін</span>
            <input
              type="text"
              name="username"
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Пароль</span>
            <div className="password-row">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="toggle" onClick={() => setShowPassword((v) => !v)} aria-pressed={showPassword}>
                {showPassword ? 'Сховати' : 'Показати'}
              </button>
            </div>
          </label>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button className="btn primary wide" type="submit" disabled={busy || !username || !password}>
            {busy ? 'Входимо…' : 'Увійти'}
          </button>
        </div>
      </form>
    </main>
  );
}
