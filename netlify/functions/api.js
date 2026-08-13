'use strict';
/**
 * SALONEAUTOLINK — DIAGNOSTIC SERVERLESS FUNCTION
 */

let loadError = null;

let bcrypt = null;
let cloudStorage = null;
let db = null;
let auth = null;

try {
  bcrypt = require('bcryptjs');
} catch (e) {
  loadError = 'bcryptjs load error: ' + e.message;
}

try {
  cloudStorage = require('../services/cloudStorage');
} catch (e) {
  if (!loadError) loadError = 'cloudStorage load error: ' + e.message;
}

try {
  db = require('../database/db');
} catch (e) {
  if (!loadError) loadError = 'db load error: ' + e.message;
}

try {
  auth = require('../middleware/auth');
} catch (e) {
  if (!loadError) loadError = 'auth load error: ' + e.message;
}

exports.handler = async (event, context) => {
  if (loadError) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: loadError })
    };
  }

  // If no load error, execute login check
  try {
    const { get } = db;
    const { signToken } = auth;
    
    let body = {};
    if (event.body) {
      try { body = JSON.parse(event.body); } catch { body = {}; }
    }

    const email = body.email ? body.email.trim() : '';
    const password = body.password || '';

    if (email && password) {
      const user = await get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      if (!user) return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Invalid email or password.' }) };

      if (!bcrypt.compareSync(password, user.password)) {
        return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Invalid email or password.' }) };
      }

      const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'DIAGNOSTIC HANDLER READY' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: err.message, stack: err.stack })
    };
  }
};
