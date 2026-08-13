'use strict';
/**
 * SALONEAUTOLINK — NETLIFY SERVERLESS API FUNCTION
 */

const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const multer     = require('multer');
const serverless = require('serverless-http');

const cloudStorage                       = require('../services/cloudStorage');
const { initDatabase, query, run, get } = require('../database/db');
const { signToken, requireAuth }         = require('../middleware/auth');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serverless Database Auto-Init Middleware
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

const storage = multer.memoryStorage();
const upload  = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

const ok   = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

function mapVehicle(v) {
  if (!v) return null;
  let images = [];
  try { images = JSON.parse(v.images || '[]'); } catch { images = []; }
  return { ...v, featured: Boolean(v.featured), images };
}

// ──────────────────────────────────────────────
// AUTH ROUTES (Support both /api/auth/* and /auth/*)
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

app.post(['/api/auth/login', '/auth/login'], handleLogin);

app.get(['/api/auth/me', '/auth/me'], requireAuth, async (req, res) => {
  try {
    const user = await get('SELECT id,name,email,role,avatar,created_at FROM users WHERE id = ?', [req.admin.id]);
    if (!user) return fail(res, 'User not found.', 404);
    return ok(res, { user });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

app.patch(['/api/auth/password', '/auth/password'], requireAuth, async (req, res) => {
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

app.put(['/api/auth/profile', '/auth/profile'], requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    const { name, email, avatarUrl } = req.body;
    if (!name || !email) return fail(res, 'Name and email are required.');

    const existing = await get('SELECT id FROM users WHERE email = ? AND id != ?', [email.trim().toLowerCase(), req.admin.id]);
    if (existing) return fail(res, 'This email is already in use by another account.', 400);

    let newAvatar = avatarUrl || undefined;
    if (req.file) {
      newAvatar = await cloudStorage.processAndUploadImage(req.file.buffer, req.file.originalname);
    }

    const currentUser = await get('SELECT avatar FROM users WHERE id = ?', [req.admin.id]);
    const finalAvatar = newAvatar !== undefined ? newAvatar : (currentUser?.avatar || null);

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
async function handleVehiclesList(req, res) {
  try {
    const {
      brand, model, year, body, transmission, fuel,
      price, mileage, colour, location, condition, status,
      search, featured, sort, limit = 50, offset = 0
    } = req.query;

    let sql  = 'SELECT * FROM vehicles WHERE 1=1';
    const p  = [];

    if (status && status !== 'all') { sql += ' AND LOWER(status) = LOWER(?)'; p.push(status); }
    else if (req.query.all !== 'true' && req.query.all !== '1') { sql += " AND status != 'draft'"; }

    if (brand)   { sql += ' AND LOWER(brand) = LOWER(?)'; p.push(brand); }
    if (model)   { sql += ' AND LOWER(model) LIKE LOWER(?)'; p.push(`%${model}%`); }
    if (year)    { sql += ' AND year = ?'; p.push(parseInt(year)); }
    if (body)    { sql += ' AND LOWER(body) = LOWER(?)'; p.push(body); }
    if (transmission) { sql += ' AND LOWER(transmission) LIKE LOWER(?)'; p.push(`%${transmission}%`); }
    if (fuel)    { sql += ' AND LOWER(fuel) = LOWER(?)'; p.push(fuel); }
    if (colour)  { sql += ' AND LOWER(colour) LIKE LOWER(?)'; p.push(`%${colour}%`); }
    if (location){ sql += ' AND LOWER(location) = LOWER(?)'; p.push(location); }
    if (condition){ sql += ' AND LOWER(condition_type) = LOWER(?)'; p.push(condition); }
    if (featured === 'true' || featured === '1') { sql += ' AND featured = 1'; }

    if (search) {
      sql += ' AND (LOWER(title) LIKE LOWER(?) OR LOWER(brand) LIKE LOWER(?) OR LOWER(model) LIKE LOWER(?))';
      const q = `%${search}%`;
      p.push(q, q, q);
    }

    const sortMap = {
      price_asc:  'price ASC', price_desc: 'price DESC',
      year_desc:  'year DESC', year_asc:   'year ASC',
      newest:     'created_at DESC', featured: 'featured DESC, created_at DESC'
    };
    sql += ` ORDER BY ${sortMap[sort] || 'featured DESC, id ASC'}`;
    sql += ' LIMIT ? OFFSET ?';

    const rawVehicles = await query(sql, [...p, parseInt(limit), parseInt(offset)]);
    const vehicles    = rawVehicles.map(mapVehicle);

    const countSql = sql.replace(/SELECT \*/, 'SELECT COUNT(*) as c').replace(/ORDER BY.+$/, '');
    const totalRow = await get(countSql, p);
    const total    = totalRow?.c || vehicles.length;

    return ok(res, { vehicles, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

app.get(['/api/vehicles', '/vehicles'], handleVehiclesList);

app.get(['/api/vehicles/:id', '/vehicles/:id'], async (req, res) => {
  try {
    const vehicle = await get('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (!vehicle) return fail(res, 'Vehicle not found.', 404);
    return ok(res, { vehicle: mapVehicle(vehicle) });
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

app.all('*', (req, res) => {
  return res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

const serverlessHandler = serverless(app);

module.exports.handler = async (event, context) => {
  try {
    return await serverlessHandler(event, context);
  } catch (err) {
    console.error('Netlify API Error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: err.message || 'Server error.' }),
    };
  }
};
