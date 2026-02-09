import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust first proxy if behind one (e.g. in production)
app.set('trust proxy', 1);

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:5173', // Vite dev server
    credentials: true,
  })
);

app.use(
  session({
    name: 'auth.sid',
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// --- Auth helpers ---
function getUserId(req) {
  return req.session?.userId ?? null;
}

// --- Routes ---

// Current user (for frontend to check session)
app.get('/api/me', (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.json({ user: null });
  }
  const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(userId);
  if (!user) {
    req.session.userId = undefined;
    return res.json({ user: null });
  }
  res.json({ user: { id: user.id, email: user.email, createdAt: user.created_at } });
});

// Register
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const password_hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email.trim().toLowerCase(), password_hash);
    const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    req.session.userId = user.id;
    res.status(201).json({ user: { id: user.id, email: user.email, createdAt: user.created_at } });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  req.session.userId = user.id;
  res.json({ user: { id: user.id, email: user.email } });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('auth.sid');
    res.json({ ok: true });
  });
});

app.listen(PORT, () => {
  console.log(`Auth API running at http://localhost:${PORT}`);
});
