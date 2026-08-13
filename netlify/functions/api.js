'use strict';
/**
 * SALONEAUTOLINK — 100% SELF-CONTAINED NETLIFY SERVERLESS API FUNCTION
 */

const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const https      = require('https');
const jwt        = require('jsonwebtoken');
const serverless = require('serverless-http');

// ──────────────────────────────────────────────
// TURSO DATABASE DRIVER (Pure HTTPS)
// ──────────────────────────────────────────────
const dbUrl   = process.env.TURSO_DATABASE_URL || 'saloneautolink-luckykargbo.aws-eu-west-1.turso.io';
const dbToken = process.env.TURSO_AUTH_TOKEN     || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY2MDU1NzMsImlkIjoiMDE5ZmVjYWYtNjMwMS03ODAxLTg5NGEtMjUyMzk5MGU0ODdmIiwia2lkIjoiMmhDUHBmTlNYMEpYOEZETDRsYUVreDJpUVBLYTdaZW10bVN0aERfcFdvWSIsInJpZCI6IjY5ODRkZmU0LTlkNDItNDdiNS1hNTJjLTU3M2QwMWI3ZjZmOSJ9.ljuawc9RGPVZbuzRaSKycw6e5eRpYPMEs8lL4saUlvh0ughebcvi6EkcPwGxh9aquMG1GXUvc5bT-m8Dzj88DQ';
const cleanHost = dbUrl.replace(/^libsql:\/\//, '').replace(/^https:\/\//, '').replace(/\/$/, '');

function executePipeline(requests) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ requests });
    const options = {
      hostname: cleanHost,
      port: 443,
      path: '/v2/pipeline',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dbToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Parse error: ' + data)); }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

function formatParam(val) {
  if (val === null || val === undefined) return { type: 'null' };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { type: 'integer', value: String(val) };
    return { type: 'float', value: val };
  }
  return { type: 'text', value: String(val) };
}

function parseCell(cell) {
  if (!cell || cell.type === 'null') return null;
  if (cell.type === 'integer') return parseInt(cell.value, 10);
  if (cell.type === 'float') return parseFloat(cell.value);
  return cell.value;
}

async function query(sql, params = []) {
  const req = { type: 'execute', stmt: { sql, args: params.map(formatParam) } };
  const res = await executePipeline([req, { type: 'close' }]);
  const result = res.results?.[0]?.response?.result;
  if (!result) throw new Error('Turso query error');
  const cols = result.cols.map(c => c.name);
  return result.rows.map(row => {
    const obj = {};
    row.forEach((cell, idx) => { obj[cols[idx]] = parseCell(cell); });
    return obj;
  });
}

async function run(sql, params = []) {
  const req = { type: 'execute', stmt: { sql, args: params.map(formatParam) } };
  const res = await executePipeline([req, { type: 'close' }]);
  const result = res.results?.[0]?.response?.result;
  if (!result) throw new Error('Turso run error');
  return { rowsAffected: result.affected_row_count || 0 };
}

async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

// ──────────────────────────────────────────────
// JWT AUTH
// ──────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'saloneautolink_jwt_secret_onyx_2026';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }
}

// ──────────────────────────────────────────────
// EXPRESS API SERVERLESS
// ──────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const ok   = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

function mapVehicle(v) {
  if (!v) return null;
  let images = [];
  try { images = JSON.parse(v.images || '[]'); } catch { images = []; }
  return { ...v, featured: Boolean(v.featured), images };
}

// LOGIN
app.post(['/api/auth/login', '/auth/login', '/login'], async (req, res) => {
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
});

// AUTH ME
app.get(['/api/auth/me', '/auth/me', '/me'], requireAuth, async (req, res) => {
  try {
    const user = await get('SELECT id,name,email,role,avatar,created_at FROM users WHERE id = ?', [req.admin.id]);
    if (!user) return fail(res, 'User not found.', 404);
    return ok(res, { user });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

// UPDATE PASSWORD
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

// UPDATE PROFILE
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

// VEHICLES LIST
app.get(['/api/vehicles', '/vehicles'], async (req, res) => {
  try {
    const rawVehicles = await query("SELECT * FROM vehicles WHERE status != 'draft' ORDER BY featured DESC, id ASC LIMIT 50");
    const vehicles    = rawVehicles.map(mapVehicle);
    return ok(res, { vehicles, total: vehicles.length });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

// PUBLIC STATS
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
