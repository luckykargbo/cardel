'use strict';
try { require('dotenv').config(); } catch {}

/**
 * SALONEAUTOLINK — DATABASE LAYER (Turso Cloud Database via Pure JS Native HTTP Pipeline)
 * Direct HTTPS connection to Turso Cloud Database — 100% serverless compatible, zero C++ native binaries.
 */

const DEFAULT_URL   = 'https://saloneautolink-luckykargbo.aws-eu-west-1.turso.io';
const DEFAULT_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODYzODMwNjIsImlkIjoiMDE5ZmVjYWYtNjMwMS03ODAxLTg5NGEtMjUyMzk5MGU0ODdmIiwia2lkIjoiMmhDUHBmTlNYMEpYOEZETDRsYUVreDJpUVBLYTdaZW10bVN0aERfcFdvWSIsInJpZCI6IjY5ODRkZmU0LTlkNDItNDdiNS1hNTJjLTU3M2QwMWI3ZjZmOSJ9.wwWICJ6Hj3fTNZVVOMdg1pqQVikT5v_OI37xbvfWGiVZKSzltXkG3sdVbYtki6WWt-FgxvPEsUgmmCDrLTowCw';

let baseUrl = (process.env.TURSO_DATABASE_URL || DEFAULT_URL).trim().replace(/^["']|["']$/g, '');
if (baseUrl.startsWith('libsql://')) {
  baseUrl = baseUrl.replace('libsql://', 'https://');
}
const authToken = (process.env.TURSO_AUTH_TOKEN || DEFAULT_TOKEN).trim().replace(/^["']|["']$/g, '');

function formatArg(arg) {
  if (arg === null || arg === undefined) return { type: 'null' };
  if (typeof arg === 'number') {
    if (Number.isInteger(arg)) return { type: 'integer', value: String(arg) };
    return { type: 'float', value: arg };
  }
  if (typeof arg === 'boolean') return { type: 'integer', value: arg ? '1' : '0' };
  return { type: 'text', value: String(arg) };
}

function parseVal(cell) {
  if (!cell || cell.type === 'null') return null;
  if (cell.type === 'integer') return parseInt(cell.value, 10);
  if (cell.type === 'float') return parseFloat(cell.value);
  return cell.value;
}

async function executeStmt(sql, params = []) {
  const url = `${baseUrl.replace(/\/+$/, '')}/v2/pipeline`;
  const stmt = { sql, args: params.map(formatArg) };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt },
        { type: 'close' }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Turso HTTP error ${response.status}: ${text}`);
  }

  const data = await response.json();

  if (data?.results?.[0]?.type === 'error') {
    throw new Error(data.results[0].error?.message || 'Turso query execution failed');
  }

  const execResult = data?.results?.[0]?.response?.result;
  if (!execResult) return { rows: [], affectedRows: 0, lastInsertRowid: null };

  const cols = (execResult.cols || []).map(c => c.name);
  const rows = (execResult.rows || []).map(rowCells => {
    const obj = {};
    cols.forEach((colName, idx) => {
      obj[colName] = parseVal(rowCells[idx]);
    });
    return obj;
  });

  return {
    rows,
    affectedRows: execResult.affected_row_count || 0,
    lastInsertRowid: execResult.last_insert_rowid ? parseInt(execResult.last_insert_rowid, 10) : null
  };
}

async function query(sql, params = []) {
  const res = await executeStmt(sql, params);
  return res.rows;
}

async function run(sql, params = []) {
  const res = await executeStmt(sql, params);
  return { lastID: res.lastInsertRowid, changes: res.affectedRows };
}

async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function initDatabase() {
  await createSchema();
  await seedData();
  return true;
}

async function createSchema() {
  await executeStmt(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'admin',
      avatar     TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await executeStmt(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      title           TEXT    NOT NULL,
      brand           TEXT    NOT NULL,
      model           TEXT    NOT NULL,
      year            INTEGER NOT NULL,
      price           INTEGER NOT NULL,
      mileage         INTEGER NOT NULL DEFAULT 0,
      fuel            TEXT    NOT NULL,
      hp              TEXT,
      engine          TEXT,
      transmission    TEXT,
      body            TEXT,
      colour          TEXT,
      location        TEXT    DEFAULT 'Freetown',
      condition_type  TEXT    NOT NULL DEFAULT 'new',
      status          TEXT    NOT NULL DEFAULT 'available',
      featured        INTEGER NOT NULL DEFAULT 0,
      description     TEXT,
      images          TEXT    NOT NULL DEFAULT '[]',
      video_url       TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await executeStmt(`
    CREATE TABLE IF NOT EXISTS reviews (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      role        TEXT,
      rating      INTEGER NOT NULL DEFAULT 5,
      comment     TEXT    NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'approved',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await executeStmt(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL UNIQUE,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

async function seedData() {
  const bcrypt = require('bcryptjs');
  const email = 'hackerunlockme@gmail.com';
  const hashed = bcrypt.hashSync('PEACElu2@', 12);

  const adminUser = await get("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", [email]);
  if (!adminUser) {
    await run(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'superadmin')",
      ['Super Admin', email, hashed]
    );
    console.log(`✅ Admin user created in Turso: ${email}`);
  } else {
    await run(
      "UPDATE users SET password = ? WHERE LOWER(email) = LOWER(?)",
      [hashed, email]
    );
    console.log(`✅ Admin user password synchronized in Turso: ${email}`);
  }
}

module.exports = { db: { execute: executeStmt }, initDatabase, query, run, get };
