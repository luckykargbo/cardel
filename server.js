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

const cloudStorage                       = require('./services/cloudStorage');
const { initDatabase, query, run, get } = require('./database/db');
const { signToken, requireAuth }         = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

// ──────────────────────────────────────────────
// ADMIN GATE CUSTOM ROUTE: /admin/get/get_chenor
// ──────────────────────────────────────────────
app.get(['/admin/get/get_chenor', '/admin/get/get_chenor/*'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Block direct access to /admin.html and /admin (redirect to public homepage)
app.get(['/admin.html', '/admin', '/admin/'], (_req, res) => {
  res.redirect('/');
});

// ──────────────────────────────────────────────
// MIDDLEWARE
// ──────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Serverless Database Auto-Init Middleware
let dbInitPromise = null;
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    if (!dbInitPromise) {
      dbInitPromise = initDatabase().catch(err => {
        console.warn('Turso init note:', err.message);
        return null;
      });
    }
    try {
      await dbInitPromise;
    } catch {
      // Proceed directly to handler
    }
  }
  next();
});

// ──────────────────────────────────────────────
// MULTER — MEMORY STORAGE (SERVERLESS FRIENDLY)
// ──────────────────────────────────────────────
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const ok = /jpeg|jpg|png|webp|gif|mp4|webm|mov|avi|mkv/.test(path.extname(file.originalname).toLowerCase());
  ok ? cb(null, true) : cb(new Error('Only image and video files are allowed.'));
};

// Enforce max 15MB file size limit to prevent memory exhaustion in serverless environments
const upload = multer({ storage, fileFilter, limits: { fileSize: 15 * 1024 * 1024 } });

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

// Prevent server crashes from transient network/DB errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Promise Rejection:', reason?.message || reason);
});

// ──────────────────────────────────────────────
// ============================================================
// AUTH ROUTES
// ============================================================
// ──────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
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
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await get('SELECT id,name,email,role,avatar,created_at FROM users WHERE id = ?', [req.admin.id]);
  if (!user) return fail(res, 'User not found.', 404);
  return ok(res, { user });
});

app.patch('/api/auth/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return fail(res, 'Both current and new passwords are required.');
  if (newPassword.length < 8) return fail(res, 'New password must be at least 8 characters.');

  const user = await get('SELECT password FROM users WHERE id = ?', [req.admin.id]);
  if (!bcrypt.compareSync(currentPassword, user.password)) return fail(res, 'Current password is incorrect.', 401);

  const hashed = bcrypt.hashSync(newPassword, 12);
  await run('UPDATE users SET password = ? WHERE id = ?', [hashed, req.admin.id]);
  return ok(res, { message: 'Password updated successfully.' });
});

app.put('/api/auth/profile', requireAuth, upload.single('avatar'), async (req, res) => {
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
});

// ──────────────────────────────────────────────
// ============================================================
// VEHICLES ROUTES
// ============================================================
// ──────────────────────────────────────────────

app.get('/api/vehicles', async (req, res) => {
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
  const rawVehicles = await query(sql, allParams);
  const vehicles    = rawVehicles.map(mapVehicle);

  // Total count without limit/offset
  const countSql = sql.replace(/SELECT \*/, 'SELECT COUNT(*) as c').replace(/ORDER BY.+$/, '');
  const totalRow = await get(countSql, p);
  const total    = totalRow?.c || vehicles.length;

  return ok(res, { vehicles, total, limit: parseInt(limit), offset: parseInt(offset) });
});

app.get('/api/vehicles/:id', async (req, res) => {
  const vehicle = await get('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
  if (!vehicle) return fail(res, 'Vehicle not found.', 404);
  return ok(res, { vehicle: mapVehicle(vehicle) });
});

app.post('/api/vehicles', requireAuth, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  const newlyUploadedUrls = [];
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

    // Process & optimize uploaded images to WebP @ 80% quality -> Cloud Storage
    if (req.files?.images?.length) {
      for (const file of req.files.images) {
        const url = await cloudStorage.processAndUploadImage(file.buffer, file.originalname);
        images.push(url);
        newlyUploadedUrls.push(url);
      }
    }

    // Process & upload video -> Cloud Storage
    let finalVideoUrl = video_url || '';
    if (req.files?.video?.length) {
      const vFile = req.files.video[0];
      finalVideoUrl = await cloudStorage.uploadVideo(vFile.buffer, vFile.originalname, vFile.mimetype);
      newlyUploadedUrls.push(finalVideoUrl);
    }

    const isFeatured = featured === 'true' || featured === true || featured === '1' ? 1 : 0;

    const result = await run(`
      INSERT INTO vehicles
        (title,brand,model,year,price,mileage,fuel,hp,engine,transmission,body,colour,location,condition_type,status,featured,description,images,video_url,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
    `, [title, brand, model, parseInt(year), parseInt(price), parseInt(mileage),
        fuel, hp, engine, transmission, body, colour, location,
        condition_type, status, isFeatured, description, JSON.stringify(images), finalVideoUrl]);

    const newV = await get('SELECT * FROM vehicles WHERE id = ?', [result.lastInsertRowid]);
    return ok(res, { vehicle: mapVehicle(newV) }, 201);
  } catch (err) {
    // Database failure rollback: delete newly uploaded media from Cloud Storage
    if (newlyUploadedUrls.length) {
      await cloudStorage.deleteCloudMedia(newlyUploadedUrls);
    }
    console.error('Error adding vehicle:', err);
    return fail(res, err.message || 'Failed to add vehicle.', 500);
  }
});

app.put('/api/vehicles/:id', requireAuth, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  const newlyUploadedUrls = [];
  try {
    const existing = await get('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (!existing) return fail(res, 'Vehicle not found.', 404);

    const {
      title, brand, model, year, price, mileage, fuel,
      hp, engine, transmission, body, colour, location,
      condition_type, status, featured, description, existingImages, removeImages, video_url
    } = req.body;

    let images = parseImages(existing.images);

    // Remove deleted images from Cloud Storage
    if (removeImages) {
      let toRemove = [];
      try { toRemove = JSON.parse(removeImages); } catch {}
      images = images.filter(img => !toRemove.includes(img));
      if (toRemove.length) {
        await cloudStorage.deleteCloudMedia(toRemove);
      }
    }

    if (existingImages) { try { images = JSON.parse(existingImages); } catch {} }

    // Upload newly added images to Cloud Storage
    if (req.files?.images?.length) {
      for (const file of req.files.images) {
        const url = await cloudStorage.processAndUploadImage(file.buffer, file.originalname);
        images.push(url);
        newlyUploadedUrls.push(url);
      }
    }

    let finalVideoUrl = video_url !== undefined ? video_url : (existing.video_url || '');

    // Handle video replacement/upload
    if (req.files?.video?.length) {
      if (existing.video_url) {
        await cloudStorage.deleteCloudMedia(existing.video_url);
      }
      const vFile = req.files.video[0];
      finalVideoUrl = await cloudStorage.uploadVideo(vFile.buffer, vFile.originalname, vFile.mimetype);
      newlyUploadedUrls.push(finalVideoUrl);
    }

    const isFeatured = (featured !== undefined)
      ? (featured === 'true' || featured === true || featured === '1' ? 1 : 0)
      : existing.featured;

    await run(`
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

    const updatedV = await get('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    return ok(res, { vehicle: mapVehicle(updatedV) });
  } catch (err) {
    if (newlyUploadedUrls.length) {
      await cloudStorage.deleteCloudMedia(newlyUploadedUrls);
    }
    console.error('Error updating vehicle:', err);
    return fail(res, err.message || 'Failed to update vehicle.', 500);
  }
});

app.patch('/api/vehicles/:id/status', requireAuth, async (req, res) => {
  const valid = ['available', 'reserved', 'sold', 'draft'];
  const { status } = req.body;
  if (!valid.includes(status)) return fail(res, 'Invalid status value.');
  const result = await run("UPDATE vehicles SET status=?,updated_at=datetime('now') WHERE id=?", [status, req.params.id]);
  if (result.changes === 0) return fail(res, 'Vehicle not found.', 404);
  return ok(res, { message: `Status updated to ${status}.` });
});

app.patch('/api/vehicles/:id/featured', requireAuth, async (req, res) => {
  const v = await get('SELECT featured FROM vehicles WHERE id = ?', [req.params.id]);
  if (!v) return fail(res, 'Vehicle not found.', 404);
  const newVal = v.featured === 1 ? 0 : 1;
  await run("UPDATE vehicles SET featured=?,updated_at=datetime('now') WHERE id=?", [newVal, req.params.id]);
  return ok(res, { featured: newVal === 1 });
});

app.delete('/api/vehicles/:id', requireAuth, async (req, res) => {
  const v = await get('SELECT images, video_url FROM vehicles WHERE id = ?', [req.params.id]);
  if (!v) return fail(res, 'Vehicle not found.', 404);

  const mediaToDelete = [...parseImages(v.images)];
  if (v.video_url) mediaToDelete.push(v.video_url);

  // Trigger deletion of associated Cloud Storage objects
  if (mediaToDelete.length) {
    await cloudStorage.deleteCloudMedia(mediaToDelete);
  }

  await run('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
  return ok(res, { message: 'Vehicle and associated media deleted.' });
});

// ──────────────────────────────────────────────
// NEWSLETTER
// ──────────────────────────────────────────────

app.post('/api/newsletter', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) return fail(res, 'A valid email is required.');
  try {
    await run('INSERT INTO subscribers (email) VALUES (?)', [email.trim().toLowerCase()]);
    return ok(res, { message: "You're subscribed! Welcome to the SaloneAutoLink community." }, 201);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return ok(res, { message: 'Already subscribed. Thank you!' });
    throw err;
  }
});

app.get('/api/newsletter', requireAuth, async (req, res) => {
  const subscribers = await query('SELECT * FROM subscribers ORDER BY created_at DESC');
  return ok(res, { subscribers, total: subscribers.length });
});

// ──────────────────────────────────────────────
// REVIEWS
// ──────────────────────────────────────────────

app.get('/api/reviews', async (req, res) => {
  const reviews = await query("SELECT * FROM reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT 20");
  return ok(res, { reviews });
});

app.post('/api/reviews', async (req, res) => {
  const { name, role, rating = 5, comment } = req.body;
  if (!name || !comment) return fail(res, 'Name and review comment are required.');
  const result = await run(
    'INSERT INTO reviews (name, role, rating, comment, status) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), role?.trim() || 'Verified Client', Math.min(5, Math.max(1, parseInt(rating) || 5)), comment.trim(), 'approved']
  );
  return ok(res, { id: result.lastInsertRowid, message: 'Thank you for your review!' }, 201);
});

app.get('/api/admin/reviews', requireAuth, async (req, res) => {
  const reviews = await query('SELECT * FROM reviews ORDER BY created_at DESC');
  return ok(res, { reviews, total: reviews.length });
});

app.delete('/api/admin/reviews/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  await run('DELETE FROM reviews WHERE id = ?', [id]);
  return ok(res, { message: 'Review deleted successfully.' });
});

// ──────────────────────────────────────────────
// PUBLIC STATS (Live dynamic count for index.html)
// ──────────────────────────────────────────────

app.get('/api/stats/public', async (req, res) => {
  const availableCarsRow = await get("SELECT COUNT(*) as c FROM vehicles WHERE status = 'available'");
  const totalBrandsRow   = await get("SELECT COUNT(DISTINCT brand) as c FROM vehicles");
  const totalSoldRow     = await get("SELECT COUNT(*) as c FROM vehicles WHERE status = 'sold'");

  const availableCars = Number(availableCarsRow?.c || 0);
  const totalBrands   = Number(totalBrandsRow?.c || 0);
  const totalSold     = Number(totalSoldRow?.c || 0);

  return ok(res, {
    carsAvailable: availableCars,
    satisfiedClients: totalSold + 25,
    brandsCount: totalBrands,
    satisfactionRate: 99
  });
});

app.get('/api/stats', requireAuth, async (req, res) => {
  const totalRow     = await get("SELECT COUNT(*) as c FROM vehicles");
  const availableRow = await get("SELECT COUNT(*) as c FROM vehicles WHERE status='available'");
  const reservedRow  = await get("SELECT COUNT(*) as c FROM vehicles WHERE status='reserved'");
  const soldRow      = await get("SELECT COUNT(*) as c FROM vehicles WHERE status='sold'");
  const draftsRow    = await get("SELECT COUNT(*) as c FROM vehicles WHERE status='draft'");
  const featuredRow  = await get("SELECT COUNT(*) as c FROM vehicles WHERE featured=1");
  const totalValRow  = await get("SELECT SUM(price) as s FROM vehicles WHERE status!='draft'");
  const soldValRow   = await get("SELECT SUM(price) as s FROM vehicles WHERE status='sold'");
  const subsRow      = await get("SELECT COUNT(*) as c FROM subscribers");

  const total     = Number(totalRow?.c || 0);
  const available = Number(availableRow?.c || 0);
  const reserved  = Number(reservedRow?.c || 0);
  const sold      = Number(soldRow?.c || 0);
  const drafts    = Number(draftsRow?.c || 0);
  const featured  = Number(featuredRow?.c || 0);
  const totalVal  = Number(totalValRow?.s || 0);
  const soldVal   = Number(soldValRow?.s || 0);
  const subs      = Number(subsRow?.c || 0);

  const rawRecent = await query('SELECT * FROM vehicles ORDER BY created_at DESC LIMIT 5');
  const recentVehicles = rawRecent.map(mapVehicle);

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

app.post('/api/upload', requireAuth, upload.array('images', 10), async (req, res) => {
  if (!req.files?.length) return fail(res, 'No files uploaded.');

  try {
    const urls = [];
    for (const file of req.files) {
      const url = await cloudStorage.processAndUploadImage(file.buffer, file.originalname);
      urls.push(url);
    }
    return ok(res, { urls });
  } catch (err) {
    console.error('Standalone upload error:', err);
    return fail(res, err.message || 'Upload failed.', 500);
  }
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
// START — local listen if run directly
// ──────────────────────────────────────────────
if (require.main === module) {
  initDatabase().then(() => {
    app.listen(PORT, () => {
      console.log('\n' +
        '  ╔══════════════════════════════════════════╗\n' +
        '  ║   🚘  SALONEAUTOLINK — SERVER RUNNING    ║\n' +
        '  ╚══════════════════════════════════════════╝\n'
      );
      console.log(`  🌐  Showroom   → http://localhost:${PORT}`);
      console.log(`  🔐  Admin Gate → http://localhost:${PORT}/admin/get/get_chenor`);
      console.log(`  📡  API Base   → http://localhost:${PORT}/api\n`);
    });
  }).catch(err => {
    console.error('Failed to initialise database:', err);
    process.exit(1);
  });
}

module.exports = app;
