import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Register({ onRegister, fetchOptions }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    fetch('/api/register', {
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
        onRegister(data.user);
      })
      .catch(() => {
        setError('Connection error. Try again.');
        setSubmitting(false);
      });
  };

  return (
    <div className="card">
      <h1>Create account</h1>
      <p className="subtitle">Register to get started</p>
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
            placeholder="At least 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p className="toggle">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
