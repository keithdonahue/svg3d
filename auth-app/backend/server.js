import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import db from './db.js';

const isProd = process.env.NODE_ENV === 'production';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production';
if (isProd && SESSION_SECRET === 'change-me-in-production') {
  console.error('Set SESSION_SECRET in production. Exiting.');
  process.exit(1);
}

const BCRYPT_ROUNDS = Math.min(12, Math.max(10, parseInt(process.env.BCRYPT_ROUNDS || '10', 10)));
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  session({
    name: 'auth.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
  },
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many registrations. Try again later.' });
  },
});

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
app.post('/api/register', registerLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const password_hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
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
app.post('/api/login', loginLimiter, (req, res) => {
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
