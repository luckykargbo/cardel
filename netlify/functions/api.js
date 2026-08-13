'use strict';
/**
 * SALONEAUTOLINK — 100% SELF-CONTAINED NETLIFY SERVERLESS API FUNCTION
 */

const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const serverless = require('serverless-http');

const { initDatabase, query, run, get } = require('../../database/db');
const { signToken, requireAuth }         = require('../../middleware/auth');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database Auto-Init Middleware
let dbInitPromise = null;
app.use(async (req, res, next) => {
  if (!dbInitPromise) {
    dbInitPromise = initDatabase().catch(err => {
      console.warn('Turso init note:', err.message);
      return null;
    });
  }
  try { await dbInitPromise; } catch {}
  next();
});

const ok   = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

function mapVehicle(v) {
  if (!v) return null;
  let images = [];
  try { images = JSON.parse(v.images || '[]'); } catch { images = []; }
  return { ...v, featured: Boolean(v.featured), images };
}

// ──────────────────────────────────────────────
// AUTH ROUTES (Support /api/auth/*, /auth/*, and root)
// ──────────────────────────────────────────────
async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 'Email and password are required.');

    const user = await get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (!user) return fail(res, 'Invalid email or password.', 401);

    if (!bcrypt.compareSync(password, user.password)) return fail(res, 'Invalid email or password.', 401);

    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    return ok(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (err) {
    console.error('Login error:', err);
    return fail(res, 'Login failed. Please try again.', 500);
  }
}

app.post(['/api/auth/login', '/auth/login', '/login'], handleLogin);

app.get(['/api/auth/me', '/auth/me', '/me'], requireAuth, async (req, res) => {
  try {
    const user = await get('SELECT id,name,email,role,avatar,created_at FROM users WHERE id = ?', [req.admin.id]);
    if (!user) return fail(res, 'User not found.', 404);
    return ok(res, { user });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

app.patch(['/api/auth/password', '/auth/password', '/password'], requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return fail(res, 'Both current and new passwords are required.');
    if (newPassword.length < 8) return fail(res, 'New password must be at least 8 characters.');

    const user = await get('SELECT password FROM users WHERE id = ?', [req.admin.id]);
    if (!bcrypt.compareSync(currentPassword, user.password)) return fail(res, 'Current password is incorrect.', 401);

    const hashed = bcrypt.hashSync(newPassword, 12);
    await run('UPDATE users SET password = ? WHERE id = ?', [hashed, req.admin.id]);
    return ok(res, { message: 'Password updated successfully.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

app.put(['/api/auth/profile', '/auth/profile', '/profile'], requireAuth, async (req, res) => {
  try {
    const { name, email, avatarUrl } = req.body;
    if (!name || !email) return fail(res, 'Name and email are required.');

    const existing = await get('SELECT id FROM users WHERE email = ? AND id != ?', [email.trim().toLowerCase(), req.admin.id]);
    if (existing) return fail(res, 'This email is already in use by another account.', 400);

    const currentUser = await get('SELECT avatar FROM users WHERE id = ?', [req.admin.id]);
    const finalAvatar = avatarUrl !== undefined ? avatarUrl : (currentUser?.avatar || null);

    await run('UPDATE users SET name = ?, email = ?, avatar = ? WHERE id = ?', [name.trim(), email.trim().toLowerCase(), finalAvatar, req.admin.id]);
    const updated = await get('SELECT id, name, email, role, avatar FROM users WHERE id = ?', [req.admin.id]);

    const token = signToken({ id: updated.id, email: updated.email, name: updated.name, role: updated.role });
    return ok(res, { user: updated, token, message: 'Profile updated successfully.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

// ──────────────────────────────────────────────
// VEHICLES & STATS ROUTES
// ──────────────────────────────────────────────
app.get(['/api/vehicles', '/vehicles'], async (req, res) => {
  try {
    const rawVehicles = await query("SELECT * FROM vehicles WHERE status != 'draft' ORDER BY featured DESC, id ASC LIMIT 50");
    const vehicles    = rawVehicles.map(mapVehicle);
    return ok(res, { vehicles, total: vehicles.length });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

app.get(['/api/stats/public', '/stats/public'], async (_req, res) => {
  try {
    const totalCars   = await get("SELECT COUNT(*) as c FROM vehicles WHERE status = 'available'");
    const totalBrands = await get("SELECT COUNT(DISTINCT brand) as c FROM vehicles WHERE status = 'available'");
    return ok(res, {
      carsAvailable:     totalCars?.c   || 0,
      satisfiedClients:  25,
      brandsCount:       totalBrands?.c || 0,
      satisfactionRate:  99
    });
  } catch (err) {
    return ok(res, { carsAvailable: 0, satisfiedClients: 25, brandsCount: 0, satisfactionRate: 99 });
  }
});

const serverlessHandler = serverless(app);

module.exports.handler = async (event, context) => {
  return await serverlessHandler(event, context);
};
