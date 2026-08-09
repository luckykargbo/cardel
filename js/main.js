/* ============================================================
   PRESTIGE MOTORS — PUBLIC SITE JAVASCRIPT
   100% Live API — SQLite Backend Powered
   ============================================================ */

'use strict';

// ──────────────────────────────────────────────
// CONFIG & STATE
// ──────────────────────────────────────────────
const API_BASE   = window.location.origin + '/api';
const WA_NUMBER  = '23276637648';

let allVehicles      = [];
let filteredVehicles = [];
let displayedCount   = 0;
let PAGE_SIZE        = 9;
let favourites       = JSON.parse(localStorage.getItem('pm_favourites') || '[]');
let currentQuickId   = null;

// ──────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

function fmtPrice(n) {
  if (!n && n !== 0) return 'N/A';
  if (n >= 1000000) return 'NLE ' + (n / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n >= 1000)    return 'NLE ' + (n / 1000).toFixed(0) + 'K';
  return 'NLE ' + n.toLocaleString();
}

function fmtFull(n) {
  if (!n && n !== 0) return 'N/A';
  return 'NLE ' + n.toLocaleString();
}

function fmtMonthly(price) {
  return fmtPrice(Math.round(price / 24));
}

function fmtMileage(km) {
  if (km === 0) return 'Brand New';
  return Number(km).toLocaleString() + ' km';
}

function buildWALink(v) {
  const msg = encodeURIComponent(
    `🚘 *Prestige Motors Enquiry*\n\n` +
    `I am interested in the following vehicle:\n\n` +
    `*${v.title}*\n` +
    `📅 Year: ${v.year}\n` +
    `⛽ Fuel: ${v.fuel}\n` +
    `⚙️ Engine: ${v.engine || 'N/A'}\n` +
    `💪 Power: ${v.hp || 'N/A'}\n` +
    `🔄 Transmission: ${v.transmission || 'N/A'}\n` +
    `🛣️ Mileage: ${fmtMileage(v.mileage)}\n` +
    `🎨 Colour: ${v.colour || 'N/A'}\n` +
    `📍 Location: ${v.location || 'Freetown'}\n` +
    `💰 Price: ${fmtFull(v.price)}\n\n` +
    `Please get back to me as soon as possible. Thank you!`
  );
  return `https://wa.me/${WA_NUMBER}?text=${msg}`;
}

function showToast(msg, type = 'info', duration = 3500) {
  const icons = { info: 'ri-information-line', success: 'ri-checkbox-circle-fill', error: 'ri-error-warning-fill', warning: 'ri-alert-fill' };
  const container = $('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 400); }, duration);
}

// ──────────────────────────────────────────────
// API CALLS
// ──────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  try {
    const res  = await fetch(API_BASE + endpoint, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, message: 'Network error. Please try again.' };
  }
}

// ──────────────────────────────────────────────
// VEHICLE LOADING
// ──────────────────────────────────────────────
async function loadVehicles(params = {}) {
  const query = new URLSearchParams(params).toString();
  const data  = await apiFetch(`/vehicles${query ? '?' + query : ''}`);
  if (!data.success) { showToast('Failed to load inventory.', 'error'); return []; }
  return data.vehicles || [];
}

async function initInventory() {
  const grid = $('vehiclesGrid');
  if (!grid) return;

  showLoadingSkeleton(grid);
  allVehicles      = await loadVehicles({ limit: 100 });
  filteredVehicles = [...allVehicles];
  displayedCount   = 0;
  renderPage();
  updateFavBadge();
}

function showLoadingSkeleton(grid) {
  grid.innerHTML = Array(6).fill(0).map(() => `
    <div class="vehicle-card skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
    </div>
  `).join('');
}

// ──────────────────────────────────────────────
// RENDER
// ──────────────────────────────────────────────
function renderPage() {
  const grid = $('vehiclesGrid');
  if (!grid) return;
  if (displayedCount === 0) grid.innerHTML = '';

  const slice = filteredVehicles.slice(displayedCount, displayedCount + PAGE_SIZE);
  displayedCount += slice.length;

  if (slice.length === 0 && displayedCount === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:60px 20px">
        <i class="ri-car-line" style="font-size:48px;color:var(--gold);opacity:0.5;display:block;margin-bottom:16px"></i>
        <h3 style="color:var(--text-primary);margin-bottom:8px">No vehicles found</h3>
        <p style="color:var(--text-muted)">Try adjusting your filters or browse all vehicles.</p>
        <button class="btn-hero-primary" style="margin-top:20px;display:inline-flex" onclick="resetAllFilters()">
          <i class="ri-refresh-line"></i> Clear Filters
        </button>
      </div>`;
    const lb = $('loadMoreBtn');
    if (lb) lb.style.display = 'none';
    return;
  }

  slice.forEach(v => {
    const card = buildVehicleCard(v);
    grid.insertAdjacentHTML('beforeend', card);
  });

  const lb = $('loadMoreBtn');
  if (lb) {
    lb.style.display = displayedCount >= filteredVehicles.length ? 'none' : 'flex';
  }

  attachCardEvents();
}

function buildVehicleCard(v) {
  const img     = (v.images && v.images[0]) ? v.images[0] : 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80';
  const isFav   = favourites.includes(v.id);
  const waLink  = buildWALink(v);
  const isNew   = v.condition_type === 'new';
  const isSold  = v.status === 'sold';
  const isResv  = v.status === 'reserved';

  const statusBadge = isSold
    ? `<span class="car-badge sold-badge">Sold</span>`
    : isResv
    ? `<span class="car-badge reserved-badge">Reserved</span>`
    : isNew
    ? `<span class="car-badge new-badge">New</span>`
    : `<span class="car-badge used-badge">Pre-Owned</span>`;

  const featuredBadge = v.featured
    ? `<span class="car-badge featured-badge"><i class="ri-star-fill"></i> Featured</span>`
    : '';

  const electricBadge = v.fuel === 'Electric'
    ? `<span class="car-badge electric-badge"><i class="ri-flashlight-fill"></i> EV</span>`
    : '';

  const hasVideoBadge = v.video_url
    ? `<span class="car-badge" style="background:rgba(229,169,92,0.2);color:var(--gold);border:1px solid rgba(229,169,92,0.4)"><i class="ri-video-line"></i> Video</span>`
    : '';

  return `
    <article class="vehicle-card reveal-item" data-id="${v.id}" data-brand="${v.brand}" data-type="${v.condition_type}" data-fuel="${v.fuel}">
      <div class="car-img-wrap">
        <img src="${img}" alt="${v.title}" class="car-img" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80'">
        <div class="car-badges-row">
          ${statusBadge}
          ${featuredBadge}
          ${electricBadge}
          ${hasVideoBadge}
        </div>
        <div class="car-img-actions">
          <button class="car-action-btn fav-toggle ${isFav ? 'active' : ''}"
                  onclick="toggleFav(${v.id}, this)" title="${isFav ? 'Remove from favourites' : 'Add to favourites'}">
            <i class="ri-heart-${isFav ? 'fill' : 'line'}"></i>
          </button>
          <button class="car-action-btn" onclick="openQuickView(${v.id})" title="Quick View">
            <i class="ri-eye-line"></i>
          </button>
        </div>
      </div>
      <div class="car-body">
        <div class="car-top-row">
          <span class="car-brand">${v.brand}</span>
          <span class="car-year">${v.year}</span>
        </div>
        <h3 class="car-title">${v.title}</h3>
        <div class="car-meta-grid">
          <div class="car-meta-item"><i class="ri-route-line"></i><span>${fmtMileage(v.mileage)}</span></div>
          <div class="car-meta-item"><i class="ri-gas-station-line"></i><span>${v.fuel}</span></div>
          <div class="car-meta-item"><i class="ri-settings-3-line"></i><span>${v.transmission || 'N/A'}</span></div>
          <div class="car-meta-item"><i class="ri-map-pin-line"></i><span>${v.location || 'Freetown'}</span></div>
        </div>
        <div class="car-footer">
          <div class="car-price-col">
            <div class="car-price">${fmtPrice(v.price)}</div>
          </div>
          <div class="car-cta-row">
            ${!isSold ? `
            <a href="${waLink}" target="_blank" class="btn-car-wa" title="Enquire on WhatsApp">
              <i class="ri-whatsapp-line"></i>
            </a>` : ''}
            <button class="btn-car-view" onclick="openQuickView(${v.id})">
              View Details <i class="ri-arrow-right-line"></i>
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function attachCardEvents() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  $$('.vehicle-card.reveal-item:not(.revealed)').forEach(el => observer.observe(el));
}

// ──────────────────────────────────────────────
// FAVOURITES
// ──────────────────────────────────────────────
function toggleFav(id, btn) {
  const idx = favourites.indexOf(id);
  if (idx === -1) {
    favourites.push(id);
    if (btn) { btn.classList.add('active'); btn.querySelector('i').className = 'ri-heart-fill'; }
    showToast('Added to favourites!', 'success');
  } else {
    favourites.splice(idx, 1);
    if (btn) { btn.classList.remove('active'); btn.querySelector('i').className = 'ri-heart-line'; }
    showToast('Removed from favourites', 'info');
  }
  localStorage.setItem('pm_favourites', JSON.stringify(favourites));
  updateFavBadge();
}

function updateFavBadge() {
  const badge = $('favCount');
  if (!badge) return;
  badge.textContent = favourites.length;
  badge.classList.toggle('hidden', favourites.length === 0);
}

// ──────────────────────────────────────────────
// SEARCH & FILTER PANEL
// ──────────────────────────────────────────────
function applyFilters() {
  const search = ($('navSearchInput')?.value || '').toLowerCase().trim();
  const brand  = ($('filterBrand')?.value  || '').toLowerCase();
  const model  = ($('filterModel')?.value  || '').toLowerCase();
  const year   = $('filterYear')?.value  || '';
  const body   = ($('filterBody')?.value   || '').toLowerCase();
  const trans  = ($('filterTransmission')?.value || '').toLowerCase();
  const fuel   = ($('filterFuel')?.value   || '').toLowerCase();
  const price  = $('filterPrice')?.value  || '';
  const mil    = $('filterMileage')?.value || '';
  const colour = ($('filterColour')?.value  || '').toLowerCase();
  const loc    = ($('filterLocation')?.value || '').toLowerCase();

  filteredVehicles = allVehicles.filter(v => {
    if (search && !v.title.toLowerCase().includes(search) &&
                  !v.brand.toLowerCase().includes(search) &&
                  !v.model.toLowerCase().includes(search)) return false;
    if (brand  && v.brand.toLowerCase() !== brand) return false;
    if (model  && !v.model.toLowerCase().includes(model)) return false;
    if (year   && String(v.year) !== year) return false;
    if (body   && v.body?.toLowerCase() !== body) return false;
    if (trans  && !v.transmission?.toLowerCase().includes(trans)) return false;
    if (fuel   && v.fuel.toLowerCase() !== fuel) return false;
    if (colour && !v.colour?.toLowerCase().includes(colour)) return false;
    if (loc    && v.location?.toLowerCase() !== loc) return false;

    if (price) {
      const parts = price.split('-');
      const p = v.price;
      if (parts[1] && parts[1] !== '+') {
        if (p < parseInt(parts[0]) || p > parseInt(parts[1])) return false;
      } else {
        if (p < parseInt(parts[0])) return false;
      }
    }

    if (mil) {
      if (mil === '0' && v.mileage !== 0) return false;
      if (mil !== '0' && v.mileage > parseInt(mil)) return false;
    }

    return true;
  });

  displayedCount = 0;
  renderPage();
}

function resetAllFilters() {
  ['filterBrand','filterModel','filterYear','filterBody','filterTransmission',
   'filterFuel','filterPrice','filterMileage','filterColour','filterLocation','navSearchInput'].forEach(id => {
    const el = $(id);
    if (el) el.value = '';
  });
  $$('.filter-pill').forEach((p, i) => p.classList.toggle('active', i === 0));
  filteredVehicles = [...allVehicles];
  displayedCount = 0;
  renderPage();
}

function filterByBrand(brandName) {
  const select = $('filterBrand');
  if (select) select.value = brandName;
  applyFilters();
  document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth' });
}

function initFilterPills() {
  $$('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const f = pill.dataset.filter;
      if (f === 'all')      filteredVehicles = [...allVehicles];
      else if (f === 'new') filteredVehicles = allVehicles.filter(v => v.condition_type === 'new');
      else if (f === 'used') filteredVehicles = allVehicles.filter(v => v.condition_type === 'used');
      else if (f === 'electric') filteredVehicles = allVehicles.filter(v => v.fuel === 'Electric');
      displayedCount = 0;
      const grid = $('vehiclesGrid');
      if (grid) grid.innerHTML = '';
      renderPage();
    });
  });
}

// ──────────────────────────────────────────────
// QUICK VIEW MODAL
// ──────────────────────────────────────────────
async function openQuickView(id) {
  const modal = $('quickViewModal');
  const content = $('quickViewContent');
  if (!modal || !content) return;

  currentQuickId = id;
  modal.classList.add('active');
  document.body.classList.add('modal-open');
  content.innerHTML = `<div style="text-align:center;padding:60px;color:var(--gold)"><i class="ri-loader-4-line" style="font-size:40px;animation:spin 1s linear infinite"></i></div>`;

  const data = await apiFetch(`/vehicles/${id}`);
  if (!data.success) {
    content.innerHTML = `<div style="text-align:center;padding:60px;color:var(--text-muted)">Failed to load vehicle details.</div>`;
    return;
  }

  const v = data.vehicle;
  const img = (v.images && v.images[0]) ? v.images[0] : 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80';
  const isSold = v.status === 'sold';
  const isResv = v.status === 'reserved';
  const waLink = buildWALink(v);

  const thumbsHtml = v.images && v.images.length > 1
    ? `<div class="qv-thumbs">
        ${v.images.map((imgUrl, i) => `
          <img src="${imgUrl}" alt="View ${i+1}" class="qv-thumb ${i===0?'active':''}"
               onclick="qvChangeImg(this,'${imgUrl}')"
               onerror="this.src='https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80'">
        `).join('')}
       </div>`
    : '';

  let videoHtml = '';
  if (v.video_url) {
    if (v.video_url.startsWith('/uploads/') || /\.(mp4|webm|mov|ogg)$/i.test(v.video_url)) {
      videoHtml = `
        <div class="qv-video-wrap" style="margin-top:16px">
          <div style="font-size:12px;font-weight:700;color:var(--gold);margin-bottom:6px;display:flex;align-items:center;gap:6px">
            <i class="ri-video-line"></i> Vehicle Video Showcase
          </div>
          <video controls preload="metadata" style="width:100%;max-height:240px;border-radius:12px;background:#000;border:1px solid var(--border)" src="${v.video_url}"></video>
        </div>`;
    } else if (/youtube\.com|youtu\.be|vimeo\.com/i.test(v.video_url)) {
      const embedUrl = v.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/');
      videoHtml = `
        <div class="qv-video-wrap" style="margin-top:16px">
          <div style="font-size:12px;font-weight:700;color:var(--gold);margin-bottom:6px;display:flex;align-items:center;gap:6px">
            <i class="ri-video-line"></i> Vehicle Video Showcase
          </div>
          <iframe src="${embedUrl}" style="width:100%;height:220px;border-radius:12px;border:none" allowfullscreen></iframe>
        </div>`;
    }
  }

  content.innerHTML = `
    <div class="qv-layout">
      <div class="qv-media">
        <div class="qv-img-wrap">
          <img src="${img}" alt="${v.title}" class="qv-main-img" id="qvMainImg"
               onerror="this.src='https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80'">
          <div class="qv-img-badges">
            ${v.featured ? '<span class="car-badge featured-badge"><i class="ri-star-fill"></i> Featured</span>' : ''}
            <span class="car-badge ${v.condition_type === 'new' ? 'new-badge' : 'used-badge'}">${v.condition_type === 'new' ? 'New' : 'Pre-Owned'}</span>
            ${isSold ? '<span class="car-badge sold-badge">Sold</span>' : ''}
            ${isResv ? '<span class="car-badge reserved-badge">Reserved</span>' : ''}
          </div>
        </div>
        ${thumbsHtml}
        ${videoHtml}
      </div>

      <div class="qv-info">
        <div class="qv-brand-row">
          <span class="car-brand">${v.brand}</span>
          <span class="car-year">${v.year}</span>
        </div>
        <h2 class="qv-title">${v.title}</h2>
        <p class="qv-location"><i class="ri-map-pin-2-line"></i> ${v.location || 'Freetown'}, Sierra Leone</p>

        <div class="qv-specs-grid">
          ${specItem('ri-route-line', 'Mileage', fmtMileage(v.mileage))}
          ${specItem('ri-gas-station-line', 'Fuel', v.fuel)}
          ${specItem('ri-settings-3-line', 'Transmission', v.transmission || 'N/A')}
          ${specItem('ri-layout-3-line', 'Body', v.body || 'N/A')}
          ${v.hp     ? specItem('ri-flashlight-line',  'Power',  v.hp)     : ''}
          ${v.engine ? specItem('ri-settings-2-line',  'Engine', v.engine) : ''}
          ${v.colour ? specItem('ri-palette-line',     'Colour', v.colour) : ''}
        </div>

        ${v.description ? `<p class="qv-desc">${v.description}</p>` : ''}

        <div class="qv-price-block">
          <div>
            <div class="qv-price">${fmtFull(v.price)}</div>
          </div>
        </div>

        <div class="qv-actions">
          ${!isSold ? `
          <a href="${waLink}" target="_blank" class="btn-hero-primary" style="text-decoration:none">
            <i class="ri-whatsapp-line"></i> Contact Showroom
          </a>` : `
          <div class="sold-notice"><i class="ri-check-double-line"></i> This vehicle has been sold</div>`}
          <button class="btn-qv-icon fav-toggle ${favourites.includes(v.id)?'active':''}"
                  onclick="toggleFav(${v.id}, this)" title="Save to Favourites">
            <i class="ri-heart-${favourites.includes(v.id)?'fill':'line'}"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

function specItem(icon, label, value) {
  return `
    <div class="qv-spec">
      <i class="${icon}"></i>
      <div>
        <span class="qv-spec-label">${label}</span>
        <span class="qv-spec-value">${value}</span>
      </div>
    </div>`;
}

function qvChangeImg(el, url) {
  const main = $('qvMainImg');
  if (main) main.src = url;
  $$('.qv-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function closeQuickView() {
  const modal = $('quickViewModal');
  if (modal) modal.classList.remove('active');
  document.body.classList.remove('modal-open');
  currentQuickId = null;
}

// ──────────────────────────────────────────────
// INQUIRY MODAL


// ──────────────────────────────────────────────
// DYNAMIC REAL STATS (Fetches live SQLite counts)
// ──────────────────────────────────────────────
async function initLiveStats() {
  const data = await apiFetch('/stats/public');
  if (!data.success) return;

  const s = data;
  const numEls = $$('.stat-num[data-target]');
  if (numEls[0]) numEls[0].setAttribute('data-target', s.carsAvailable || allVehicles.length || 10);
  if (numEls[1]) numEls[1].setAttribute('data-target', s.satisfiedClients || 50);
  if (numEls[2]) numEls[2].setAttribute('data-target', s.satisfactionRate || 99);
  if (numEls[3]) numEls[3].setAttribute('data-target', s.brandsCount || 8);

  initStatsCounter();
}

// ──────────────────────────────────────────────
// DYNAMIC REVIEWS (Loads live reviews from SQLite)
// ──────────────────────────────────────────────
async function initLiveReviews() {
  const data = await apiFetch('/reviews');
  if (!data.success || !data.reviews?.length) return;

  const carousel = $('testimonialsCarousel');
  if (!carousel) return;

  carousel.innerHTML = data.reviews.map(r => `
    <div class="testimonial-card">
      <div class="quote-mark">"</div>
      <p class="testimonial-text">${r.comment}</p>
      <div class="testimonial-author">
        <img src="https://i.pravatar.cc/150?u=${r.id}" alt="${r.name}" class="testimonial-avatar">
        <div class="testimonial-meta">
          <div class="testimonial-name">${r.name}</div>
          <div class="testimonial-role">${r.role || 'Verified Client'}</div>
        </div>
        <div class="testimonial-stars">
          ${Array(r.rating || 5).fill('<i class="ri-star-fill"></i>').join('')}
        </div>
      </div>
    </div>
  `).join('');

  initTestimonialsCarousel();
}

function initTestimonialsCarousel() {
  const carousel = $('testimonialsCarousel');
  const prev     = $('carouselPrev');
  const next     = $('carouselNext');
  const dotsWrap = $('carouselDots');
  if (!carousel) return;

  const cards = carousel.querySelectorAll('.testimonial-card');
  if (!cards.length) return;
  let current = 0;
  let autoplay;

  function goTo(idx) {
    current = (idx + cards.length) % cards.length;
    carousel.style.transform = `translateX(-${current * 100}%)`;
    dotsWrap?.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  if (prev) prev.onclick = () => { clearInterval(autoplay); goTo(current - 1); startAuto(); };
  if (next) next.onclick = () => { clearInterval(autoplay); goTo(current + 1); startAuto(); };

  function startAuto() { autoplay = setInterval(() => goTo(current + 1), 5000); }
  startAuto();
}

// ──────────────────────────────────────────────
// DYNAMIC FEATURED SHOWCASE
// ──────────────────────────────────────────────
async function initShowcase() {
  const data = await apiFetch('/vehicles?featured=1&limit=1&status=available');
  if (!data.success || !data.vehicles?.length) return;

  const v = data.vehicles[0];
  const img = (v.images && v.images[0]) ? v.images[0] : null;

  const showcaseImg = $('showcaseImg');
  if (showcaseImg && img) { showcaseImg.src = img; showcaseImg.alt = v.title; }
  const showcaseTitle = document.querySelector('.showcase-title');
  if (showcaseTitle) showcaseTitle.textContent = v.title;

  const yearTagEl = document.querySelector('.showcase-year-tag');
  if (yearTagEl) {
    yearTagEl.textContent = `${v.year} · ${v.colour || ''} · ${fmtMileage(v.mileage)} · ${v.location || 'Freetown'}`;
  }

  const priceEl = document.querySelector('.showcase-price');
  if (priceEl) priceEl.textContent = fmtFull(v.price);

  const monthlyEl = document.querySelector('.showcase-monthly');
  if (monthlyEl) monthlyEl.textContent = `From ${fmtMonthly(v.price)} / month`;

  const specValues = document.querySelectorAll('.spec-value');
  const specs = [v.hp, '', '', v.transmission, v.fuel, v.engine];
  specValues.forEach((el, i) => { if (specs[i]) el.textContent = specs[i]; });

  const waBtn = document.querySelector('.btn-showcase-primary');
  if (waBtn) waBtn.href = buildWALink(v);

  if (v.images && v.images.length > 1) {
    const thumbsWrap = $('showcaseThumbs');
    if (thumbsWrap) {
      thumbsWrap.innerHTML = v.images.slice(0, 4).map((url, i) => `
        <img src="${url}" alt="View ${i+1}" class="showcase-thumb ${i===0?'active':''}"
             onclick="changeShowcaseImg(this,'${url}')">
      `).join('');
    }
  }
}

function changeShowcaseImg(el, url) {
  const main = $('showcaseImg');
  if (main) main.src = url;
  $$('.showcase-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

// ──────────────────────────────────────────────
// NAVBAR & LISTENERS
// ──────────────────────────────────────────────
function initNavbar() {
  const navbar = $('navbar');
  const hamburger = $('hamburger');
  const mobileMenu = $('mobileMenu');

  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu?.classList.toggle('open');
  });

  $$('[data-close]').forEach(el => {
    el.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      mobileMenu?.classList.remove('open');
    });
  });
}

function initSearchOverlay() {
  const toggle  = $('searchToggle');
  const overlay = $('navSearchOverlay');
  const input   = $('navSearchInput');
  const close   = $('navSearchClose');

  toggle?.addEventListener('click', () => {
    overlay?.classList.add('open');
    setTimeout(() => input?.focus(), 100);
  });

  close?.addEventListener('click', () => overlay?.classList.remove('open'));

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      overlay?.classList.remove('open');
      applyFilters();
      document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth' });
    }
    if (e.key === 'Escape') overlay?.classList.remove('open');
  });
}

function initModalListeners() {
  document.addEventListener('click', (e) => {
    if (e.target?.id === 'quickViewModal') closeQuickView();
    if (e.target?.id === 'inquiryModal')   closeInquiryModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeQuickView();
      closeInquiryModal();
    }
  });
}

function initLoadMore() {
  const btn = $('loadMoreBtn');
  btn?.addEventListener('click', () => {
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line" style="animation:spin 1s linear infinite"></i> Loading...';
    setTimeout(() => {
      renderPage();
      btn.disabled = false;
      btn.innerHTML = '<i class="ri-refresh-line"></i> Load More Vehicles';
    }, 400);
  });
}

function initSearchPanel() {
  $('searchBtn')?.addEventListener('click', () => {
    applyFilters();
    document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth' });
  });
  $('searchReset')?.addEventListener('click', resetAllFilters);
}

function initStatsCounter() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      let current = 0;
      const step = Math.max(1, Math.floor(target / 40));
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current.toLocaleString();
        if (current >= target) clearInterval(timer);
      }, 30);
      observer.unobserve(el);
    });
  }, { threshold: 0.3 });

  $$('.stat-num[data-target]').forEach(el => observer.observe(el));
}

function initBrandFilters() {
  $$('.brand-circle').forEach(btn => {
    btn.addEventListener('click', () => {
      const brand = btn.dataset.brand;
      if (brand) filterByBrand(brand);
    });
  });
}

function initFilterPills() {
  $$('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const f = pill.dataset.filter;
      if (f === 'all')      filteredVehicles = [...allVehicles];
      else if (f === 'new') filteredVehicles = allVehicles.filter(v => v.condition_type === 'new');
      else if (f === 'used') filteredVehicles = allVehicles.filter(v => v.condition_type === 'used');
      else if (f === 'electric') filteredVehicles = allVehicles.filter(v => v.fuel === 'Electric');
      displayedCount = 0;
      renderPage();
    });
  });
}

function initFavBtn() {
  const btn = $('favBtn');
  btn?.addEventListener('click', () => {
    if (favourites.length === 0) { showToast('No saved favourites yet.', 'info'); return; }
    const favVehicles = allVehicles.filter(v => favourites.includes(v.id));
    if (favVehicles.length === 0) { showToast('Saved vehicles not in current inventory.', 'warning'); return; }

    let modal = $('favModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'favModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="qv-modal" style="max-width:700px;max-height:90vh;overflow-y:auto">
        <button class="modal-close-btn" onclick="document.getElementById('favModal').classList.remove('active');document.body.classList.remove('modal-open')">
          <i class="ri-close-line"></i>
        </button>
        <div style="padding:32px">
          <h2 style="font-size:22px;color:var(--text-primary);margin-bottom:20px"><i class="ri-heart-fill" style="color:var(--gold)"></i> Saved Vehicles (${favVehicles.length})</h2>
          <div style="display:flex;flex-direction:column;gap:16px">
            ${favVehicles.map(v => {
              const img = (v.images && v.images[0]) ? v.images[0] : 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300&q=70';
              return `
                <div style="display:flex;gap:16px;align-items:center;background:var(--bg-card);padding:16px;border-radius:12px;border:1px solid var(--border)">
                  <img src="${img}" alt="${v.title}" style="width:100px;height:68px;object-fit:cover;border-radius:8px">
                  <div style="flex:1">
                    <div style="font-weight:600;color:var(--text)">${v.title}</div>
                    <div style="color:var(--gold);font-weight:700;margin-top:4px">${fmtPrice(v.price)}</div>
                  </div>
                  <button class="btn-car-view" onclick="document.getElementById('favModal').classList.remove('active');openQuickView(${v.id})">View</button>
                </div>`;
            }).join('')}
          </div>
        </div>
      </div>`;
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  });
}

// ──────────────────────────────────────────────
// MAIN INITIALIZATION
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initSearchOverlay();
  initSearchPanel();
  initFilterPills();
  initLoadMore();
  initModalListeners();
  initBrandFilters();
  initFavBtn();

  // Load inventory from live SQLite API
  await initInventory();

  // Load dynamic live statistics
  await initLiveStats();

  // Load dynamic reviews
  await initLiveReviews();

  // Load dynamic featured showcase
  await initShowcase();
});
