import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';

const API = '/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOptions = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };

  useEffect(() => {
    fetch(API + '/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const onLogin = (userData) => {
    setUser(userData);
    navigate('/', { replace: true });
  };

  const onRegister = (userData) => {
    setUser(userData);
    navigate('/', { replace: true });
  };

  const onLogout = () => {
    fetch(API + '/logout', { method: 'POST', ...fetchOptions })
      .then(() => {
        setUser(null);
        navigate('/login', { replace: true });
      })
      .catch(() => setUser(null));
  };

  if (loading) {
    return (
      <div className="app">
        <div className="card">
          <p className="loading">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Dashboard user={user} onLogout={onLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={onLogin} fetchOptions={fetchOptions} />
            )
          }
        />
        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Register onRegister={onRegister} fetchOptions={fetchOptions} />
            )
          }
        />
      </Routes>
    </div>
  );
}
