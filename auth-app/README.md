# Auth App – Login & Register

A simple login and registration app with **React** (frontend) and **Node.js/Express** (backend). Passwords are **hashed** with bcrypt (never stored in plain text), and a **session cookie** keeps you logged in.

## What’s included

- **Register** – Create account (email + password, min 6 characters)
- **Login** – Sign in; starts a session cookie
- **Session** – `express-session` with HTTP-only cookie (24h)
- **Database** – SQLite (`auth.db` in `backend/`)
- **Password storage** – bcrypt hashing (one-way, not reversible)

## Run the app

### 1. Backend

```bash
cd auth-app/backend
npm install
npm run dev
```

API runs at **http://localhost:3001**.

### 2. Frontend

In a second terminal:

```bash
cd auth-app/frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**. The Vite dev server proxies `/api` to the backend so cookies work correctly.

## Flow

1. **Register** → password is hashed with bcrypt → user row in SQLite → session created → cookie set → redirect to dashboard.
2. **Login** → password checked with bcrypt → session created → cookie set → redirect to dashboard.
3. **Dashboard** → React calls `GET /api/me` with `credentials: 'include'` → server reads session cookie → returns current user or `null`.
4. **Logout** → `POST /api/logout` destroys session and clears cookie.

## Production notes

- Set `SESSION_SECRET` to a long random string.
- Use HTTPS and set `cookie.secure: true` (already conditional on `NODE_ENV=production`).
- Replace SQLite with PostgreSQL/MySQL if you need multi-process or scale.
