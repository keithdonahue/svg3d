import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from './api';

export default function Login({ onLogin, fetchOptions }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    fetch(API_BASE + '/api/login', {
      method: 'POST',
      ...fetchOptions,
      body: JSON.stringify({ email, password }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setSubmitting(false);
          return;
        }
        onLogin(data.user);
      })
      .catch(() => {
        setError('Connection error. Try again.');
        setSubmitting(false);
      });
  };

  return (
    <div className="card">
      <h1>Log in</h1>
      <p className="subtitle">Sign in with your account</p>
      <form className="form" onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="toggle">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
