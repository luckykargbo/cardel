const { initDatabase, run, get } = require('./database/db');

async function testUpdate() {
  await initDatabase();
  console.log('Testing update on vehicle 13...');
  run(`
    UPDATE vehicles SET
      title=?,brand=?,model=?,year=?,price=?,mileage=?,fuel=?,hp=?,engine=?,
      transmission=?,body=?,colour=?,location=?,condition_type=?,status=?,
      featured=?,description=?,images=?,video_url=?,updated_at=datetime('now')
    WHERE id=?
  `, [
    'BMW M8 Competition Coupé', 'BMW', 'M8 Competition', 2024, 2450000, 2100,
    'Petrol', '625 hp', '4.4L V8 Twin-Turbo', 'Automatic', 'Coupé', 'Obsidian Black',
    'Freetown', 'new', 'available', 1, 'Description here',
    '["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900&q=85"]',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    13
  ]);

  const updated = get('SELECT * FROM vehicles WHERE id = 13');
  console.log('SUCCESS! Updated vehicle 13:', updated.title, updated.video_url);
}

testUpdate().catch(err => console.error('FAILED UPDATE ERROR:', err));
