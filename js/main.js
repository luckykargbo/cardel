/* ============================================================
   PRESTIGE MOTORS — PUBLIC SITE JAVASCRIPT
   ============================================================ */

// ============================================================
// CONFIG
// ============================================================
const WA_NUMBER = '23276637648'; // +232 76 637 648 (Sierra Leone)

function buildWALink(v) {
  const msg = encodeURIComponent(
    `🚘 *Prestige Motors Enquiry*\n\n` +
    `I'm interested in the following vehicle:\n\n` +
    `*${v.title}*\n` +
    `📅 Year: ${v.year}\n` +
    `⛽ Fuel: ${v.fuel}\n` +
    `⚙️ Engine: ${v.engine}\n` +
    `💪 Power: ${v.hp}\n` +
    `🔄 Transmission: ${v.transmission}\n` +
    `🛣️ Mileage: ${v.mileage}\n` +
    `🎨 Colour: ${v.colour}\n` +
    `📍 Location: ${v.location}\n` +
    `💰 Price: ${fmtFull(v.price)}\n\n` +
    `Please get back to me as soon as possible. Thank you!`
  );
  return `https://wa.me/${WA_NUMBER}?text=${msg}`;
}
const VEHICLES = [
  {
    id: 1,
    title: 'BMW M8 Competition Coupé',
    brand: 'BMW',
    model: 'M8 Competition',
    year: 2024,
    price: 2450000,
    monthly: 46200,
    mileage: '2,100 km',
    fuel: 'Petrol',
    hp: '625 hp',
    transmission: 'Automatic',
    engine: '4.4L V8',
    colour: 'Obsidian Black',
    location: 'Freetown',
    body: 'Coupé',
    type: 'new',
    verified: true,
    badge360: true,
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=85',
    dealer: 'Prestige West Africa'
  },
  {
    id: 2,
    title: 'Mercedes-AMG GT 63 S',
    brand: 'Mercedes-Benz',
    model: 'AMG GT 63',
    year: 2024,
    price: 3200000,
    monthly: 60300,
    mileage: '480 km',
    fuel: 'Petrol',
    hp: '639 hp',
    transmission: 'Automatic',
    engine: '4.0L V8',
    colour: 'Polar White',
    location: 'Freetown',
    body: 'Sedan',
    type: 'new',
    verified: true,
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=85',
    dealer: 'Prestige West Africa'
  },
  {
    id: 3,
    title: 'Porsche 911 Turbo S',
    brand: 'Porsche',
    model: '911 Turbo S',
    year: 2024,
    price: 4100000,
    monthly: 77400,
    mileage: '480 km',
    fuel: 'Petrol',
    hp: '650 hp',
    transmission: 'PDK',
    engine: '3.8L Twin-Turbo',
    colour: 'Midnight Blue',
    location: 'Freetown',
    body: 'Coupé',
    type: 'new',
    verified: true,
    badge360: true,
    badge: 'Editor\'s Choice',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=85',
    dealer: 'Prestige West Africa'
  },
  {
    id: 4,
    title: 'Ferrari 296 GTB',
    brand: 'Ferrari',
    model: '296 GTB',
    year: 2023,
    price: 6800000,
    monthly: 128200,
    mileage: '1,200 km',
    fuel: 'Hybrid',
    hp: '830 hp',
    transmission: 'DCT',
    engine: '3.0L V6 + Electric',
    colour: 'Rosso Corsa',
    location: 'Freetown',
    body: 'Coupé',
    type: 'used',
    verified: true,
    badge: 'Limited Offer',
    image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=800&q=85',
    dealer: 'Prestige West Africa'
  },
  {
    id: 5,
    title: 'Lamborghini Huracán Tecnica',
    brand: 'Lamborghini',
    model: 'Huracán Tecnica',
    year: 2024,
    price: 7900000,
    monthly: 149000,
    mileage: '0 km',
    fuel: 'Petrol',
    hp: '640 hp',
    transmission: 'DCT',
    engine: '5.2L V10',
    colour: 'Racing Yellow',
    location: 'Freetown',
    body: 'Coupé',
    type: 'new',
    verified: true,
    badge360: true,
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=85',
    dealer: 'Prestige West Africa'
  },
  {
    id: 6,
    title: 'Audi R8 V10 Performance',
    brand: 'Audi',
    model: 'R8 V10',
    year: 2024,
    price: 3600000,
    monthly: 67900,
    mileage: '3,800 km',
    fuel: 'Petrol',
    hp: '620 hp',
    transmission: 'DCT',
    engine: '5.2L V10',
    colour: 'Nardo Grey',
    location: 'Bo',
    body: 'Coupé',
    type: 'used',
    verified: true,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=85',
    dealer: 'AutoElite SL'
  },
  {
    id: 7,
    title: 'Tesla Model S Plaid',
    brand: 'Tesla',
    model: 'Model S Plaid',
    year: 2024,
    price: 1950000,
    monthly: 36800,
    mileage: '0 km',
    fuel: 'Electric',
    hp: '1,020 hp',
    transmission: 'Electric',
    engine: 'Tri-Motor Electric',
    colour: 'Midnight Silver',
    location: 'Freetown',
    body: 'Sedan',
    type: 'electric',
    verified: true,
    badge: 'Electric',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=85',
    dealer: 'Prestige West Africa'
  },
  {
    id: 8,
    title: 'Bentley Continental GT V8',
    brand: 'Bentley',
    model: 'Continental GT',
    year: 2023,
    price: 9200000,
    monthly: 173500,
    mileage: '5,400 km',
    fuel: 'Petrol',
    hp: '542 hp',
    transmission: 'Automatic',
    engine: '4.0L V8',
    colour: 'Tungsten',
    location: 'Freetown',
    body: 'Coupé',
    type: 'used',
    verified: true,
    badge: 'New Arrival',
    image: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&q=85',
    dealer: 'Prestige West Africa'
  },
  {
    id: 9,
    title: 'Rolls-Royce Ghost Series II',
    brand: 'Rolls-Royce',
    model: 'Ghost',
    year: 2024,
    price: 14500000,
    monthly: 273400,
    mileage: '1,050 km',
    fuel: 'Petrol',
    hp: '563 hp',
    transmission: 'Automatic',
    engine: '6.75L V12',
    colour: 'Arctic White',
    location: 'Freetown',
    body: 'Sedan',
    type: 'new',
    verified: true,
    badge360: true,
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=800&q=85',
    dealer: 'Prestige West Africa'
  }
];

// ============================================================
// STATE
// ============================================================
let favourites = JSON.parse(localStorage.getItem('pm_favourites') || '[]');
let currentFilter = 'all';
let carouselIndex = 0;
let carouselTimer;
const TOTAL_SLIDES = 4;

// ============================================================
// UTILITY HELPERS
// ============================================================
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function fmtNLE(num) {
  if (num >= 1000000) return 'NLE ' + (num / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (num >= 1000) return 'NLE ' + (num / 1000).toFixed(0) + 'K';
  return 'NLE ' + num.toLocaleString();
}

function fmtFull(num) {
  return 'NLE ' + num.toLocaleString();
}

function showToast(msg, type = 'gold', duration = 3500) {
  const icons = { gold: 'ri-star-fill', success: 'ri-checkbox-circle-fill', error: 'ri-error-warning-fill' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="${icons[type] || icons.gold}"></i><span>${msg}</span>`;
  $('#toastContainer').appendChild(toast);
  setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 400); }, duration);
}

// ============================================================
// NAVBAR SCROLL BEHAVIOUR
// ============================================================
function initNavbar() {
  const navbar = $('#navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    $('#backToTop').classList.toggle('hidden', window.scrollY < 400);
  }, { passive: true });

  // Hamburger
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('show');
  });

  // Close mobile menu on link click
  $$('[data-close]').forEach(el => {
    el.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('show');
    });
  });

  // Search toggle
  const overlay = $('#navSearchOverlay');
  $('#searchToggle').addEventListener('click', () => {
    overlay.classList.add('show');
    setTimeout(() => $('#navSearchInput').focus(), 50);
  });
  $('#navSearchClose').addEventListener('click', () => overlay.classList.remove('show'));
  $('#navSearchInput').addEventListener('keydown', e => { if (e.key === 'Escape') overlay.classList.remove('show'); });

  // Back to top
  $('#backToTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============================================================
// PARTICLES CANVAS
// ============================================================
function initParticles() {
  const canvas = $('#particlesCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let W, H;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.5 - 0.2,
      a: Math.random() * 0.6 + 0.2,
      fade: Math.random() * 0.002 + 0.001
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 120 }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(229,169,92,${p.a})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;
      p.a -= p.fade;

      if (p.a <= 0 || p.y < -10) particles[i] = createParticle();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  init();
  draw();
}

// ============================================================
// VEHICLE CARDS RENDERING
// ============================================================
function renderVehicles(filter = 'all') {
  const grid = $('#vehiclesGrid');
  if (!grid) return;

  const filtered = filter === 'all' ? VEHICLES : VEHICLES.filter(v => v.type === filter);
  const isFav = (id) => favourites.includes(id);

  grid.innerHTML = filtered.map(v => `
    <div class="vehicle-card reveal-item" data-id="${v.id}" data-type="${v.type}" onclick="openQuickView(${v.id})">
      <div class="card-media">
        <img src="${v.image}" alt="${v.title}" loading="lazy">
        <div class="card-badges">
          ${v.type === 'new' ? '<span class="card-badge badge-new">New</span>' : ''}
          ${v.type === 'electric' ? '<span class="card-badge badge-electric">⚡ Electric</span>' : ''}
          ${v.badge ? `<span class="card-badge badge-limited">${v.badge}</span>` : ''}
          ${v.verified ? '<span class="card-badge badge-verified"><i class="ri-verified-badge-fill"></i> Verified</span>' : ''}
        </div>
        <div class="card-hover-actions" onclick="event.stopPropagation()">
          <button class="card-action-btn ${isFav(v.id) ? 'faved' : ''}" data-fav-id="${v.id}" onclick="toggleFav(${v.id})" title="Save to Favourites">
            <i class="${isFav(v.id) ? 'ri-heart-fill' : 'ri-heart-line'}"></i>
          </button>
          <button class="card-action-btn" onclick="openQuickView(${v.id})" title="Quick View">
            <i class="ri-eye-line"></i>
          </button>
          <a class="card-action-btn" href="${buildWALink(v)}" target="_blank" title="WhatsApp Enquiry" onclick="event.stopPropagation()" style="text-decoration:none">
            <i class="ri-whatsapp-line" style="color:#25D366"></i>
          </a>
        </div>
        <div class="card-media-overlay"></div>
        <div class="card-quick-view"><i class="ri-eye-line"></i> Quick View</div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${v.title}</h3>
        <div class="card-price-row">
          <span class="card-price">${fmtNLE(v.price)}</span>
        </div>
        <div class="card-specs">
          <div class="card-spec"><span class="spec-label">Year</span><span class="spec-val">${v.year}</span></div>
          <div class="card-spec"><span class="spec-label">Fuel</span><span class="spec-val">${v.fuel}</span></div>
          <div class="card-spec"><span class="spec-label">Power</span><span class="spec-val">${v.hp}</span></div>
          <div class="card-spec"><span class="spec-label">Gearbox</span><span class="spec-val">${v.transmission}</span></div>
          <div class="card-spec"><span class="spec-label">Engine</span><span class="spec-val">${v.engine}</span></div>
          <div class="card-spec"><span class="spec-label">Mileage</span><span class="spec-val">${v.mileage}</span></div>
        </div>
        <div class="card-meta">
          <div class="card-dealer">
            <i class="ri-verified-badge-fill"></i>
            <span>${v.dealer}</span>
          </div>
          <div class="card-location"><i class="ri-map-pin-line"></i>${v.location}</div>
        </div>
      </div>
    </div>
  `).join('');

  // Re-observe reveal items
  observeReveal();
}

function toggleFav(id) {
  const btns = document.querySelectorAll(`[data-fav-id="${id}"]`);

  if (favourites.includes(id)) {
    favourites = favourites.filter(f => f !== id);
    btns.forEach(btn => {
      btn.classList.remove('faved');
      btn.innerHTML = '<i class="ri-heart-line"></i>';
    });
    showToast('Removed from favourites', 'gold');
  } else {
    favourites.push(id);
    btns.forEach(btn => {
      btn.classList.add('faved');
      btn.innerHTML = '<i class="ri-heart-fill"></i>';
    });
    showToast('❤️ Saved to favourites!', 'success');
  }
  localStorage.setItem('pm_favourites', JSON.stringify(favourites));
  updateFavCount();
}

function updateFavCount() {
  const badge = $('#favCount');
  if (!badge) return;
  badge.textContent = favourites.length;
  badge.classList.toggle('hidden', favourites.length === 0);
}

// ============================================================
// FILTER PILLS
// ============================================================
function initFilterPills() {
  $$('#vehicleFilterPills .filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('#vehicleFilterPills .filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      renderVehicles(currentFilter);
    });
  });

  const loadMore = $('#loadMoreBtn');
  if (loadMore) {
    loadMore.addEventListener('click', () => {
      showToast('All vehicles displayed for this demo', 'gold');
    });
  }
}

// ============================================================
// BRAND FILTER
// ============================================================
function filterByBrand(brand) {
  // Scroll to inventory
  $('#inventory').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => {
    const filtered = VEHICLES.filter(v => v.brand === brand || v.brand.includes(brand));
    const grid = $('#vehiclesGrid');
    if (grid) {
      // Reset filter pills
      $$('#vehicleFilterPills .filter-pill').forEach(p => p.classList.remove('active'));
      $('[data-filter="all"]').classList.add('active');

      grid.innerHTML = filtered.length > 0
        ? filtered.map(v => renderCard(v)).join('')
        : `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">
             <i class="ri-car-line" style="font-size:48px;margin-bottom:12px;color:var(--gold);display:block"></i>
             <p>No ${brand} vehicles in demo. More coming soon!</p>
             <button onclick="renderVehicles('all')" style="margin-top:16px" class="btn-view-all">Show All</button>
           </div>`;
      observeReveal();
    }
    if (filtered.length > 0) showToast(`Showing ${filtered.length} ${brand} vehicle${filtered.length > 1 ? 's' : ''}`, 'gold');
  }, 600);
}

function renderCard(v) {
  const isFav = favourites.includes(v.id);
  return `
    <div class="vehicle-card reveal-item" data-id="${v.id}" onclick="openQuickView(${v.id})">
      <div class="card-media">
        <img src="${v.image}" alt="${v.title}" loading="lazy">
        <div class="card-badges">
          ${v.type === 'new' ? '<span class="card-badge badge-new">New</span>' : ''}
          ${v.type === 'electric' ? '<span class="card-badge badge-electric">⚡ Electric</span>' : ''}
          ${v.badge ? `<span class="card-badge badge-limited">${v.badge}</span>` : ''}
          ${v.verified ? '<span class="card-badge badge-verified"><i class="ri-verified-badge-fill"></i> Verified</span>' : ''}
        </div>
        <div class="card-hover-actions" onclick="event.stopPropagation()">
          <button class="card-action-btn ${isFav ? 'faved' : ''}" data-fav-id="${v.id}" onclick="toggleFav(${v.id})" title="Save to Favourites">
            <i class="${isFav ? 'ri-heart-fill' : 'ri-heart-line'}"></i>
          </button>
          <button class="card-action-btn" onclick="openQuickView(${v.id})" title="Quick View">
            <i class="ri-eye-line"></i>
          </button>
          <a class="card-action-btn" href="${buildWALink(v)}" target="_blank" title="WhatsApp Enquiry" onclick="event.stopPropagation()" style="text-decoration:none">
            <i class="ri-whatsapp-line" style="color:#25D366"></i>
          </a>
        </div>
        <div class="card-media-overlay"></div>
        <div class="card-quick-view"><i class="ri-eye-line"></i> Quick View</div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${v.title}</h3>
        <div class="card-price-row">
          <span class="card-price">${fmtNLE(v.price)}</span>
        </div>
        <div class="card-specs">
          <div class="card-spec"><span class="spec-label">Year</span><span class="spec-val">${v.year}</span></div>
          <div class="card-spec"><span class="spec-label">Fuel</span><span class="spec-val">${v.fuel}</span></div>
          <div class="card-spec"><span class="spec-label">Power</span><span class="spec-val">${v.hp}</span></div>
          <div class="card-spec"><span class="spec-label">Gearbox</span><span class="spec-val">${v.transmission}</span></div>
          <div class="card-spec"><span class="spec-label">Engine</span><span class="spec-val">${v.engine}</span></div>
          <div class="card-spec"><span class="spec-label">Mileage</span><span class="spec-val">${v.mileage}</span></div>
        </div>
        <div class="card-meta">
          <div class="card-dealer"><i class="ri-verified-badge-fill"></i><span>${v.dealer}</span></div>
          <div class="card-location"><i class="ri-map-pin-line"></i>${v.location}</div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// QUICK SEARCH
// ============================================================
function quickSearch(term) {
  const filtered = VEHICLES.filter(v =>
    v.title.toLowerCase().includes(term.toLowerCase()) ||
    v.brand.toLowerCase().includes(term.toLowerCase())
  );
  const grid = $('#vehiclesGrid');
  if (grid) {
    grid.innerHTML = filtered.map(v => renderCard(v)).join('');
    observeReveal();
  }
  $('#inventory').scrollIntoView({ behavior: 'smooth' });
  showToast(`Showing results for "${term}"`, 'gold');
}

// ============================================================
// SEARCH PANEL
// ============================================================
function initSearch() {
  $('#searchBtn').addEventListener('click', () => {
    const brand = $('#filterBrand').value;
    const filtered = brand
      ? VEHICLES.filter(v => v.brand === brand || v.brand.includes(brand))
      : VEHICLES;

    const grid = $('#vehiclesGrid');
    grid.innerHTML = filtered.length > 0
      ? filtered.map(v => renderCard(v)).join('')
      : `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">
           <i class="ri-search-line" style="font-size:48px;margin-bottom:12px;color:var(--gold);display:block"></i>
           <p>No vehicles match your filters. Try adjusting your criteria.</p>
         </div>`;

    observeReveal();
    $('#inventory').scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(`Found ${filtered.length} vehicle${filtered.length !== 1 ? 's' : ''}`, 'success');
  });

  $('#searchReset').addEventListener('click', () => {
    $$('.filter-select').forEach(s => s.value = '');
    renderVehicles('all');
    showToast('Filters cleared', 'gold');
  });
}

// ============================================================
// QUICK VIEW MODAL
// ============================================================
function openQuickView(id) {
  const v = VEHICLES.find(v => v.id === id);
  if (!v) return;

  $('#quickViewContent').innerHTML = `
    <div class="qv-inner">
      <div class="qv-media">
        <img src="${v.image}" alt="${v.title}">
      </div>
      <div class="qv-details">
        <div>
          <span style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--gold);text-transform:uppercase">${v.brand} · ${v.year}</span>
          <h2 class="qv-title">${v.title}</h2>
        </div>
        <div>
          <div class="qv-price">${fmtFull(v.price)}</div>
          <div class="qv-monthly">From ${fmtFull(v.monthly)} / month</div>
        </div>
        <div class="qv-specs-grid">
          <div class="qv-spec"><div class="qv-spec-label">Horsepower</div><div class="qv-spec-val">${v.hp}</div></div>
          <div class="qv-spec"><div class="qv-spec-label">Engine</div><div class="qv-spec-val">${v.engine}</div></div>
          <div class="qv-spec"><div class="qv-spec-label">Transmission</div><div class="qv-spec-val">${v.transmission}</div></div>
          <div class="qv-spec"><div class="qv-spec-label">Fuel</div><div class="qv-spec-val">${v.fuel}</div></div>
          <div class="qv-spec"><div class="qv-spec-label">Mileage</div><div class="qv-spec-val">${v.mileage}</div></div>
          <div class="qv-spec"><div class="qv-spec-label">Colour</div><div class="qv-spec-val">${v.colour}</div></div>
          <div class="qv-spec"><div class="qv-spec-label">Body Type</div><div class="qv-spec-val">${v.body}</div></div>
          <div class="qv-spec"><div class="qv-spec-label">Location</div><div class="qv-spec-val">${v.location}</div></div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px">
          <i class="ri-verified-badge-fill" style="color:var(--gold)"></i> ${v.dealer} · Verified Dealer
        </div>
        <div class="qv-actions">
          <a class="btn-qv-primary" href="${buildWALink(v)}" target="_blank" style="text-decoration:none">
            <i class="ri-whatsapp-line"></i> WhatsApp Enquiry
          </a>
          <button class="btn-qv-fav ${isFav(v.id) ? 'faved' : ''}" data-fav-id="${v.id}" onclick="toggleFav(${v.id})" title="Save to Favourites">
            <i class="${isFav(v.id) ? 'ri-heart-fill' : 'ri-heart-line'}"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  $('#quickViewModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function initModals() {
  // Quick View close
  if ($('#quickViewClose')) $('#quickViewClose').addEventListener('click', closeQuickView);
  if ($('#quickViewModal')) $('#quickViewModal').addEventListener('click', e => { if (e.target === $('#quickViewModal')) closeQuickView(); });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeQuickView(); }
  });
}

function closeQuickView() {
  $('#quickViewModal').classList.remove('show');
  document.body.style.overflow = '';
}

function openTestDrive(vehicleTitle) {
  if (vehicleTitle) {
    const sel = $('#tdVehicle');
    if (sel) {
      const opt = Array.from(sel.options).find(o => o.text.includes(vehicleTitle.split(' ').slice(0, 2).join(' ')));
      if (opt) sel.value = opt.value;
    }
  }
  // Set min date to tomorrow
  const tdDate = $('#tdDate');
  if (tdDate) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tdDate.min = tomorrow.toISOString().split('T')[0];
  }
  $('#testDriveModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeTestDrive() {
  $('#testDriveModal').classList.remove('show');
  document.body.style.overflow = '';
}

// ============================================================
// SHOWCASE IMAGE SWITCHER
// ============================================================
function changeShowcaseImg(thumb, src) {
  $$('.showcase-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
  const img = $('#showcaseImg');
  img.style.opacity = '0';
  img.style.transform = 'scale(1.02)';
  img.style.transition = 'opacity 0.3s, transform 0.3s';
  setTimeout(() => {
    img.src = src;
    img.style.opacity = '1';
    img.style.transform = 'scale(1)';
  }, 300);
}


// ============================================================
// TESTIMONIALS CAROUSEL
// ============================================================
function initCarousel() {
  const track = $('#testimonialsCarousel');
  if (!track) return;

  function goTo(index) {
    carouselIndex = (index + TOTAL_SLIDES) % TOTAL_SLIDES;
    track.style.transform = `translateX(-${carouselIndex * 100}%)`;
    $$('#carouselDots .carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === carouselIndex);
    });
  }

  $('#carouselPrev').addEventListener('click', () => { goTo(carouselIndex - 1); resetCarouselTimer(); });
  $('#carouselNext').addEventListener('click', () => { goTo(carouselIndex + 1); resetCarouselTimer(); });

  $$('#carouselDots .carousel-dot').forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); resetCarouselTimer(); });
  });

  function autoPlay() { goTo(carouselIndex + 1); }
  carouselTimer = setInterval(autoPlay, 5000);

  // Touch swipe
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(carouselIndex + (diff > 0 ? 1 : -1));
    resetCarouselTimer();
  });
}

function resetCarouselTimer() {
  clearInterval(carouselTimer);
  carouselTimer = setInterval(() => {
    carouselIndex = (carouselIndex + 1) % TOTAL_SLIDES;
    const track = $('#testimonialsCarousel');
    if (track) track.style.transform = `translateX(-${carouselIndex * 100}%)`;
    $$('#carouselDots .carousel-dot').forEach((dot, i) => dot.classList.toggle('active', i === carouselIndex));
  }, 5000);
}

// ============================================================
// ANIMATED COUNTERS
// ============================================================
function initCounters() {
  const counters = $$('.stat-num');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = Math.floor(current).toLocaleString();
          if (current >= target) clearInterval(timer);
        }, 16);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  counters.forEach(c => observer.observe(c));
}

// ============================================================
// SCROLL REVEAL (INTERSECTION OBSERVER)
// ============================================================
function observeReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal-item').forEach(el => { if (!el.classList.contains('visible')) io.observe(el); });
}

// ============================================================
// NEWSLETTER
// ============================================================
function initNewsletter() {
  const btn = $('#newsletterBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const email = $('#newsletterEmail').value.trim();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    $('#newsletterEmail').value = '';
    showToast('Welcome to Prestige Motors! 🎉', 'success');
  });
}

// ============================================================
// BRAND RIPPLE EFFECT
// ============================================================
function initBrandRipple() {
  $$('.brand-circle').forEach(circle => {
    circle.addEventListener('click', function(e) {
      const ripple = this.querySelector('.brand-ripple');
      if (!ripple) return;
      ripple.style.width = '0';
      ripple.style.height = '0';
      ripple.style.opacity = '1';
      ripple.style.transition = 'none';
      setTimeout(() => {
        ripple.style.transition = 'width 0.6s, height 0.6s, opacity 0.8s';
        ripple.style.width = '200px';
        ripple.style.height = '200px';
        ripple.style.opacity = '0';
      }, 10);
    });
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initParticles();
  renderVehicles('all');
  initFilterPills();
  initSearch();
  initModals();

  initCarousel();
  initCounters();
  observeReveal();
  initNewsletter();
  initBrandRipple();
  updateFavCount();

  // Smooth reveal for hero elements
  setTimeout(() => observeReveal(), 200);
});

// Global exposure for onclick handlers in HTML
window.openQuickView  = openQuickView;
window.openTestDrive  = openTestDrive;
window.toggleFav      = toggleFav;
window.filterByBrand  = filterByBrand;
window.quickSearch    = quickSearch;
window.changeShowcaseImg = changeShowcaseImg;
