'use strict';
/**
 * SALONEAUTOLINK — NATIVE NETLIFY SERVERLESS API HANDLER
 */

const bcrypt                             = require('bcryptjs');
const cloudStorage                       = require('../services/cloudStorage');
const { initDatabase, query, run, get } = require('../database/db');
const { signToken, requireAuth }         = require('../middleware/auth');

function ok(data, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    },
    body: JSON.stringify({ success: true, ...data })
  };
}

function fail(message, status = 400) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    },
    body: JSON.stringify({ success: false, message })
  };
}

function parseAuthToken(event) {
  const headers = event.headers || {};
  const header = headers.authorization || headers.Authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'saloneautolink_jwt_secret_onyx_2026';
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return ok({});

  try {
    await initDatabase().catch(() => null);

    const path = event.path || '';
    const method = (event.httpMethod || 'GET').toUpperCase();
    let body = {};
    if (event.body) {
      try { body = JSON.parse(event.body); } catch { body = {}; }
    }

    // LOGIN: POST /api/auth/login or /auth/login
    if (method === 'POST' && (path.endsWith('/auth/login') || path.endsWith('/auth/login/'))) {
      const email = body.email ? body.email.trim() : '';
      const password = body.password || '';
      if (!email || !password) return fail('Email and password are required.');

      const user = await get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      if (!user) return fail('Invalid email or password.', 401);

      if (!bcrypt.compareSync(password, user.password)) return fail('Invalid email or password.', 401);

      const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
      return ok({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
      });
    }

    // GET /api/auth/me
    if (method === 'GET' && (path.endsWith('/auth/me') || path.endsWith('/auth/me/'))) {
      const admin = parseAuthToken(event);
      if (!admin) return fail('Authentication required.', 401);

      const user = await get('SELECT id,name,email,role,avatar,created_at FROM users WHERE id = ?', [admin.id]);
      if (!user) return fail('User not found.', 404);
      return ok({ user });
    }

    // PATCH /api/auth/password
    if (method === 'PATCH' && (path.endsWith('/auth/password') || path.endsWith('/auth/password/'))) {
      const admin = parseAuthToken(event);
      if (!admin) return fail('Authentication required.', 401);

      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) return fail('Both current and new passwords are required.');
      if (newPassword.length < 8) return fail('New password must be at least 8 characters.');

      const user = await get('SELECT password FROM users WHERE id = ?', [admin.id]);
      if (!bcrypt.compareSync(currentPassword, user.password)) return fail('Current password is incorrect.', 401);

      const hashed = bcrypt.hashSync(newPassword, 12);
      await run('UPDATE users SET password = ? WHERE id = ?', [hashed, admin.id]);
      return ok({ message: 'Password updated successfully.' });
    }

    // PUT /api/auth/profile
    if (method === 'PUT' && (path.endsWith('/auth/profile') || path.endsWith('/auth/profile/'))) {
      const admin = parseAuthToken(event);
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
    if (method === 'GET' && (path.endsWith('/vehicles') || path.endsWith('/vehicles/'))) {
      const raw = await query("SELECT * FROM vehicles WHERE status != 'draft' ORDER BY featured DESC, id ASC LIMIT 50");
      const vehicles = raw.map(v => {
        let images = [];
        try { images = JSON.parse(v.images || '[]'); } catch { images = []; }
        return { ...v, featured: Boolean(v.featured), images };
      });
      return ok({ vehicles, total: vehicles.length });
    }

    // PUBLIC STATS: GET /api/stats/public
    if (method === 'GET' && (path.endsWith('/stats/public') || path.endsWith('/stats/public/'))) {
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
    console.error('Native Lambda handler error:', err);
    return fail(err.message || 'Internal server error.', 500);
  }
};
