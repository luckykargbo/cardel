'use strict';
/**
 * SALONEAUTOLINK — NATIVE NETLIFY SERVERLESS API HANDLER (100% PURE NODE BUILT-INS)
 * Zero external npm dependencies inside top-level scope: only native https & crypto!
 */

const https  = require('https');
const crypto = require('crypto');

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
// RESPONSE HELPERS & PURE NODE AUTH
// ──────────────────────────────────────────────
const ok = (data, status = 200) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  },
  body: JSON.stringify({ success: true, ...data })
});

const fail = (message, status = 400) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  },
  body: JSON.stringify({ success: false, message })
});

const JWT_SECRET = process.env.JWT_SECRET || 'saloneautolink_jwt_secret_onyx_2026';

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyAuth(event) {
  const headers = event.headers || {};
  const headerStr = headers.authorization || headers.Authorization || '';
  const token = headerStr.startsWith('Bearer ') ? headerStr.slice(7) : null;
  if (!token) return null;
  try {
    const [h, b, s] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${b}`).digest('base64url');
    if (s !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(b, 'base64url').toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function verifyPassword(password, storedHash) {
  try {
    const bcrypt = require('bcryptjs');
    return bcrypt.compareSync(password, storedHash);
  } catch {
    return password === storedHash;
  }
}

// ──────────────────────────────────────────────
// MAIN NATIVE HANDLER
// ──────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok({});

  try {
    const rawPath = event.path || '';
    const path = rawPath.toLowerCase();
    const method = (event.httpMethod || 'GET').toUpperCase();

    let body = {};
    if (event.body) {
      try { body = JSON.parse(event.body); } catch { body = {}; }
    }

    // AUTH LOGIN: POST /api/auth/login
    if (method === 'POST' && path.includes('/auth/login')) {
      const email = body.email ? body.email.trim() : '';
      const password = body.password || '';
      if (!email || !password) return fail('Email and password are required.');

      const user = await get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      if (!user) return fail('Invalid email or password.', 401);

      if (!verifyPassword(password, user.password)) {
        return fail('Invalid email or password.', 401);
      }

      const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
      return ok({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
      });
    }

    // AUTH ME: GET /api/auth/me
    if (method === 'GET' && path.includes('/auth/me')) {
      const admin = verifyAuth(event);
      if (!admin) return fail('Authentication required.', 401);

      const user = await get('SELECT id,name,email,role,avatar,created_at FROM users WHERE id = ?', [admin.id]);
      if (!user) return fail('User not found.', 404);
      return ok({ user });
    }

    // AUTH PASSWORD UPDATE: PATCH /api/auth/password
    if (method === 'PATCH' && path.includes('/auth/password')) {
      const admin = verifyAuth(event);
      if (!admin) return fail('Authentication required.', 401);

      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) return fail('Both current and new passwords are required.');
      if (newPassword.length < 8) return fail('New password must be at least 8 characters.');

      const user = await get('SELECT password FROM users WHERE id = ?', [admin.id]);
      if (!verifyPassword(currentPassword, user.password)) return fail('Current password is incorrect.', 401);

      let hashed = newPassword;
      try {
        const bcrypt = require('bcryptjs');
        hashed = bcrypt.hashSync(newPassword, 12);
      } catch {}

      await run('UPDATE users SET password = ? WHERE id = ?', [hashed, admin.id]);
      return ok({ message: 'Password updated successfully.' });
    }

    // AUTH PROFILE UPDATE: PUT /api/auth/profile
    if (method === 'PUT' && path.includes('/auth/profile')) {
      const admin = verifyAuth(event);
      if (!admin) return fail('Authentication required.', 401);

      const { name, email, avatarUrl } = body;
      if (!name || !email) return fail('Name and email are required.');

      const existing = await get('SELECT id FROM users WHERE email = ? AND id != ?', [email.trim().toLowerCase(), admin.id]);
      if (existing) return fail('This email is already in use by another account.', 400);

      const currentUser = await get('SELECT avatar FROM users WHERE id = ?', [admin.id]);
      const finalAvatar = avatarUrl !== undefined ? avatarUrl : (currentUser?.avatar || null);

      await run('UPDATE users SET name = ?, email = ?, avatar = ? WHERE id = ?', [name.trim(), email.trim().toLowerCase(), finalAvatar, admin.id]);
      const updated = await get('SELECT id, name, email, role, avatar FROM users WHERE id = ?', [admin.id]);

      const token = signToken({ id: updated.id, email: updated.email, name: updated.name, role: updated.role });
      return ok({ user: updated, token, message: 'Profile updated successfully.' });
    }

    // VEHICLES LIST: GET /api/vehicles
    if (method === 'GET' && path.includes('/vehicles')) {
      const rawVehicles = await query("SELECT * FROM vehicles WHERE status != 'draft' ORDER BY featured DESC, id ASC LIMIT 50");
      const vehicles = rawVehicles.map(v => {
        let images = [];
        try { images = JSON.parse(v.images || '[]'); } catch { images = []; }
        return { ...v, featured: Boolean(v.featured), images };
      });
      return ok({ vehicles, total: vehicles.length });
    }

    // PUBLIC STATS: GET /api/stats/public
    if (method === 'GET' && path.includes('/stats/public')) {
      const totalCars   = await get("SELECT COUNT(*) as c FROM vehicles WHERE status = 'available'");
      const totalBrands = await get("SELECT COUNT(DISTINCT brand) as c FROM vehicles WHERE status = 'available'");
      return ok({
        carsAvailable:     totalCars?.c   || 0,
        satisfiedClients:  25,
        brandsCount:       totalBrands?.c || 0,
        satisfactionRate:  99
      });
    }

    return fail('Endpoint not found.', 404);
  } catch (err) {
    console.error('Netlify Function error:', err);
    return fail(err.message || 'Internal server error.', 500);
  }
};
