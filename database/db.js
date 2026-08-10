'use strict';
/**
 * PRESTIGE MOTORS — DATABASE (sql.js — pure JavaScript SQLite)
 * Loads/saves the SQLite file from disk on every write.
 * No native compilation required.
 */

const path = require('path');
const fs   = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'prestige_motors.db');

let db;        // sql.js Database instance
let SQL;       // sql.js namespace

// ──────────────────────────────────────────────
// INIT — load or create database
// ──────────────────────────────────────────────
async function initDatabase() {
  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('✅  Loaded existing database from', DB_PATH);
  } else {
    db = new SQL.Database();
    console.log('🔧  Creating new database at', DB_PATH);
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  // Create schema
  createSchema();

  // Seed admin + vehicles if needed
  await seedData();

  // Persist the initial state
  persist();

  return db;
}

// ──────────────────────────────────────────────
// PERSIST — write db to disk after every change
// ──────────────────────────────────────────────
function persist() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ──────────────────────────────────────────────
// SCHEMA
// ──────────────────────────────────────────────
function createSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'admin',
      avatar     TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

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

    CREATE TABLE IF NOT EXISTS reviews (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      role        TEXT,
      rating      INTEGER NOT NULL DEFAULT 5,
      comment     TEXT    NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'approved',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL UNIQUE,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Ensure video_url column exists on existing databases
  try { db.run("ALTER TABLE vehicles ADD COLUMN video_url TEXT;"); } catch {}
}

// ──────────────────────────────────────────────
// SEED
// ──────────────────────────────────────────────
async function seedData() {
  const bcrypt = require('bcryptjs');

  // Admin user
  const adminRows = db.exec("SELECT id FROM users WHERE email = 'admin@prestigemotors.com'");
  if (!adminRows.length || !adminRows[0].values.length) {
    const hashed = bcrypt.hashSync('Onyx2026!', 12);
    db.run(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'superadmin')",
      ['Super Admin', 'admin@prestigemotors.com', hashed]
    );
    console.log('✅  Admin user created: admin@prestigemotors.com / Onyx2026!');
  }

  // Vehicles
  const countRows = db.exec('SELECT COUNT(*) as c FROM vehicles');
  const count = countRows[0]?.values[0]?.[0] || 0;

  if (count === 0) {
    const vehicles = [
      ['BMW M8 Competition Coupé','BMW','M8 Competition',2024,2450000,2100,'Petrol','625 hp','4.4L V8 Twin-Turbo','Automatic','Coupé','Obsidian Black','Freetown','new','available',1,'Twin-turbocharged V8 powerhouse. Certified factory Onyx Black with full carbon trim package. Sport exhaust, M Driver\'s package.',JSON.stringify(['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900&q=85'])],
      ['Mercedes-AMG GT 63 S','Mercedes-Benz','AMG GT 63 S',2024,3200000,480,'Petrol','639 hp','4.0L V8 Biturbo','Automatic','Sedan','Polar White','Freetown','new','available',1,'AMG\'s apex four-door grand tourer. Performance package, Night package, carbon ceramic brakes. Factory warranty valid.',JSON.stringify(['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=900&q=85'])],
      ['Porsche 911 Turbo S','Porsche','911 Turbo S',2024,4100000,480,'Petrol','650 hp','3.8L Flat-6 Twin-Turbo','PDK 8-spd','Coupé','Midnight Blue','Freetown','new','available',1,'The pinnacle of rear-engined sports car engineering. Sport Chrono package, Bose surround sound, heated/ventilated seats.',JSON.stringify(['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=85'])],
      ['Ferrari 296 GTB','Ferrari','296 GTB',2023,6800000,1200,'Hybrid','830 hp','3.0L V6 + Electric Motor','DCT 8-spd','Coupé','Rosso Corsa','Freetown','used','available',0,'Ferrari\'s most advanced V6 hybrid. Assetto Fiorano package, Alcantara interior, forged carbon wheels.',JSON.stringify(['https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=900&q=85'])],
      ['Lamborghini Huracán Tecnica','Lamborghini','Huracán Tecnica',2024,7900000,0,'Petrol','640 hp','5.2L V10 NA','DCT 7-spd','Coupé','Racing Yellow','Freetown','new','available',0,'Factory fresh, 0 km delivery. Giallo Inti pearl yellow. Forged composite wheels, ANIMA driving dynamics selector.',JSON.stringify(['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=900&q=85'])],
      ['Audi R8 V10 Performance','Audi','R8 V10',2024,3600000,3800,'Petrol','620 hp','5.2L V10 NA','DCT 7-spd','Coupé','Nardo Grey','Bo','used','available',0,'One of the final naturally aspirated V10 supercars. Laser headlights, Bang & Olufsen audio.',JSON.stringify(['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&q=85'])],
      ['Tesla Model S Plaid','Tesla','Model S Plaid',2024,1950000,0,'Electric','1,020 hp','Tri-Motor Electric','Electric','Sedan','Midnight Silver','Freetown','new','available',0,'World\'s fastest production electric sedan. 0-100 km/h in 2.1s. 17-inch cinematic touchscreen.',JSON.stringify(['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=900&q=85'])],
      ['Bentley Continental GT','Bentley','Continental GT',2023,9200000,5400,'Petrol','542 hp','4.0L V8 Twin-Turbo','Automatic 8-spd','Coupé','Tungsten','Freetown','used','reserved',0,'Grand tourer supreme. Hand-stitched Mulliner interior, panoramic glass roof, rotating display.',JSON.stringify(['https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=900&q=85'])],
      ['Rolls-Royce Ghost II','Rolls-Royce','Ghost',2024,14500000,1050,'Petrol','563 hp','6.75L V12 Twin-Turbo','Automatic 8-spd','Sedan','Arctic White','Freetown','new','available',1,'Post-Opulence Rolls-Royce. Starlight headliner, lambswool floor mats, bespoke audio, illuminated fascia.',JSON.stringify(['https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=900&q=85'])],
      ['McLaren 720S Spider','McLaren','720S Spider',2023,8600000,2300,'Petrol','720 hp','4.0L V8 M840T','DCT 7-spd','Convertible','Papaya Spark','Freetown','used','available',0,'Track-focused convertible supercar. Electrochromatic glass roof, carbon fibre chassis.',JSON.stringify(['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85'])],
    ];

    for (const v of vehicles) {
      db.run(`
        INSERT INTO vehicles
          (title,brand,model,year,price,mileage,fuel,hp,engine,transmission,body,colour,location,condition_type,status,featured,description,images)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, v);
    }
    console.log(`✅  Seeded ${vehicles.length} sample vehicles`);
  }

  // Reviews
  const revCountRows = db.exec('SELECT COUNT(*) as c FROM reviews');
  const revCount = revCountRows[0]?.values[0]?.[0] || 0;
  if (revCount === 0) {
    const sampleReviews = [
      ['Sahr Kamara', 'Managing Director, Kamara & Sons — Freetown', 5, 'Purchased our executive Toyota Land Cruiser V8 through Car Dynasty. Exceptional transparency, pristine vehicle condition, and white-glove doorstep delivery.'],
      ['Aminata Sesay', 'Logistics Director — Bo', 5, 'The Lexus LX 600 VIP was delivered straight to Bo in absolute mint condition. Professional team and unmatched luxury service standard in Sierra Leone.'],
      ['Dr. Mohamed Mansaray', 'Surgeon — Freetown', 5, 'Highly reliable executive automobile dealership. The Range Rover Autobiography exceeded all expectations. Will definitely purchase our next fleet vehicle here.']
    ];
    for (const r of sampleReviews) {
      db.run("INSERT INTO reviews (name, role, rating, comment, status) VALUES (?, ?, ?, ?, 'approved')", r);
    }
    console.log(`✅  Seeded ${sampleReviews.length} client reviews`);
  }
}

// ──────────────────────────────────────────────
// QUERY HELPERS (mimic better-sqlite3 API)
// ──────────────────────────────────────────────

/**
 * Convert sql.js result to array of plain objects
 */
function toObjects(results) {
  if (!results || !results.length) return [];
  const { columns, values } = results[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

/**
 * Run a SELECT query returning an array of objects
 */
function query(sql, params = []) {
  try {
    const results = db.exec(sql, params);
    return toObjects(results);
  } catch (err) {
    console.error('DB query error:', sql, params, err.message);
    throw err;
  }
}

/**
 * Run an INSERT/UPDATE/DELETE — returns { changes, lastInsertRowid }
 */
function run(sql, params = []) {
  try {
    db.run(sql, params);
    const meta = db.exec('SELECT changes() as c, last_insert_rowid() as r');
    const { values } = meta[0];
    persist();
    return { changes: values[0][0], lastInsertRowid: values[0][1] };
  } catch (err) {
    console.error('DB run error:', sql, params, err.message);
    throw err;
  }
}

/**
 * Run a SELECT returning a single object or undefined
 */
function get(sql, params = []) {
  const rows = query(sql, params);
  return rows[0];
}

module.exports = { initDatabase, query, run, get, persist };
