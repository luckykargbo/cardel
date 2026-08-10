'use strict';
/**
 * ============================================================
 * SALONEAUTOLINK — EXPRESS API SERVER
 * Sierra Leone's Premier Luxury Car Dealership
 * Database: sql.js (pure JavaScript SQLite — no native build required)
 * ============================================================
 */

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const bcrypt   = require('bcryptjs');
const multer   = require('multer');
const { v4: uuidv4 } = require('uuid');

const { initDatabase, query, run, get } = require('./database/db');
const { signToken, requireAuth }         = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

// ──────────────────────────────────────────────
// MIDDLEWARE
// ──────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ──────────────────────────────────────────────
// MULTER — FILE UPLOAD
// ──────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename:    (_req, file, cb)  => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`)
});

const fileFilter = (_req, file, cb) => {
  const ok = /jpeg|jpg|png|webp|gif|mp4|webm|mov|avi|mkv/.test(path.extname(file.originalname).toLowerCase());
  ok ? cb(null, true) : cb(new Error('Only image and video files are allowed.'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
const ok   = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, msg, status = 400) => res.status(status).json({ success: false, message: msg });

function parseImages(raw) {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

function mapVehicle(row) {
  if (!row) return null;
  return { ...row, images: parseImages(row.images), featured: row.featured === 1 };
}

// ──────────────────────────────────────────────
// ============================================================
// AUTH ROUTES
// ============================================================
// ──────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 'Email and password are required.');

  const user = get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  if (!user) return fail(res, 'Invalid email or password.', 401);

  if (!bcrypt.compareSync(password, user.password)) return fail(res, 'Invalid email or password.', 401);

  const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
  return ok(res, {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = get('SELECT id,name,email,role,avatar,created_at FROM users WHERE id = ?', [req.admin.id]);
  if (!user) return fail(res, 'User not found.', 404);
  return ok(res, { user });
});

app.patch('/api/auth/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return fail(res, 'Both current and new passwords are required.');
  if (newPassword.length < 8) return fail(res, 'New password must be at least 8 characters.');

  const user = get('SELECT password FROM users WHERE id = ?', [req.admin.id]);
  if (!bcrypt.compareSync(currentPassword, user.password)) return fail(res, 'Current password is incorrect.', 401);

  const hashed = bcrypt.hashSync(newPassword, 12);
  run('UPDATE users SET password = ? WHERE id = ?', [hashed, req.admin.id]);
  return ok(res, { message: 'Password updated successfully.' });
});

app.put('/api/auth/profile', requireAuth, (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return fail(res, 'Name and email are required.');

  const existing = get('SELECT id FROM users WHERE email = ? AND id != ?', [email.trim().toLowerCase(), req.admin.id]);
  if (existing) return fail(res, 'This email is already in use by another account.', 400);

  run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name.trim(), email.trim().toLowerCase(), req.admin.id]);
  const updated = get('SELECT id, name, email, role, avatar FROM users WHERE id = ?', [req.admin.id]);

  const token = signToken({ id: updated.id, email: updated.email, name: updated.name, role: updated.role });
  return ok(res, { user: updated, token, message: 'Profile updated successfully.' });
});

// ──────────────────────────────────────────────
// ============================================================
// VEHICLES ROUTES
// ============================================================
// ──────────────────────────────────────────────

app.get('/api/vehicles', (req, res) => {
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

  if (price) {
    const parts = price.split('-');
    if (parts[1] && parts[1] !== '+') {
      sql += ' AND price >= ? AND price <= ?'; p.push(parseInt(parts[0]), parseInt(parts[1]));
    } else {
      sql += ' AND price >= ?'; p.push(parseInt(parts[0]));
    }
  }

  if (mileage) {
    if (mileage === '0') { sql += ' AND mileage = 0'; }
    else { sql += ' AND mileage <= ?'; p.push(parseInt(mileage)); }
  }

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

  const allParams = [...p, parseInt(limit), parseInt(offset)];
  const vehicles  = query(sql, allParams).map(mapVehicle);

  // Total count without limit/offset
  const countSql = sql.replace(/SELECT \*/, 'SELECT COUNT(*) as c').replace(/ORDER BY.+$/, '');
  const totalRow = get(countSql, p);
  const total    = totalRow?.c || vehicles.length;

  return ok(res, { vehicles, total, limit: parseInt(limit), offset: parseInt(offset) });
});

app.get('/api/vehicles/:id', (req, res) => {
  const vehicle = get('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
  if (!vehicle) return fail(res, 'Vehicle not found.', 404);
  return ok(res, { vehicle: mapVehicle(vehicle) });
});

app.post('/api/vehicles', requireAuth, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }]), (req, res) => {
  try {
    const {
      title, brand, model, year, price, mileage = 0, fuel,
      hp = '', engine = '', transmission = '', body = '', colour = '',
      location = 'Freetown', condition_type = 'new', status = 'available',
      featured = 0, description = '', existingImages, video_url = ''
    } = req.body;

    if (!title || !brand || !model || !year || !price || !fuel) {
      return fail(res, 'Title, brand, model, year, price, and fuel are required.');
    }

    let images = [];
    try { images = JSON.parse(existingImages || '[]'); } catch {}
    if (req.files?.images?.length) {
      images = images.concat(req.files.images.map(f => `/uploads/${f.filename}`));
    }

    let finalVideoUrl = video_url || '';
    if (req.files?.video?.length) {
      finalVideoUrl = `/uploads/${req.files.video[0].filename}`;
    }

    const isFeatured = featured === 'true' || featured === true || featured === '1' ? 1 : 0;

    const result = run(`
      INSERT INTO vehicles
        (title,brand,model,year,price,mileage,fuel,hp,engine,transmission,body,colour,location,condition_type,status,featured,description,images,video_url,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
    `, [title, brand, model, parseInt(year), parseInt(price), parseInt(mileage),
        fuel, hp, engine, transmission, body, colour, location,
        condition_type, status, isFeatured, description, JSON.stringify(images), finalVideoUrl]);

    const newV = get('SELECT * FROM vehicles WHERE id = ?', [result.lastInsertRowid]);
    return ok(res, { vehicle: mapVehicle(newV) }, 201);
  } catch (err) {
    console.error('Error adding vehicle:', err);
    return fail(res, err.message || 'Failed to add vehicle.', 500);
  }
});

app.put('/api/vehicles/:id', requireAuth, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }]), (req, res) => {
  try {
    const existing = get('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (!existing) return fail(res, 'Vehicle not found.', 404);

    const {
      title, brand, model, year, price, mileage, fuel,
      hp, engine, transmission, body, colour, location,
      condition_type, status, featured, description, existingImages, removeImages, video_url
    } = req.body;

    // Handle images
    let images = parseImages(existing.images);
    if (removeImages) {
      let toRemove = [];
      try { toRemove = JSON.parse(removeImages); } catch {}
      images = images.filter(img => !toRemove.includes(img));
      toRemove.forEach(img => {
        if (img.startsWith('/uploads/')) {
          const fp = path.join(__dirname, img);
          if (fs.existsSync(fp)) { try { fs.unlinkSync(fp); } catch {} }
        }
      });
    }
    if (existingImages) { try { images = JSON.parse(existingImages); } catch {} }
    if (req.files?.images?.length) {
      images = images.concat(req.files.images.map(f => `/uploads/${f.filename}`));
    }

    let finalVideoUrl = video_url !== undefined ? video_url : (existing.video_url || '');
    if (req.files?.video?.length) {
      finalVideoUrl = `/uploads/${req.files.video[0].filename}`;
    }

    const isFeatured = (featured !== undefined)
      ? (featured === 'true' || featured === true || featured === '1' ? 1 : 0)
      : existing.featured;

    run(`
      UPDATE vehicles SET
        title=?,brand=?,model=?,year=?,price=?,mileage=?,fuel=?,hp=?,engine=?,
        transmission=?,body=?,colour=?,location=?,condition_type=?,status=?,
        featured=?,description=?,images=?,video_url=?,updated_at=datetime('now')
      WHERE id=?
    `, [
      title ?? existing.title, brand ?? existing.brand,
      model ?? existing.model, parseInt(year ?? existing.year),
      parseInt(price ?? existing.price), parseInt(mileage ?? existing.mileage),
      fuel ?? existing.fuel, hp ?? existing.hp,
      engine ?? existing.engine, transmission ?? existing.transmission,
      body ?? existing.body, colour ?? existing.colour,
      location ?? existing.location, condition_type ?? existing.condition_type,
      status ?? existing.status, isFeatured,
      description ?? existing.description, JSON.stringify(images), finalVideoUrl,
      parseInt(req.params.id)
    ]);

    return ok(res, { vehicle: mapVehicle(get('SELECT * FROM vehicles WHERE id = ?', [req.params.id])) });
  } catch (err) {
    console.error('Error updating vehicle:', err);
    return fail(res, err.message || 'Failed to update vehicle.', 500);
  }
});

app.patch('/api/vehicles/:id/status', requireAuth, (req, res) => {
  const valid = ['available', 'reserved', 'sold', 'draft'];
  const { status } = req.body;
  if (!valid.includes(status)) return fail(res, 'Invalid status value.');
  const result = run("UPDATE vehicles SET status=?,updated_at=datetime('now') WHERE id=?", [status, req.params.id]);
  if (result.changes === 0) return fail(res, 'Vehicle not found.', 404);
  return ok(res, { message: `Status updated to ${status}.` });
});

app.patch('/api/vehicles/:id/featured', requireAuth, (req, res) => {
  const v = get('SELECT featured FROM vehicles WHERE id = ?', [req.params.id]);
  if (!v) return fail(res, 'Vehicle not found.', 404);
  const newVal = v.featured === 1 ? 0 : 1;
  run("UPDATE vehicles SET featured=?,updated_at=datetime('now') WHERE id=?", [newVal, req.params.id]);
  return ok(res, { featured: newVal === 1 });
});

app.delete('/api/vehicles/:id', requireAuth, (req, res) => {
  const v = get('SELECT images FROM vehicles WHERE id = ?', [req.params.id]);
  if (!v) return fail(res, 'Vehicle not found.', 404);
  parseImages(v.images).forEach(img => {
    if (img.startsWith('/uploads/')) {
      const fp = path.join(__dirname, img);
      if (fs.existsSync(fp)) { try { fs.unlinkSync(fp); } catch {} }
    }
  });
  run('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
  return ok(res, { message: 'Vehicle deleted.' });
});

// ──────────────────────────────────────────────
// NEWSLETTER
// ──────────────────────────────────────────────

app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) return fail(res, 'A valid email is required.');
  try {
    run('INSERT INTO subscribers (email) VALUES (?)', [email.trim().toLowerCase()]);
    return ok(res, { message: "You're subscribed! Welcome to the SaloneAutoLink community." }, 201);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return ok(res, { message: 'Already subscribed. Thank you!' });
    throw err;
  }
});

app.get('/api/newsletter', requireAuth, (req, res) => {
  const subscribers = query('SELECT * FROM subscribers ORDER BY created_at DESC');
  return ok(res, { subscribers, total: subscribers.length });
});

// ──────────────────────────────────────────────
// REVIEWS
// ──────────────────────────────────────────────

app.get('/api/reviews', (req, res) => {
  const reviews = query("SELECT * FROM reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT 20");
  return ok(res, { reviews });
});

app.post('/api/reviews', (req, res) => {
  const { name, role, rating = 5, comment } = req.body;
  if (!name || !comment) return fail(res, 'Name and review comment are required.');
  const result = run(
    'INSERT INTO reviews (name, role, rating, comment, status) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), role?.trim() || 'Verified Client', Math.min(5, Math.max(1, parseInt(rating) || 5)), comment.trim(), 'approved']
  );
  return ok(res, { id: result.lastInsertRowid, message: 'Thank you for your review!' }, 201);
});

app.get('/api/admin/reviews', requireAuth, (req, res) => {
  const reviews = query('SELECT * FROM reviews ORDER BY created_at DESC');
  return ok(res, { reviews, total: reviews.length });
});

app.delete('/api/admin/reviews/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  run('DELETE FROM reviews WHERE id = ?', [id]);
  return ok(res, { message: 'Review deleted successfully.' });
});

// ──────────────────────────────────────────────
// PUBLIC STATS (Live dynamic count for index.html)
// ──────────────────────────────────────────────

app.get('/api/stats/public', (req, res) => {
  const availableCars = get("SELECT COUNT(*) as c FROM vehicles WHERE status = 'available'")?.c || 0;
  const totalBrands   = get("SELECT COUNT(DISTINCT brand) as c FROM vehicles")?.c || 0;
  const totalSold     = get("SELECT COUNT(*) as c FROM vehicles WHERE status = 'sold'")?.c || 0;

  return ok(res, {
    carsAvailable: availableCars,
    satisfiedClients: totalSold + 25,
    brandsCount: totalBrands,
    satisfactionRate: 99
  });
});

app.get('/api/stats', requireAuth, (req, res) => {
  const total     = get("SELECT COUNT(*) as c FROM vehicles")?.c || 0;
  const available = get("SELECT COUNT(*) as c FROM vehicles WHERE status='available'")?.c || 0;
  const reserved  = get("SELECT COUNT(*) as c FROM vehicles WHERE status='reserved'")?.c || 0;
  const sold      = get("SELECT COUNT(*) as c FROM vehicles WHERE status='sold'")?.c || 0;
  const drafts    = get("SELECT COUNT(*) as c FROM vehicles WHERE status='draft'")?.c || 0;
  const featured  = get("SELECT COUNT(*) as c FROM vehicles WHERE featured=1")?.c || 0;
  const totalVal  = get("SELECT SUM(price) as s FROM vehicles WHERE status!='draft'")?.s || 0;
  const soldVal   = get("SELECT SUM(price) as s FROM vehicles WHERE status='sold'")?.s || 0;
  const subs      = get("SELECT COUNT(*) as c FROM subscribers")?.c || 0;

  const recentVehicles = query('SELECT * FROM vehicles ORDER BY created_at DESC LIMIT 5').map(mapVehicle);

  return ok(res, {
    stats: {
      inventory: { total, available, reserved, sold, drafts, featured, totalValue: totalVal, soldValue: soldVal },
      subscribers: subs
    },
    recentVehicles
  });
});

// ──────────────────────────────────────────────
// STANDALONE UPLOAD
// ──────────────────────────────────────────────

app.post('/api/upload', requireAuth, upload.array('images', 10), (req, res) => {
  if (!req.files?.length) return fail(res, 'No files uploaded.');
  return ok(res, { urls: req.files.map(f => `/uploads/${f.filename}`) });
});

// ──────────────────────────────────────────────
// CATCH-ALL
// ──────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ success: false, message: 'Not found.' });
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) return fail(res, `Upload error: ${err.message}`);
  console.error('Server Error:', err.message);
  return fail(res, 'Internal server error.', 500);
});

// ──────────────────────────────────────────────
// START — initialise DB first, then listen
// ──────────────────────────────────────────────
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log('\n' +
      '  ╔══════════════════════════════════════════╗\n' +
      '  ║   🚘  SALONEAUTOLINK — SERVER RUNNING    ║\n' +
      '  ╚══════════════════════════════════════════╝\n'
    );
    console.log(`  🌐  Showroom   → http://localhost:${PORT}`);
    console.log(`  🔐  Admin      → http://localhost:${PORT}/admin.html`);
    console.log(`  📡  API Base   → http://localhost:${PORT}/api\n`);
  });
}).catch(err => {
  console.error('Failed to initialise database:', err);
  process.exit(1);
});
