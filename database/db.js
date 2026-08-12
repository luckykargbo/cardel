'use strict';
try { require('dotenv').config(); } catch {}
/**
 * SALONEAUTOLINK — DATABASE LAYER (Turso / libSQL Cloud Database)
 * Uses @libsql/client to connect to Turso cloud SQLite database or local SQLite fallback.
 */

const { createClient } = require('@libsql/client');

let url = process.env.TURSO_DATABASE_URL || 'https://saloneautolink-luckykargbo.aws-eu-west-1.turso.io';
if (url.startsWith('libsql://')) {
  url = url.replace('libsql://', 'https://');
}
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const db = createClient({ url, authToken });

/**
 * Execute a query returning an array of plain JS row objects
 */
async function query(sql, params = []) {
  try {
    const res = await db.execute({ sql, args: params });
    return res.rows.map(row => {
      const plain = {};
      for (const key of Object.keys(row)) {
        plain[key] = row[key];
      }
      return plain;
    });
  } catch (err) {
    console.error('Turso DB Query Error:', sql, params, err.message);
    throw err;
  }
}

/**
 * Execute a query returning a single row object or undefined
 */
async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0];
}

/**
 * Execute an INSERT / UPDATE / DELETE query returning { changes, lastInsertRowid }
 */
async function run(sql, params = []) {
  try {
    const res = await db.execute({ sql, args: params });
    return {
      changes: Number(res.rowsAffected || 0),
      lastInsertRowid: res.lastInsertRowid !== undefined && res.lastInsertRowid !== null ? Number(res.lastInsertRowid) : 0,
    };
  } catch (err) {
    console.error('Turso DB Run Error:', sql, params, err.message);
    throw err;
  }
}

/**
 * Initialize Database Schema and seed data if needed
 */
async function initDatabase() {
  console.log(`🔌  Connecting to Turso Database (${url.split('@').pop() || url})...`);
  
  await createSchema();
  await seedData();

  console.log('✅  Turso Database initialized & seeded successfully.');
  return db;
}

async function createSchema() {
  await db.execute(`
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

  await db.execute(`
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

  await db.execute(`
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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL UNIQUE,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

async function seedData() {
  const bcrypt = require('bcryptjs');

  // Admin user
  const adminUser = await get("SELECT id FROM users WHERE email = 'admin@saloneautolink.com'");
  if (!adminUser) {
    const hashed = bcrypt.hashSync('Onyx2026!', 12);
    await run(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'superadmin')",
      ['Super Admin', 'admin@saloneautolink.com', hashed]
    );
    console.log('✅  Admin user created in Turso: admin@saloneautolink.com / Onyx2026!');
  }
}

module.exports = { db, initDatabase, query, run, get };
