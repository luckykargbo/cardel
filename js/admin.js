'use strict';

// ============================================================
// ADMIN CREDENTIALS (DEMO)
// ============================================================
const ADMIN_CREDENTIALS = { email: 'admin@prestigemotors.com', password: 'Onyx2026!' };

// ============================================================
// VEHICLE DATA (PERSISTENT STORE)
// ============================================================
let ADMIN_VEHICLES = JSON.parse(localStorage.getItem('pm_vehicles') || 'null') || [
  { id: 1, title: 'BMW M8 Competition Coupé', brand: 'BMW', year: 2024, price: 2450000, mileage: 2100, fuel: 'Petrol', hp: '625 hp', engine: '4.4L V8', transmission: 'Automatic', body: 'Coupé', colour: 'Obsidian Black', location: 'Freetown', type: 'new', status: 'active', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80', desc: 'Twin-turbocharged V8 powerhouse. Certified factory Onyx Black with carbon trim package. Freetown registered.', featured: true },
  { id: 2, title: 'Mercedes-AMG GT 63 S', brand: 'Mercedes-Benz', year: 2024, price: 3200000, mileage: 480, fuel: 'Petrol', hp: '639 hp', engine: '4.0L V8', transmission: 'Automatic', body: 'Sedan', colour: 'Polar White', location: 'Freetown', type: 'new', status: 'active', image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80', desc: 'AMG\'s apex four-door. Performance package, night pkg, carbon ceramic brakes.', featured: true },
  { id: 3, title: 'Porsche 911 Turbo S', brand: 'Porsche', year: 2024, price: 4100000, mileage: 480, fuel: 'Petrol', hp: '650 hp', engine: '3.8L Flat-6', transmission: 'PDK', body: 'Coupé', colour: 'Midnight Blue', location: 'Freetown', type: 'new', status: 'active', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80', desc: 'The pinnacle of 911 engineering. Sport Chrono, Leather interior, carbon accents.', featured: true },
  { id: 4, title: 'Ferrari 296 GTB', brand: 'Ferrari', year: 2023, price: 6800000, mileage: 1200, fuel: 'Hybrid', hp: '830 hp', engine: '3.0L V6 + Electric', transmission: 'DCT', body: 'Coupé', colour: 'Rosso Corsa', location: 'Freetown', type: 'used', status: 'active', image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=600&q=80', desc: 'Ferrari\'s most advanced V6 hybrid. Assetto Fiorano package, Alcantara interior.', featured: false },
  { id: 5, title: 'Lamborghini Huracán Tecnica', brand: 'Lamborghini', year: 2024, price: 7900000, mileage: 0, fuel: 'Petrol', hp: '640 hp', engine: '5.2L V10', transmission: 'DCT', body: 'Coupé', colour: 'Racing Yellow', location: 'Freetown', type: 'new', status: 'active', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80', desc: 'Factory fresh, untouched with 0 km. Giallo Inti pearl yellow. Forged composite wheels.', featured: false },
  { id: 6, title: 'Audi R8 V10 Performance', brand: 'Audi', year: 2024, price: 3600000, mileage: 3800, fuel: 'Petrol', hp: '620 hp', engine: '5.2L V10', transmission: 'DCT', body: 'Coupé', colour: 'Nardo Grey', location: 'Bo', type: 'used', status: 'active', image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80', desc: 'One of the final naturally aspirated V10 supercars. Laser headlights, Bang & Olufsen audio.', featured: false },
  { id: 7, title: 'Tesla Model S Plaid', brand: 'Tesla', year: 2024, price: 1950000, mileage: 0, fuel: 'Electric', hp: '1,020 hp', engine: 'Tri-Motor Electric', transmission: 'Electric', body: 'Sedan', colour: 'Midnight Silver', location: 'Freetown', type: 'electric', status: 'active', image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&q=80', desc: 'World\'s fastest production electric sedan. 0-100 km/h in 2.1s. 17-inch cinematic display.', featured: false },
  { id: 8, title: 'Bentley Continental GT', brand: 'Bentley', year: 2023, price: 9200000, mileage: 5400, fuel: 'Petrol', hp: '542 hp', engine: '4.0L V8', transmission: 'Automatic', body: 'Coupé', colour: 'Tungsten', location: 'Freetown', type: 'used', status: 'draft', image: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=600&q=80', desc: 'Grand tourer supreme. Hand-stitched Mulliner interior, panoramic glass roof.', featured: false },
  { id: 9, title: 'Rolls-Royce Ghost II', brand: 'Rolls-Royce', year: 2024, price: 14500000, mileage: 1050, fuel: 'Petrol', hp: '563 hp', engine: '6.75L V12', transmission: 'Automatic', body: 'Sedan', colour: 'Arctic White', location: 'Freetown', type: 'new', status: 'active', image: 'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=600&q=80', desc: 'The Rolls-Royce for self-driving enthusiasts. Starlight headliner, lambswool floor mats.', featured: true }
];

const APPOINTMENTS = [
  { id: 1, client: 'Ibrahim Kamara', vehicle: 'BMW M8 Competition Coupé', date: '2026-08-05', month: 'AUG', day: '05', time: '10:00 AM', type: 'Test Drive', status: 'confirmed' },
  { id: 2, client: 'Fatima Conteh', vehicle: 'Porsche 911 Turbo S', date: '2026-08-07', month: 'AUG', day: '07', time: '2:30 PM', type: 'Test Drive', status: 'pending' },
  { id: 3, client: 'Mohamed Sesay', vehicle: 'Rolls-Royce Ghost II', date: '2026-08-10', month: 'AUG', day: '10', time: '11:00 AM', type: 'VIP Consultation', status: 'confirmed' },
  { id: 4, client: 'Aminata Cole', vehicle: 'Tesla Model S Plaid', date: '2026-08-12', month: 'AUG', day: '12', time: '3:00 PM', type: 'Test Drive', status: 'confirmed' },
  { id: 5, client: 'Samuel Koroma', vehicle: 'Ferrari 296 GTB', date: '2026-08-15', month: 'AUG', day: '15', time: '9:00 AM', type: 'Test Drive', status: 'pending' },
  { id: 6, client: 'Mariatu Bangura', vehicle: 'Lamborghini Huracán', date: '2026-08-18', month: 'AUG', day: '18', time: '1:00 PM', type: 'Finance Consult', status: 'confirmed' },
  { id: 7, client: 'John Turay', vehicle: 'Mercedes-AMG GT 63', date: '2026-08-20', month: 'AUG', day: '20', time: '10:30 AM', type: 'Test Drive', status: 'confirmed' },
  { id: 8, client: 'Alice Sankoh', vehicle: 'Bentley Continental GT', date: '2026-08-22', month: 'AUG', day: '22', time: '4:00 PM', type: 'Viewing', status: 'pending' }
];

const ENQUIRIES = [
  { id: 1, name: 'Ibrahim Kamara', email: 'ibrahim.k@gmail.com', phone: '+232 76 123 456', message: 'I am interested in the BMW M8. Can you arrange a test drive this weekend? I would also like a finance breakdown.', vehicle: 'BMW M8 Competition Coupé', date: '2026-07-28', status: 'new' },
  { id: 2, name: 'Fatima Conteh', email: 'fconteh@yahoo.com', phone: '+232 77 654 321', message: 'What is the best price you can offer for the Rolls-Royce Ghost? I am a cash buyer.', vehicle: 'Rolls-Royce Ghost II', date: '2026-07-27', status: 'replied' },
  { id: 3, name: 'Mohamed Sesay', email: 'm.sesay@outlook.com', phone: '+232 88 999 000', message: 'Are there any upcoming arrivals expected? Looking for a McLaren 720S or similar.', vehicle: 'General Enquiry', date: '2026-07-26', status: 'new' }
];

// ============================================================
// PROFILE AVATAR
// ============================================================
let adminAvatar = localStorage.getItem('pm_admin_avatar') || 'https://i.pravatar.cc/150?img=12';

function updateAvatarUI() {
  const headAvatar = $('headerAvatar');
  const settingsAvatar = $('settingsAvatarPreview');
  if (headAvatar) headAvatar.src = adminAvatar;
  if (settingsAvatar) settingsAvatar.src = adminAvatar;
}

function handleAvatarUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      adminAvatar = e.target.result;
      localStorage.setItem('pm_admin_avatar', adminAvatar);
      updateAvatarUI();
      showToast('Profile picture updated successfully!', 'success');
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// ============================================================
// STATE
// ============================================================
let currentPage  = 'login';
let currentTab   = 'dashboard';
let currentModalStep = 0;
let editingId    = null;
let deleteTargetId = null;
let statusFilter = 'all';
let uploadedPhotos = [];
let currentTheme = localStorage.getItem('pm_admin_theme') || 'dark';

// ============================================================
// UTILITY
// ============================================================
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

function fmtNLE(n) {
  if (!n && n !== 0) return 'N/A';
  if (n >= 1000000) return 'NLE ' + (n / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n >= 1000) return 'NLE ' + (n / 1000).toFixed(0) + 'K';
  return 'NLE ' + n.toLocaleString();
}

function saveVehicles() {
  localStorage.setItem('pm_vehicles', JSON.stringify(ADMIN_VEHICLES));
}

function showToast(msg, type = 'info', duration = 3500) {
  const icons = { info: 'ri-star-fill', success: 'ri-checkbox-circle-fill', error: 'ri-error-warning-fill' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${msg}</span>`;
  $('toastContainer').appendChild(toast);
  setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 400); }, duration);
}

// ============================================================
// SESSION COOKIES & ROUTE PROTECTION MIDDLEWARE
// ============================================================
const COOKIE_NAME = 'pm_session_token';
const AUTH_TOKEN_VAL = 'authenticated_onyx_admin_2026';

function setAuthCookie(days = 1) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${COOKIE_NAME}=${AUTH_TOKEN_VAL}; expires=${expires}; path=/; SameSite=Lax`;
  localStorage.setItem('pm_admin_auth', '1');
}

function hasAuthCookie() {
  const matches = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  const cookieVal = matches ? decodeURIComponent(matches[1]) : null;
  const localVal = localStorage.getItem('pm_admin_auth');
  return cookieVal === AUTH_TOKEN_VAL || localVal === '1';
}

function clearAuthCookie() {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  localStorage.removeItem('pm_admin_auth');
}

function getNormalizedHashRoute() {
  const hash = window.location.hash.replace('#', '').trim();
  const path = window.location.pathname.trim();
  if (hash) return hash;
  if (path.includes('app-admin-gate')) return '/app-admin-gate';
  if (path.includes('admin-dashboard')) return '/admin-dashboard';
  return '';
}

function checkAuthAndRoute() {
  const route = getNormalizedHashRoute();
  const isAuth = hasAuthCookie();

  if (route === '/app-admin-gate' || route === 'app-admin-gate') {
    // HIDDEN LOGIN GATE
    if (isAuth) {
      window.location.hash = '/admin-dashboard';
      showPage('app');
      initAppOnLogin();
    } else {
      showPage('login');
    }
  } else if (route === '/admin-dashboard' || route === 'admin-dashboard') {
    // PROTECTED DASHBOARD ROUTE
    if (!isAuth) {
      showToast('Access Blocked. Restricted Route.', 'error');
      showPage('404');
    } else {
      showPage('app');
      initAppOnLogin();
    }
  } else {
    // SECURITY BY OBSCURITY BLOCK (Direct access to bare admin.html or /admin or /login)
    if (isAuth) {
      window.location.hash = '/admin-dashboard';
      showPage('app');
      initAppOnLogin();
    } else {
      showPage('404');
    }
  }
}

// ============================================================
// AUTH HANDLERS
// ============================================================
function handleLogin(e) {
  e.preventDefault();
  const btn = $('loginBtn');
  const email = $('loginEmail').value.trim();
  const pass  = $('loginPassword').value;

  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line"></i> Authenticating...';

  setTimeout(() => {
    if (email === ADMIN_CREDENTIALS.email && pass === ADMIN_CREDENTIALS.password) {
      setAuthCookie(1);
      window.location.hash = '/admin-dashboard';
      checkAuthAndRoute();
      showToast('Welcome back, Super Admin! 🚘', 'success');
    } else {
      btn.disabled = false;
      btn.innerHTML = '<i class="ri-login-box-line"></i> Sign In to Dashboard';
      showToast('Invalid credentials. Use the demo credentials below.', 'error');
      $('loginPassword').value = '';
      $('loginPassword').focus();
    }
  }, 700);
}

function togglePwVisibility() {
  const inp = $('loginPassword');
  const icon = $('pwEyeIcon');
  if (inp.type === 'password') { inp.type = 'text'; icon.className = 'ri-eye-off-line'; }
  else { inp.type = 'password'; icon.className = 'ri-eye-line'; }
}

function showLogoutModal() {
  closeDropdown();
  $('logoutModal').classList.add('show');
}
function closeLogoutModal() { $('logoutModal').classList.remove('show'); }

function performLogout() {
  clearAuthCookie();
  closeLogoutModal();
  showToast('Signed out. Redirecting to showroom...', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}

// ============================================================
// PAGE / TAB ROUTER
// ============================================================
function showPage(name) {
  $$('.page-view').forEach(v => v.classList.remove('active'));
  document.getElementById(`page-${name}`)?.classList.add('active');
  currentPage = name;
}

function navigate(tab) {
  // Update sidebar active
  $$('.nav-item[id^="nav-"]').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById(`nav-${tab}`);
  if (navEl) navEl.classList.add('active');

  // Update tab views
  $$('.tab-view').forEach(v => v.classList.remove('active'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  currentTab = tab;

  closeDropdown();

  // Tab-specific init
  if (tab === 'dashboard') renderDashboardTable();
  if (tab === 'inventory') renderInventoryGrid();
}

// ============================================================
// INIT
// ============================================================
function initAppOnLogin() {
  applyTheme(currentTheme);
  updateAvatarUI();
  renderMetrics();
  renderDashboardTable();
  renderInventoryGrid();
  updateNavBadges();
}

// ============================================================
// THEME
// ============================================================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
  localStorage.setItem('pm_admin_theme', theme);

  const icon = $('themeIcon');
  if (icon) icon.className = theme === 'dark' ? 'ri-moon-line' : 'ri-sun-line';

  $$('[id^="theme-"]').forEach(el => el.classList.remove('active'));
  const opt = document.getElementById(`theme-${theme}-opt`);
  if (opt) opt.classList.add('active');
}

function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function setTheme(t) { applyTheme(t); }

// ============================================================
// NAV BADGES
// ============================================================
function updateNavBadges() {
  const count = $('inventoryCount');
  if (count) count.textContent = ADMIN_VEHICLES.length;
}

// ============================================================
// METRICS (Inventory Control overview matching user dashboard design)
// ============================================================
function renderMetrics() {
  const totalCars  = ADMIN_VEHICLES.length;
  const activeCount = ADMIN_VEHICLES.filter(v => v.status === 'active').length;
  const draftCount  = ADMIN_VEHICLES.filter(v => v.status === 'draft').length;
  const activePct   = totalCars > 0 ? ((activeCount / totalCars) * 100).toFixed(1) : '0.0';

  const grid = $('dashMetrics');
  if (!grid) return;
  grid.innerHTML = `
    <div class="metric-card card">
      <div class="metric-header">
        <span class="metric-title" style="text-transform:uppercase;font-size:11px;letter-spacing:1px;font-weight:700;color:var(--text-muted)">TOTAL CARS</span>
        <div class="metric-icon gold"><i class="ri-car-fill"></i></div>
      </div>
      <div class="metric-body">
        <div class="metric-value" style="font-size:32px;font-weight:800">${totalCars}</div>
        <span class="metric-sub positive" style="font-size:13px"><i class="ri-arrow-up-line"></i> +2 this month</span>
      </div>
      <div class="metric-footer"><p class="footer-note" style="font-size:12px;color:var(--text-muted)"><i class="ri-pulse-line"></i> Inventory Volume high</p></div>
    </div>
    <div class="metric-card card">
      <div class="metric-header">
        <span class="metric-title" style="text-transform:uppercase;font-size:11px;letter-spacing:1px;font-weight:700;color:var(--text-muted)">ACTIVE INVENTORY</span>
        <div class="metric-icon green"><i class="ri-checkbox-circle-fill"></i></div>
      </div>
      <div class="metric-body">
        <div class="metric-value" style="font-size:32px;font-weight:800">${activeCount}</div>
        <span class="metric-sub neutral" style="font-size:13px">${activePct}% Live</span>
      </div>
      <div class="metric-footer"><p class="footer-note" style="font-size:12px;color:var(--text-muted)"><i class="ri-eye-line"></i> Currently visible in showroom</p></div>
    </div>
    <div class="metric-card card">
      <div class="metric-header">
        <span class="metric-title" style="text-transform:uppercase;font-size:11px;letter-spacing:1px;font-weight:700;color:var(--text-muted)">DRAFTS / PENDING</span>
        <div class="metric-icon warning"><i class="ri-edit-box-fill"></i></div>
      </div>
      <div class="metric-body">
        <div class="metric-value" style="font-size:32px;font-weight:800">${draftCount}</div>
        <span class="metric-sub warning" style="color:var(--gold);font-weight:600;font-size:13px">Requires Action</span>
      </div>
      <div class="metric-footer"><p class="footer-note" style="font-size:12px;color:var(--text-muted)"><i class="ri-alert-line"></i> Awaiting quality inspection</p></div>
    </div>
  `;
}

// ============================================================
// DASHBOARD TABLE (Recent Inventory matching uploaded screenshot)
// ============================================================
function renderDashboardTable() {
  const tbody = $('dashTableBody');
  if (!tbody) return;
  const subtitle = $('recentInventorySubtitle');

  const vehicles = [...ADMIN_VEHICLES].slice(0, 5);
  tbody.innerHTML = vehicles.map(v => `
    <tr>
      <td>
        <img src="${v.image}" class="table-thumb" alt="${v.title}" style="width:64px;height:42px;object-fit:cover;border-radius:6px" onerror="this.src='https://via.placeholder.com/72x48/141418/e5a95c?text=PM'">
      </td>
      <td>
        <div class="vehicle-cell">
          <span class="vehicle-name" style="font-weight:700;font-size:14px;color:var(--text);display:block">${v.title}</span>
          <span class="vehicle-sub" style="font-size:12px;color:var(--text-muted)">${v.year} · ${v.transmission} · ${v.engine || 'N/A'}</span>
        </div>
      </td>
      <td><span class="price-text" style="font-weight:700;color:var(--text)">$${v.price ? v.price.toLocaleString() : '0'}</span></td>
      <td><span class="status-pill ${v.status}" style="font-size:11px;font-weight:700;letter-spacing:0.5px">• ${v.status.toUpperCase()}</span></td>
      <td class="text-right">
        <div class="action-btn-group" style="display:flex;gap:6px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" onclick="openDetailModal(${v.id})" title="View" style="padding:6px 8px"><i class="ri-eye-line"></i></button>
          <button class="btn btn-ghost btn-sm" onclick="openEditModal(${v.id})" title="Edit" style="padding:6px 8px"><i class="ri-edit-line"></i></button>
          <button class="btn btn-ghost btn-sm" style="color:var(--red);padding:6px 8px" onclick="openDeleteModal(${v.id})" title="Delete"><i class="ri-delete-bin-line"></i></button>
        </div>
      </td>
    </tr>
  `).join('');

  if (subtitle) subtitle.textContent = `Showing ${vehicles.length} of ${ADMIN_VEHICLES.length} Vehicles`;
}

// ============================================================
// INVENTORY GRID
// ============================================================
let inventoryStatusFilter = 'all';
let inventorySortMode = 'newest';
let inventoryView = 'grid';

function renderInventoryGrid() {
  const grid = $('inventoryGrid');
  if (!grid) return;

  let vehicles = [...ADMIN_VEHICLES];

  // Search
  const searchTerm = ($('inventorySearch')?.value || '').toLowerCase();
  if (searchTerm) {
    vehicles = vehicles.filter(v => v.title.toLowerCase().includes(searchTerm) || v.brand.toLowerCase().includes(searchTerm));
  }

  // Status filter
  if (inventoryStatusFilter !== 'all') {
    vehicles = vehicles.filter(v => v.status === inventoryStatusFilter);
  }

  // Sort
  if (inventorySortMode === 'price-asc')  vehicles.sort((a, b) => a.price - b.price);
  if (inventorySortMode === 'price-desc') vehicles.sort((a, b) => b.price - a.price);
  if (inventorySortMode === 'name')       vehicles.sort((a, b) => a.title.localeCompare(b.title));
  if (inventorySortMode === 'newest')     vehicles.sort((a, b) => b.id - a.id);

  if (vehicles.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px;color:var(--text-muted)">
      <i class="ri-car-line" style="font-size:48px;margin-bottom:16px;color:var(--gold);display:block"></i>
      <p>No vehicles match your current filters.</p>
      <button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="clearInventoryFilters()">Clear Filters</button>
    </div>`;
    return;
  }

  grid.innerHTML = vehicles.map(v => `
    <div class="car-card" data-id="${v.id}">
      <div class="car-card-media">
        <img src="${v.image}" alt="${v.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200/141418/e5a95c?text=PM'">
        <div class="car-card-badge">
          <span class="status-pill ${v.status}">${v.status}</span>
        </div>
        <div class="car-card-quick-actions">
          <button class="btn btn-secondary btn-sm" onclick="openDetailModal(${v.id})" title="View">
            <i class="ri-eye-line"></i>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="openEditModal(${v.id})" title="Edit">
            <i class="ri-edit-line"></i>
          </button>
          <button class="btn btn-secondary btn-sm" style="color:var(--red);border-color:var(--red)" onclick="openDeleteModal(${v.id})" title="Delete">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>
      <div class="car-card-body">
        <div>
          <span style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--gold)">${v.brand} · ${v.year}</span>
          <h3 class="car-card-title">${v.title}</h3>
        </div>
        <div class="car-card-specs">
          <span><i class="ri-settings-3-line"></i> ${v.engine || 'N/A'}</span>
          <span><i class="ri-roadster-line"></i> ${v.transmission}</span>
          <span><i class="ri-map-pin-line"></i> ${v.location}</span>
        </div>
        <div class="car-card-footer">
          <div class="car-card-price">${fmtNLE(v.price)}</div>
          <div class="car-card-actions">
            <button class="btn btn-sm ${v.status === 'active' ? 'btn-success' : 'btn-secondary'}" onclick="toggleListingStatus(${v.id})" title="${v.status === 'active' ? 'Hide Listing' : 'Publish Listing'}">
              <i class="ri-${v.status === 'active' ? 'eye-off' : 'eye'}-line"></i>
            </button>
            <button class="btn btn-primary btn-sm" onclick="openEditModal(${v.id})">Edit</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function filterInventory() { renderInventoryGrid(); }

function filterByStatus(btn, status) {
  $$('.filter-tabs .tab-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  inventoryStatusFilter = status;
  renderInventoryGrid();
}

function sortInventory(val) {
  inventorySortMode = val;
  renderInventoryGrid();
}

function switchView(mode) {
  inventoryView = mode;
  const grid = $('inventoryGrid');
  if (!grid) return;
  if (mode === 'list') {
    grid.style.gridTemplateColumns = '1fr';
  } else {
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
  }
  $('gridViewBtn').classList.toggle('active', mode === 'grid');
  $('listViewBtn').classList.toggle('active', mode === 'list');
}

function toggleListingStatus(id) {
  const v = ADMIN_VEHICLES.find(v => v.id === id);
  if (!v) return;
  v.status = v.status === 'active' ? 'draft' : 'active';
  saveVehicles();
  renderInventoryGrid();
  renderMetrics();
  showToast(`Listing ${v.status === 'active' ? 'published' : 'set to draft'}`, v.status === 'active' ? 'success' : 'info');
}

function clearInventoryFilters() {
  $('inventorySearch').value = '';
  inventoryStatusFilter = 'all';
  inventorySortMode = 'newest';
  $$('.filter-tabs .tab-pill').forEach((p, i) => p.classList.toggle('active', i === 0));
  renderInventoryGrid();
}

// ============================================================
// APPOINTMENTS
// ============================================================
function renderAppointments() {
  const container = $('appointmentsList');
  if (!container) return;
  container.innerHTML = APPOINTMENTS.map(a => `
    <div class="appointment-card">
      <div class="appt-date-block">
        <div class="appt-day">${a.day}</div>
        <div class="appt-month">${a.month}</div>
      </div>
      <div class="appt-info">
        <div class="appt-client"><i class="ri-user-fill" style="color:var(--gold);margin-right:4px"></i>${a.client}</div>
        <div class="appt-vehicle" style="margin:2px 0">${a.vehicle}</div>
        <div class="appt-time"><i class="ri-time-line"></i>${a.time} · ${a.type}</div>
      </div>
      <span class="status-pill ${a.status === 'confirmed' ? 'active' : 'draft'}">${a.status}</span>
      <div style="display:flex;gap:6px;margin-left:auto">
        ${a.status === 'pending' ? `<button class="btn btn-success btn-sm" onclick="confirmAppt(${a.id})"><i class="ri-checkbox-circle-line"></i> Confirm</button>` : ''}
        <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="cancelAppt(${a.id})"><i class="ri-close-circle-line"></i></button>
      </div>
    </div>
  `).join('');
}

function confirmAppt(id) {
  const a = APPOINTMENTS.find(a => a.id === id);
  if (a) { a.status = 'confirmed'; renderAppointments(); showToast(`${a.client}'s appointment confirmed!`, 'success'); }
}

function cancelAppt(id) {
  const i = APPOINTMENTS.findIndex(a => a.id === id);
  if (i > -1) { APPOINTMENTS.splice(i, 1); renderAppointments(); showToast('Appointment removed', 'info'); }
}

// ============================================================
// ENQUIRIES
// ============================================================
function renderEnquiries() {
  const container = $('enquiriesList');
  if (!container) return;
  container.innerHTML = ENQUIRIES.map(e => `
    <div class="card" style="padding:24px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <div style="font-weight:700;font-size:16px">${e.name}
            <span class="status-pill ${e.status === 'new' ? 'draft' : 'active'}" style="margin-left:8px">${e.status}</span>
          </div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">
            <i class="ri-mail-line" style="color:var(--gold)"></i> ${e.email} &nbsp;
            <i class="ri-phone-line" style="color:var(--gold)"></i> ${e.phone}
          </div>
        </div>
        <div style="text-align:right;font-size:12px;color:var(--text-muted)">
          ${e.date} · Re: <strong>${e.vehicle}</strong>
        </div>
      </div>
      <div style="margin-top:14px;padding:14px;background:var(--bg-input);border-radius:var(--radius-md);font-size:14px;color:var(--text-muted);line-height:1.7;font-style:italic">
        "${e.message}"
      </div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn btn-primary btn-sm" onclick="replyToEnquiry(${e.id})"><i class="ri-reply-fill"></i> Reply</button>
        <button class="btn btn-secondary btn-sm" onclick="openDetailModal(1)"><i class="ri-eye-line"></i> View Vehicle</button>
      </div>
    </div>
  `).join('');
}

function replyToEnquiry(id) {
  const e = ENQUIRIES.find(e => e.id === id);
  if (e) { e.status = 'replied'; renderEnquiries(); showToast(`Reply logged for ${e.name}`, 'success'); }
}

// ============================================================
// VEHICLE DETAIL MODAL
// ============================================================
function openDetailModal(id) {
  const v = ADMIN_VEHICLES.find(v => v.id === id);
  if (!v) return;

  $('detailModalTitle').textContent = v.title;
  $('detailModalSub').textContent = `${v.brand} · ${v.year} · ${v.location}`;

  $('vehicleDetailContent').innerHTML = `
    <div class="vehicle-detail-header">
      <div class="vehicle-detail-img">
        <img src="${v.image}" alt="${v.title}" onerror="this.src='https://via.placeholder.com/380x240/141418/e5a95c?text=PM'">
      </div>
      <div class="vehicle-detail-meta">
        <div class="vehicle-detail-title">${v.title}</div>
        <div class="vehicle-detail-price">${fmtNLE(v.price)}</div>
        <span class="status-pill ${v.status}" style="margin-bottom:16px">${v.status}</span>
        <div class="vehicle-detail-specs">
          <div class="detail-spec"><div class="detail-spec-label">Year</div><div class="detail-spec-val">${v.year}</div></div>
          <div class="detail-spec"><div class="detail-spec-label">Mileage</div><div class="detail-spec-val">${v.mileage?.toLocaleString() || 0} km</div></div>
          <div class="detail-spec"><div class="detail-spec-label">Fuel</div><div class="detail-spec-val">${v.fuel}</div></div>
          <div class="detail-spec"><div class="detail-spec-label">Power</div><div class="detail-spec-val">${v.hp || 'N/A'}</div></div>
          <div class="detail-spec"><div class="detail-spec-label">Engine</div><div class="detail-spec-val">${v.engine || 'N/A'}</div></div>
          <div class="detail-spec"><div class="detail-spec-label">Transmission</div><div class="detail-spec-val">${v.transmission}</div></div>
          <div class="detail-spec"><div class="detail-spec-label">Body</div><div class="detail-spec-val">${v.body || 'N/A'}</div></div>
          <div class="detail-spec"><div class="detail-spec-label">Colour</div><div class="detail-spec-val">${v.colour || 'N/A'}</div></div>
          <div class="detail-spec"><div class="detail-spec-label">Location</div><div class="detail-spec-val">${v.location}</div></div>
        </div>
        ${v.desc ? `<div style="margin-top:16px;padding:14px;background:var(--bg-input);border-radius:var(--radius-md);font-size:14px;color:var(--text-muted);line-height:1.7">${v.desc}</div>` : ''}
      </div>
    </div>
  `;

  $('vehicleDetailModal').classList.add('show');
}

function closeDetailModal() { $('vehicleDetailModal').classList.remove('show'); }

// ============================================================
// ADD / EDIT VEHICLE MODAL
// ============================================================
function openAddVehicleModal() {
  editingId = null;
  currentModalStep = 0;
  $('vehicleModalTitle').textContent = 'Add New Vehicle';
  clearVehicleForm();
  switchModalTab(0);
  uploadedPhotos = [];
  $('photoPreviewGrid').innerHTML = '';
  $('vehicleModal').classList.add('show');
}

function openEditModal(id) {
  const v = ADMIN_VEHICLES.find(v => v.id === id);
  if (!v) return;
  editingId = id;
  $('vehicleModalTitle').textContent = `Edit — ${v.title}`;
  currentModalStep = 0;
  switchModalTab(0);
  populateForm(v);
  $('vehicleModal').classList.add('show');
}

function closeVehicleModal() { $('vehicleModal').classList.remove('show'); editingId = null; }

function clearVehicleForm() {
  ['vm-title','vm-brand','vm-model','vm-year','vm-price','vm-mileage','vm-hp','vm-engine','vm-colour','vm-desc','vm-videoUrl'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['vm-transmission','vm-fuel','vm-body','vm-location','vm-type'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.selectedIndex = 0;
  });
  const pub = $('vm-publish');
  if (pub) pub.checked = true;
  const feat = $('vm-featured');
  if (feat) feat.checked = false;
}

function populateForm(v) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('vm-title', v.title); set('vm-brand', v.brand); set('vm-model', v.model || '');
  set('vm-year', v.year); set('vm-price', v.price); set('vm-mileage', v.mileage);
  set('vm-hp', v.hp); set('vm-engine', v.engine); set('vm-transmission', v.transmission);
  set('vm-fuel', v.fuel); set('vm-body', v.body); set('vm-colour', v.colour);
  set('vm-location', v.location); set('vm-type', v.type); set('vm-desc', v.desc || '');
  const pub = $('vm-publish');
  if (pub) pub.checked = v.status === 'active';
  const feat = $('vm-featured');
  if (feat) feat.checked = v.featured || false;
}

function switchModalTab(idx) {
  currentModalStep = idx;
  $$('.modal-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
  $$('.form-step-panel').forEach((p, i) => p.classList.toggle('active', i === idx));

  if (idx === 2) updatePublishSummary();

  $('modalPrevBtn').style.visibility = idx === 0 ? 'hidden' : 'visible';
  $('modalNextBtn').innerHTML = idx === 2
    ? '<i class="ri-save-line"></i> Save Vehicle'
    : 'Next <i class="ri-arrow-right-line"></i>';
}

function modalNext() {
  if (currentModalStep < 2) {
    if (currentModalStep === 0 && !validateStep0()) return;
    switchModalTab(currentModalStep + 1);
  } else {
    saveVehicleFromForm();
  }
}

function modalPrev() {
  if (currentModalStep > 0) switchModalTab(currentModalStep - 1);
}

function validateStep0() {
  const title = document.getElementById('vm-title')?.value.trim();
  const price = document.getElementById('vm-price')?.value;
  if (!title) { showToast('Vehicle title is required', 'error'); return false; }
  if (!price || isNaN(price)) { showToast('Valid price is required', 'error'); return false; }
  return true;
}

function updatePublishSummary() {
  const title = document.getElementById('vm-title')?.value || 'Untitled';
  const price = document.getElementById('vm-price')?.value;
  const brand = document.getElementById('vm-brand')?.value;
  const year  = document.getElementById('vm-year')?.value;
  $('publishSummary').innerHTML = `
    <strong>Title:</strong> ${title}<br>
    <strong>Brand:</strong> ${brand || '—'} &nbsp; <strong>Year:</strong> ${year || '—'}<br>
    <strong>Price:</strong> ${price ? fmtNLE(parseFloat(price)) : '—'}<br>
    <strong>Status:</strong> ${document.getElementById('vm-publish')?.checked ? '✅ Will be published live' : '📝 Saved as draft'}<br>
    <strong>Featured:</strong> ${document.getElementById('vm-featured')?.checked ? '⭐ Yes' : 'No'}
  `;
}

function saveVehicleFromForm() {
  const get = id => document.getElementById(id)?.value;

  const vehicleData = {
    title: get('vm-title'),
    brand: get('vm-brand') || 'Unknown',
    model: get('vm-model'),
    year: parseInt(get('vm-year')) || new Date().getFullYear(),
    price: parseFloat(get('vm-price')) || 0,
    mileage: parseInt(get('vm-mileage')) || 0,
    hp: get('vm-hp'),
    engine: get('vm-engine'),
    transmission: get('vm-transmission') || 'Automatic',
    fuel: get('vm-fuel') || 'Petrol',
    body: get('vm-body') || 'Coupé',
    colour: get('vm-colour'),
    location: get('vm-location') || 'Freetown',
    type: get('vm-type') || 'new',
    desc: get('vm-desc'),
    status: document.getElementById('vm-publish')?.checked ? 'active' : 'draft',
    featured: document.getElementById('vm-featured')?.checked || false,
    image: uploadedPhotos[0] || (editingId ? ADMIN_VEHICLES.find(v => v.id === editingId)?.image : 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80')
  };

  if (editingId) {
    const idx = ADMIN_VEHICLES.findIndex(v => v.id === editingId);
    if (idx > -1) { ADMIN_VEHICLES[idx] = { ...ADMIN_VEHICLES[idx], ...vehicleData }; }
    showToast(`${vehicleData.title} updated successfully!`, 'success');
  } else {
    vehicleData.id = Date.now();
    ADMIN_VEHICLES.unshift(vehicleData);
    showToast(`${vehicleData.title} added to inventory!`, 'success');
  }

  saveVehicles();
  closeVehicleModal();
  renderInventoryGrid();
  renderDashboardTable();
  renderMetrics();
  updateNavBadges();
  if (typeChartInstance) initCharts();
}

// ============================================================
// DELETE MODAL
// ============================================================
function openDeleteModal(id) {
  deleteTargetId = id;
  const v = ADMIN_VEHICLES.find(v => v.id === id);
  if (v) $('deleteModalDesc').textContent = `Delete "${v.title}"? This action cannot be undone.`;
  $('confirmDeleteBtn').onclick = confirmDelete;
  $('deleteModal').classList.add('show');
}

function closeDeleteModal() { $('deleteModal').classList.remove('show'); deleteTargetId = null; }

function confirmDelete() {
  if (!deleteTargetId) return;
  const v = ADMIN_VEHICLES.find(v => v.id === deleteTargetId);
  ADMIN_VEHICLES = ADMIN_VEHICLES.filter(v => v.id !== deleteTargetId);
  saveVehicles();
  closeDeleteModal();
  renderInventoryGrid();
  renderDashboardTable();
  renderMetrics();
  updateNavBadges();
  if (v) showToast(`${v.title} deleted`, 'error');
}

// ============================================================
// MEDIA UPLOAD (Client-side preview)
// ============================================================
function handlePhotoUpload(input) {
  const files = Array.from(input.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      uploadedPhotos.push(e.target.result);
      const grid = $('photoPreviewGrid');
      const isPrimary = uploadedPhotos.length === 1;
      const div = document.createElement('div');
      div.className = `upload-preview-item ${isPrimary ? 'is-primary' : ''}`;
      div.innerHTML = `
        <img src="${e.target.result}" alt="">
        ${isPrimary ? '<span class="upload-preview-primary-btn">Primary</span>' : ''}
        <button class="upload-preview-remove" onclick="removePhoto(this, '${e.target.result}')">×</button>
      `;
      grid.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function removePhoto(btn, src) {
  uploadedPhotos = uploadedPhotos.filter(p => p !== src);
  btn.parentElement.remove();
}

let uploadedVideoData = '';

function handleVideoFileUpload(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = e => {
      uploadedVideoData = e.target.result;
      const area = $('videoPreviewArea');
      if (area) {
        area.innerHTML = `
          <div style="position:relative">
            <video controls autoplay muted playsinline style="width:100%;max-height:220px;border-radius:10px;background:#000">
              <source src="${uploadedVideoData}">
            </video>
            <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:12px;color:var(--green);font-weight:600"><i class="ri-checkbox-circle-fill"></i> Video File Attached (${(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
              <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="removeUploadedVideo()"><i class="ri-delete-bin-line"></i> Remove</button>
            </div>
          </div>
        `;
      }
      showToast('Video file attached successfully! 🎬', 'success');
    };
    reader.readAsDataURL(file);
  }
}

function handleVideoUrlChange(url) {
  if (url.trim()) {
    uploadedVideoData = url.trim();
    previewVideo();
  }
}

function removeUploadedVideo() {
  uploadedVideoData = '';
  const fileInp = $('vm-videoFile');
  if (fileInp) fileInp.value = '';
  const urlInp = $('vm-videoUrl');
  if (urlInp) urlInp.value = '';
  const area = $('videoPreviewArea');
  if (area) area.innerHTML = '<span>No video attached yet. Upload a video file or enter a URL above.</span>';
}

function previewVideo() {
  const url = uploadedVideoData || document.getElementById('vm-videoUrl')?.value.trim();
  const area = $('videoPreviewArea');
  if (!area) return;
  if (!url) { area.innerHTML = '<span>Enter a URL or upload a file to preview</span>'; return; }

  if (url.startsWith('data:video') || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov')) {
    area.innerHTML = `
      <div style="position:relative">
        <video controls autoplay muted playsinline style="width:100%;max-height:220px;border-radius:10px;background:#000">
          <source src="${url}">
        </video>
        <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;color:var(--green);font-weight:600"><i class="ri-checkbox-circle-fill"></i> Video Ready</span>
          <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="removeUploadedVideo()"><i class="ri-delete-bin-line"></i> Remove</button>
        </div>
      </div>
    `;
    return;
  }

  let embedUrl = url;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const id = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
    embedUrl = `https://www.youtube.com/embed/${id}`;
    area.innerHTML = `<iframe src="${embedUrl}" allowfullscreen style="width:100%;height:220px;border-radius:10px;border:none"></iframe>`;
  } else if (url.includes('vimeo.com')) {
    const id = url.split('/').pop();
    embedUrl = `https://player.vimeo.com/video/${id}`;
    area.innerHTML = `<iframe src="${embedUrl}" allowfullscreen style="width:100%;height:220px;border-radius:10px;border:none"></iframe>`;
  } else {
    area.innerHTML = `<video controls style="width:100%;border-radius:var(--radius-md);max-height:220px"><source src="${url}"></video>`;
  }
}

// ============================================================
// PROFILE DROPDOWN
// ============================================================
function toggleDropdown() {
  $('profileDropdown')?.classList.toggle('show');
}
function closeDropdown() { $('profileDropdown')?.classList.remove('show'); }

document.addEventListener('click', e => {
  if (!e.target.closest('#profileBtn') && !e.target.closest('#profileDropdown')) closeDropdown();
});

// ============================================================
// ADMIN SEARCH (Header)
// ============================================================
function handleAdminSearch(val) {
  if (!val.trim()) return;
  navigate('inventory');
  setTimeout(() => {
    const inp = $('inventorySearch');
    if (inp) { inp.value = val; filterInventory(); }
  }, 100);
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    $('adminSearch')?.focus();
  }
  if (e.key === 'Escape') {
    closeDropdown();
    $('vehicleModal')?.classList.remove('show');
    $('deleteModal')?.classList.remove('show');
    $('vehicleDetailModal')?.classList.remove('show');
    $('logoutModal')?.classList.remove('show');
  }
});

// ============================================================
// AUTO-LOGIN (if session active)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(currentTheme);
  checkAuthAndRoute();
});

window.addEventListener('hashchange', checkAuthAndRoute);

// Global window bindings for inline HTML handlers
window.handleLogin         = handleLogin;
window.togglePwVisibility  = togglePwVisibility;
window.navigate            = navigate;
window.toggleTheme         = toggleTheme;
window.setTheme            = setTheme;
window.toggleDropdown      = toggleDropdown;
window.showLogoutModal     = showLogoutModal;
window.closeLogoutModal    = closeLogoutModal;
window.performLogout       = performLogout;
window.openAddVehicleModal = openAddVehicleModal;
window.openEditModal       = openEditModal;
window.closeVehicleModal   = closeVehicleModal;
window.openDeleteModal     = openDeleteModal;
window.closeDeleteModal    = closeDeleteModal;
window.confirmDelete       = confirmDelete;
window.openDetailModal     = openDetailModal;
window.closeDetailModal    = closeDetailModal;
window.switchModalTab      = switchModalTab;
window.modalNext           = modalNext;
window.modalPrev           = modalPrev;
window.handlePhotoUpload   = handlePhotoUpload;
window.removePhoto         = removePhoto;
window.previewVideo        = previewVideo;
window.filterByStatus      = filterByStatus;
window.filterInventory     = filterInventory;
window.sortInventory       = sortInventory;
window.switchView          = switchView;
window.toggleListingStatus = toggleListingStatus;
window.clearInventoryFilters = clearInventoryFilters;
window.confirmAppt         = confirmAppt;
window.cancelAppt          = cancelAppt;
window.replyToEnquiry      = replyToEnquiry;
window.showToast           = showToast;
window.handleAdminSearch   = handleAdminSearch;
window.handleAvatarUpload  = handleAvatarUpload;
window.handleVideoFileUpload = handleVideoFileUpload;
window.handleVideoUrlChange  = handleVideoUrlChange;
window.removeUploadedVideo   = removeUploadedVideo;


