'use strict';

/**
 * SALONEAUTOLINK — UNIVERSAL PURE NODE TURSO HTTPS PIPELINE DRIVER
 * Works on Node 14+, Node 18+, Node 20+, Netlify, Vercel, AWS Lambda, Windows & Linux.
 */

const https = require('https');
const bcrypt = require('bcryptjs');

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
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse Turso response: ' + data));
        }
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
  if (!cell) return null;
  if (cell.type === 'null') return null;
  if (cell.type === 'integer') return parseInt(cell.value, 10);
  if (cell.type === 'float') return parseFloat(cell.value);
  return cell.value;
}

async function query(sql, params = []) {
  const req = {
    type: 'execute',
    stmt: {
      sql,
      args: params.map(formatParam)
    }
  };

  const res = await executePipeline([req, { type: 'close' }]);
  const result = res.results?.[0]?.response?.result;
  if (!result) {
    const err = res.results?.[0]?.response?.error || res.error;
    throw new Error(`Turso Query Failed: ${err ? JSON.stringify(err) : 'Unknown error'}`);
  }

  const cols = result.cols.map(c => c.name);
  return result.rows.map(row => {
    const obj = {};
    row.forEach((cell, idx) => {
      obj[cols[idx]] = parseCell(cell);
    });
    return obj;
  });
}

async function run(sql, params = []) {
  const req = {
    type: 'execute',
    stmt: {
      sql,
      args: params.map(formatParam)
    }
  };

  const res = await executePipeline([req, { type: 'close' }]);
  const result = res.results?.[0]?.response?.result;
  if (!result) {
    const err = res.results?.[0]?.response?.error || res.error;
    throw new Error(`Turso Run Failed: ${err ? JSON.stringify(err) : 'Unknown error'}`);
  }

  return {
    rowsAffected: result.affected_row_count || 0,
    lastInsertRowid: result.last_insert_rowid ? parseInt(result.last_insert_rowid, 10) : null
  };
}

async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      price REAL NOT NULL,
      mileage INTEGER DEFAULT 0,
      transmission TEXT DEFAULT 'Automatic',
      fuel TEXT DEFAULT 'Petrol',
      body TEXT DEFAULT 'SUV',
      colour TEXT DEFAULT 'Black',
      engine TEXT,
      condition_type TEXT DEFAULT 'Used',
      location TEXT DEFAULT 'Freetown',
      status TEXT DEFAULT 'available',
      featured INTEGER DEFAULT 0,
      description TEXT,
      images TEXT DEFAULT '[]',
      features TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

module.exports = {
  initDatabase,
  query,
  run,
  get
};
