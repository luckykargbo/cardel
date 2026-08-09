'use strict';
/**
 * ============================================================
 * PRESTIGE MOTORS — ADMIN CONTROL SUITE
 * 100% Live API — SQLite Backend Powered
 * ============================================================
 */

// ──────────────────────────────────────────────
// CONFIG & STATE
// ──────────────────────────────────────────────
const API_BASE = window.location.origin + '/api';

let authToken        = localStorage.getItem('pm_token') || null;
let currentAdmin     = JSON.parse(localStorage.getItem('pm_admin') || 'null');
let currentTab       = 'dashboard';
let editingVehicleId = null;
let deleteTarget     = { type: null, id: null };
let uploadedFiles    = [];
let currentTheme     = localStorage.getItem('pm_admin_theme') || 'dark';

// ──────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

function fmtNLE(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return 'NLE ' + (n / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n >= 1000)    return 'NLE ' + (n / 1000).toFixed(0) + 'K';
  return 'NLE ' + n.toLocaleString();
}

function fmtMileage(km) {
  if (km === 0 || km === null) return 'Brand New';
  return Number(km).toLocaleString() + ' km';
}

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

function showToast(msg, type = 'info', duration = 3500) {
  const icons = { info: 'ri-star-fill', success: 'ri-checkbox-circle-fill', error: 'ri-error-warning-fill', warning: 'ri-alert-fill' };
  const container = $('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 400); }, duration);
}

// ──────────────────────────────────────────────
// API HELPER
// ──────────────────────────────────────────────
async function api(endpoint, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res  = await fetch(API_BASE + endpoint, { ...options, headers });
    const data = await res.json();
    // Auto-logout on 401
    if (res.status === 401 && currentPage === 'app') {
      showToast('Session expired. Please sign in again.', 'warning');
      setTimeout(doLogout, 1500);
    }
    return data;
  } catch (err) {
    console.error('API Error:', endpoint, err);
    return { success: false, message: 'Network error. Please check your connection.' };
  }
}

// ──────────────────────────────────────────────
// PAGE MANAGEMENT
// ──────────────────────────────────────────────
let currentPage = 'login';

function showPage(name) {
  $$('.page-view').forEach(p => p.classList.remove('active'));
  $(`page-${name}`)?.classList.add('active');
  currentPage = name;
}

function navigate(tab) {
  currentTab = tab;
  $$('.tab-view').forEach(t => t.classList.remove('active'));
  $(`tab-${tab}`)?.classList.add('active');
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  $(`nav-${tab}`)?.classList.add('active');

  // Load data for the tab
  if (tab === 'dashboard') loadDashboard();
  if (tab === 'inventory') loadInventoryTab();
  if (tab === 'inquiries') loadInquiriesTab();
  if (tab === 'financing') loadFinancingTab();
  if (tab === 'settings')  loadSettingsTab();
}

// ──────────────────────────────────────────────
// THEME
// ──────────────────────────────────────────────
function applyTheme(theme) {
  document.body.classList.toggle('theme-light', theme === 'light');
  const icon = $('themeIcon');
  if (icon) icon.className = theme === 'light' ? 'ri-sun-line' : 'ri-moon-line';
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('pm_admin_theme', currentTheme);
  applyTheme(currentTheme);
}

// ──────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email    = $('loginEmail')?.value.trim();
  const password = $('loginPassword')?.value;
  const btn      = $('loginBtn');
  const errEl    = $('loginError');

  if (!email || !password) {
    if (errEl) { errEl.textContent = 'Please enter your email and password.'; errEl.style.display = 'block'; }
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line" style="animation:spin 1s linear infinite"></i> Signing in...';
  if (errEl) errEl.style.display = 'none';

  const data = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  btn.disabled = false;
  btn.innerHTML = '<i class="ri-login-box-line"></i> Sign In to Dashboard';

  if (!data.success) {
    if (errEl) { errEl.textContent = data.message || 'Invalid credentials.'; errEl.style.display = 'block'; }
    return;
  }

  // Store auth
  authToken    = data.token;
  currentAdmin = data.user;
  localStorage.setItem('pm_token', authToken);
  localStorage.setItem('pm_admin', JSON.stringify(currentAdmin));

  // Update UI
  updateAdminUI();
  showPage('app');
  navigate('dashboard');
  showToast(`Welcome back, ${currentAdmin.name}! 🚘`, 'success');
}

function updateAdminUI() {
  if (!currentAdmin) return;
  const nameEl = $('headerAdminName');
  if (nameEl) nameEl.textContent = currentAdmin.name || 'Admin';
  const emailEl = document.querySelector('.dropdown-email');
  if (emailEl) emailEl.textContent = currentAdmin.email || '';
  const avatar = $('headerAvatar');
  if (avatar) avatar.src = currentAdmin.avatar || `https://i.pravatar.cc/150?img=12`;
}

function doLogout() {
  authToken    = null;
  currentAdmin = null;
  localStorage.removeItem('pm_token');
  localStorage.removeItem('pm_admin');
  showPage('login');
  hideLogoutModal();
}

function showLogoutModal() { $('logoutModal')?.classList.add('active'); }
function hideLogoutModal()  { $('logoutModal')?.classList.remove('active'); }

function toggleDropdown() {
  $('profileDropdown')?.classList.toggle('open');
}

function togglePwVisibility() {
  const input = $('loginPassword');
  const icon  = $('pwEyeIcon');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text'; icon?.classList.replace('ri-eye-line', 'ri-eye-off-line');
  } else {
    input.type = 'password'; icon?.classList.replace('ri-eye-off-line', 'ri-eye-line');
  }
}

// ──────────────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────────────
async function loadDashboard() {
  $('dashMetrics').innerHTML = '<div style="grid-column:1/-1;padding:20px;color:var(--text-muted);text-align:center"><i class="ri-loader-4-line" style="font-size:24px;animation:spin 1s linear infinite"></i></div>';

  const data = await api('/stats');
  if (!data.success) { showToast('Failed to load dashboard data.', 'error'); return; }

  const s = data.stats;

  // Metrics grid
  $('dashMetrics').innerHTML = `
    <div class="metric-card">
      <div class="metric-icon-wrap gold"><i class="ri-car-fill"></i></div>
      <div class="metric-info">
        <div class="metric-value">${s.inventory.total}</div>
        <div class="metric-label">Total Inventory</div>
      </div>
      <div class="metric-sub available-sub">${s.inventory.available} Available</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon-wrap green"><i class="ri-check-double-line"></i></div>
      <div class="metric-info">
        <div class="metric-value">${s.inventory.sold}</div>
        <div class="metric-label">Sold Units</div>
      </div>
      <div class="metric-sub">${s.inventory.reserved} Reserved</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon-wrap blue"><i class="ri-message-2-fill"></i></div>
      <div class="metric-info">
        <div class="metric-value">${s.inquiries.total}</div>
        <div class="metric-label">Enquiries</div>
      </div>
      ${s.inquiries.new > 0 ? `<div class="metric-sub new-sub"><span class="live-dot">●</span> ${s.inquiries.new} new</div>` : '<div class="metric-sub">All read</div>'}
    </div>
    <div class="metric-card">
      <div class="metric-icon-wrap purple"><i class="ri-bank-card-fill"></i></div>
      <div class="metric-info">
        <div class="metric-value">${s.financing.total}</div>
        <div class="metric-label">Finance Apps</div>
      </div>
      <div class="metric-sub">${s.financing.pending} Pending</div>
    </div>
  `;

  // Inventory count badge
  const invBadge = $('inventoryCount');
  if (invBadge) invBadge.textContent = s.inventory.available;

  // Notification badge
  if (s.inquiries.new > 0) {
    document.querySelectorAll('.badge-dot').forEach(b => b.style.display = 'block');
  }

  // Recent vehicles table
  const tbody = $('dashTableBody');
  const subtitle = $('recentInventorySubtitle');
  if (!tbody) return;

  if (subtitle) subtitle.textContent = `Showing ${data.recentVehicles.length} of ${s.inventory.total} Vehicles`;

  if (data.recentVehicles.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:40px">No vehicles in inventory yet. <button class="link-btn" onclick="openAddVehicleModal()">Add one now →</button></td></tr>`;
    return;
  }

  tbody.innerHTML = data.recentVehicles.map(v => buildVehicleRow(v, true)).join('');
}

// ──────────────────────────────────────────────
// INVENTORY TAB
// ──────────────────────────────────────────────
let inventoryData    = [];
let inventoryFilter  = 'all';

async function loadInventoryTab() {
  const tbody = $('inventoryTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gold)"><i class="ri-loader-4-line" style="font-size:24px;animation:spin 1s linear infinite"></i></td></tr>`;

  const data = await api('/vehicles?limit=500');
  if (!data.success) { showToast('Failed to load inventory.', 'error'); return; }

  inventoryData = data.vehicles || [];
  renderInventoryTable(inventoryData);

  // Update status filter tabs
  const invBadge = $('inventoryCount');
  if (invBadge) invBadge.textContent = inventoryData.filter(v => v.status === 'available').length;
}

function renderInventoryTable(vehicles) {
  const tbody = $('inventoryTableBody');
  if (!tbody) return;

  const search  = ($('inventorySearch')?.value || '').toLowerCase();
  const statusF = inventoryFilter;

  let filtered = vehicles.filter(v => {
    const matchSearch = !search ||
      v.title.toLowerCase().includes(search) ||
      v.brand.toLowerCase().includes(search) ||
      v.model.toLowerCase().includes(search);
    const matchStatus = statusF === 'all' || v.status === statusF;
    return matchSearch && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No vehicles match your filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(v => buildVehicleRow(v, false)).join('');
}

function buildVehicleRow(v, compact = false) {
  const img     = (v.images && v.images[0]) ? v.images[0] : 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=100&q=60';
  const statusMap = {
    'available': '<span class="status-pill available">Available</span>',
    'reserved':  '<span class="status-pill reserved">Reserved</span>',
    'sold':      '<span class="status-pill sold">Sold</span>',
    'draft':     '<span class="status-pill draft">Draft</span>'
  };
  const statusBadge = statusMap[v.status] || statusMap['draft'];

  if (compact) {
    return `
      <tr>
        <td><img src="${img}" alt="${v.title}" class="table-thumb"
                 onerror="this.src='https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=100&q=60'"></td>
        <td>
          <div class="table-vehicle-name">${v.title}</div>
          <div class="table-vehicle-sub">${v.year} · ${v.fuel}</div>
        </td>
        <td class="price-col">${fmtNLE(v.price)}</td>
        <td>${statusBadge}</td>
        <td class="actions-col text-right">
          <button class="icon-btn sm" onclick="openEditVehicleModal(${v.id})" title="Edit"><i class="ri-pencil-line"></i></button>
          <button class="icon-btn sm danger" onclick="confirmDelete('vehicle',${v.id},'${v.title.replace(/'/g,"\\'")}','')" title="Delete"><i class="ri-delete-bin-line"></i></button>
        </td>
      </tr>`;
  }

  return `
    <tr>
      <td><img src="${img}" alt="${v.title}" class="table-thumb"
               onerror="this.src='https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=100&q=60'"></td>
      <td>
        <div class="table-vehicle-name">${v.title}</div>
        <div class="table-vehicle-sub">${v.year} · ${v.brand} · ${v.fuel}</div>
      </td>
      <td>${fmtNLE(v.price)}</td>
      <td>${fmtMileage(v.mileage)}</td>
      <td>${v.location || 'Freetown'}</td>
      <td>${statusBadge}</td>
      <td class="actions-col text-right">
        <button class="icon-btn sm" onclick="openEditVehicleModal(${v.id})" title="Edit"><i class="ri-pencil-line"></i></button>
        <button class="icon-btn sm" onclick="quickStatusUpdate(${v.id})" title="Change Status"><i class="ri-toggle-line"></i></button>
        <button class="icon-btn sm danger" onclick="confirmDelete('vehicle',${v.id},'${v.title.replace(/'/g,"\\'")}','')" title="Delete"><i class="ri-delete-bin-line"></i></button>
      </td>
    </tr>`;
}

function filterInventory() {
  renderInventoryTable(inventoryData);
}

function setInventoryFilter(status) {
  inventoryFilter = status;
  $$('.inv-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.status === status));
  renderInventoryTable(inventoryData);
}

async function quickStatusUpdate(id) {
  const vehicle = inventoryData.find(v => v.id === id);
  if (!vehicle) return;

  const cycle  = ['available', 'reserved', 'sold', 'draft'];
  const idx    = cycle.indexOf(vehicle.status);
  const nextStatus = cycle[(idx + 1) % cycle.length];

  const data = await api(`/vehicles/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: nextStatus })
  });

  if (data.success) {
    showToast(`Status changed to ${nextStatus}`, 'success');
    await loadInventoryTab();
    await loadDashboard();
  } else {
    showToast(data.message || 'Failed to update status.', 'error');
  }
}

// ──────────────────────────────────────────────
// ADD / EDIT VEHICLE MODAL
// ──────────────────────────────────────────────
function openAddVehicleModal() {
  editingVehicleId = null;
  uploadedFiles    = [];
  clearVehicleForm();
  $('vehicleModalTitle')?.setAttribute('data-text', 'Add New Vehicle');
  const titleEl = $('vehicleModalTitle');
  if (titleEl) titleEl.textContent = 'Add New Vehicle';
  $('vehicleModal')?.classList.add('active');
  document.body.classList.add('modal-open');
}

async function openEditVehicleModal(id) {
  editingVehicleId = id;
  uploadedFiles    = [];

  const modal = $('vehicleModal');
  if (!modal) return;

  const titleEl = $('vehicleModalTitle');
  if (titleEl) titleEl.textContent = 'Edit Vehicle';
  modal.classList.add('active');
  document.body.classList.add('modal-open');

  // Load vehicle data
  const data = await api(`/vehicles/${id}`);
  if (!data.success) { showToast('Failed to load vehicle data.', 'error'); closeVehicleModal(); return; }

  const v = data.vehicle;
  fillVehicleForm(v);
}

function fillVehicleForm(v) {
  const fields = {
    'vf-title':        v.title,
    'vf-brand':        v.brand,
    'vf-model':        v.model,
    'vf-year':         v.year,
    'vf-price':        v.price,
    'vf-mileage':      v.mileage,
    'vf-fuel':         v.fuel,
    'vf-hp':           v.hp,
    'vf-engine':       v.engine,
    'vf-transmission': v.transmission,
    'vf-body':         v.body,
    'vf-colour':       v.colour,
    'vf-location':     v.location,
    'vf-condition':    v.condition_type,
    'vf-status':       v.status,
    'vf-description':  v.description
  };

  Object.entries(fields).forEach(([id, val]) => {
    const el = $(id);
    if (el && val !== null && val !== undefined) el.value = val;
  });

  const featuredCb = $('vf-featured');
  if (featuredCb) featuredCb.checked = v.featured;

  // Show existing images
  const preview = $('imagePreviewGrid');
  if (preview && v.images && v.images.length) {
    preview.innerHTML = v.images.map((url, i) => `
      <div class="img-preview-item" id="imgPrev-${i}">
        <img src="${url}" alt="Image ${i+1}"
             onerror="this.src='https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200&q=60'">
        <button type="button" class="img-remove-btn" onclick="removeExistingImage('${url}', ${i})">
          <i class="ri-close-line"></i>
        </button>
      </div>
    `).join('');
    // Store existing images reference
    window._editingImages = [...v.images];
  } else {
    if (preview) preview.innerHTML = '';
    window._editingImages = [];
  }
}

function clearVehicleForm() {
  ['vf-title','vf-brand','vf-model','vf-year','vf-price','vf-mileage',
   'vf-fuel','vf-hp','vf-engine','vf-transmission','vf-body','vf-colour',
   'vf-location','vf-condition','vf-status','vf-description'].forEach(id => {
    const el = $(id);
    if (el) el.value = '';
  });
  const featuredCb = $('vf-featured');
  if (featuredCb) featuredCb.checked = false;
  const preview = $('imagePreviewGrid');
  if (preview) preview.innerHTML = '';
  const fileInput = $('vf-images');
  if (fileInput) fileInput.value = '';
  window._editingImages = [];
}

function removeExistingImage(url, idx) {
  if (window._editingImages) {
    window._editingImages = window._editingImages.filter(u => u !== url);
  }
  $(`imgPrev-${idx}`)?.remove();
}

function handleImagePreview(input) {
  const preview = $('imagePreviewGrid');
  if (!preview) return;

  const existingCount = preview.querySelectorAll('.img-preview-item').length;
  const files = Array.from(input.files).slice(0, 10 - existingCount);

  files.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = 'img-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="New image">
        <button type="button" class="img-remove-btn" onclick="this.closest('.img-preview-item').remove()">
          <i class="ri-close-line"></i>
        </button>
        <span class="new-badge-img">New</span>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

async function saveVehicle(e) {
  e.preventDefault();
  const btn = $('vf-saveBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line" style="animation:spin 1s linear infinite"></i> Saving...';

  const formData = new FormData();
  const fields = {
    title:          $('vf-title')?.value?.trim(),
    brand:          $('vf-brand')?.value?.trim(),
    model:          $('vf-model')?.value?.trim(),
    year:           $('vf-year')?.value,
    price:          $('vf-price')?.value,
    mileage:        $('vf-mileage')?.value || '0',
    fuel:           $('vf-fuel')?.value,
    hp:             $('vf-hp')?.value?.trim() || '',
    engine:         $('vf-engine')?.value?.trim() || '',
    transmission:   $('vf-transmission')?.value?.trim() || '',
    body:           $('vf-body')?.value?.trim() || '',
    colour:         $('vf-colour')?.value?.trim() || '',
    location:       $('vf-location')?.value || 'Freetown',
    condition_type: $('vf-condition')?.value || 'new',
    status:         $('vf-status')?.value || 'available',
    featured:       $('vf-featured')?.checked ? 'true' : 'false',
    description:    $('vf-description')?.value?.trim() || '',
    existingImages: JSON.stringify(window._editingImages || [])
  };

  // Validate required
  if (!fields.title || !fields.brand || !fields.model || !fields.year || !fields.price || !fields.fuel) {
    showToast('Please fill in all required fields.', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="ri-save-line"></i> Save Vehicle';
    return;
  }

  Object.entries(fields).forEach(([k, v]) => formData.append(k, v));

  // Append image files
  const fileInput = $('vf-images');
  if (fileInput?.files?.length) {
    Array.from(fileInput.files).forEach(file => formData.append('images', file));
  }

  const endpoint = editingVehicleId ? `/vehicles/${editingVehicleId}` : '/vehicles';
  const method   = editingVehicleId ? 'PUT' : 'POST';

  const data = await api(endpoint, { method, body: formData });

  btn.disabled = false;
  btn.innerHTML = '<i class="ri-save-line"></i> Save Vehicle';

  if (data.success) {
    showToast(editingVehicleId ? 'Vehicle updated successfully!' : 'Vehicle added to inventory!', 'success');
    closeVehicleModal();
    await loadInventoryTab();
    await loadDashboard();
  } else {
    showToast(data.message || 'Failed to save vehicle.', 'error');
  }
}

function closeVehicleModal() {
  $('vehicleModal')?.classList.remove('active');
  document.body.classList.remove('modal-open');
  editingVehicleId = null;
  window._editingImages = [];
}

// ──────────────────────────────────────────────
// DELETE CONFIRM
// ──────────────────────────────────────────────
function confirmDelete(type, id, name, subtitle) {
  deleteTarget = { type, id };
  const modal  = $('deleteModal');
  const nameEl = $('deleteTargetName');
  const subEl  = $('deleteTargetSub');
  if (nameEl) nameEl.textContent = name;
  if (subEl)  subEl.textContent  = subtitle || '';
  modal?.classList.add('active');
}

async function executeDelete() {
  const { type, id } = deleteTarget;
  const btn = $('confirmDeleteBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line" style="animation:spin 1s linear infinite"></i> Deleting...';

  let endpoint = '';
  if (type === 'vehicle')  endpoint = `/vehicles/${id}`;
  if (type === 'inquiry')  endpoint = `/inquiries/${id}`;
  if (type === 'financing') endpoint = `/financing/${id}`;

  const data = await api(endpoint, { method: 'DELETE' });

  btn.disabled = false;
  btn.innerHTML = '<i class="ri-delete-bin-line"></i> Yes, Delete';

  closeDeleteModal();

  if (data.success) {
    showToast('Deleted successfully.', 'success');
    if (type === 'vehicle')   { await loadInventoryTab(); await loadDashboard(); }
    if (type === 'inquiry')   await loadInquiriesTab();
    if (type === 'financing') await loadFinancingTab();
  } else {
    showToast(data.message || 'Deletion failed.', 'error');
  }
}

function closeDeleteModal() {
  $('deleteModal')?.classList.remove('active');
  deleteTarget = { type: null, id: null };
}

// ──────────────────────────────────────────────
// INQUIRIES TAB
// ──────────────────────────────────────────────
async function loadInquiriesTab() {
  const tbody  = $('inquiriesTableBody');
  const totalEl = $('inquiriesTotalCount');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gold)"><i class="ri-loader-4-line" style="font-size:24px;animation:spin 1s linear infinite"></i></td></tr>`;

  const data = await api('/inquiries');
  if (!data.success) { showToast('Failed to load inquiries.', 'error'); return; }

  const inquiries = data.inquiries || [];
  if (totalEl) totalEl.textContent = `${inquiries.length} Total`;

  if (inquiries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No enquiries yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = inquiries.map(inq => {
    const statusMap = {
      'new':       '<span class="status-pill available">New</span>',
      'read':      '<span class="status-pill draft">Read</span>',
      'responded': '<span class="status-pill sold">Responded</span>'
    };
    return `
      <tr>
        <td>
          <div class="table-vehicle-name">${inq.name}</div>
          <div class="table-vehicle-sub">${inq.email}</div>
          ${inq.phone ? `<div class="table-vehicle-sub">${inq.phone}</div>` : ''}
        </td>
        <td>${inq.vehicle || '—'}</td>
        <td style="max-width:220px;white-space:normal;font-size:12px;color:var(--text-muted)">${inq.message?.substring(0,100)}${inq.message?.length > 100 ? '...' : ''}</td>
        <td>${fmtDate(inq.created_at)}</td>
        <td>${statusMap[inq.status] || statusMap['new']}</td>
        <td class="actions-col text-right">
          <select class="status-select-mini" onchange="updateInquiryStatus(${inq.id}, this.value)">
            <option value="new"       ${inq.status==='new'       ?'selected':''}>New</option>
            <option value="read"      ${inq.status==='read'      ?'selected':''}>Read</option>
            <option value="responded" ${inq.status==='responded' ?'selected':''}>Responded</option>
          </select>
          <button class="icon-btn sm" onclick="openWAReply('${inq.phone || ''}','${inq.name}')" title="Reply on WhatsApp">
            <i class="ri-whatsapp-line" style="color:#25D366"></i>
          </button>
          <button class="icon-btn sm danger" onclick="confirmDelete('inquiry',${inq.id},'${inq.name.replace(/'/g,"\\'")}','Enquiry')" title="Delete">
            <i class="ri-delete-bin-line"></i>
          </button>
        </td>
      </tr>`;
  }).join('');
}

async function updateInquiryStatus(id, status) {
  const data = await api(`/inquiries/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  if (data.success) showToast(`Marked as ${status}`, 'success');
  else showToast(data.message || 'Failed to update.', 'error');
}

function openWAReply(phone, name) {
  if (!phone) { showToast('No phone number available.', 'warning'); return; }
  const cleaned = phone.replace(/\s+/g, '').replace(/^\+/, '');
  const msg = encodeURIComponent(`Hello ${name}, thank you for your enquiry with Prestige Motors! 🚘`);
  window.open(`https://wa.me/${cleaned}?text=${msg}`, '_blank');
}

// ──────────────────────────────────────────────
// FINANCING TAB
// ──────────────────────────────────────────────
async function loadFinancingTab() {
  const tbody  = $('financingTableBody');
  const totalEl = $('financingTotalCount');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gold)"><i class="ri-loader-4-line" style="font-size:24px;animation:spin 1s linear infinite"></i></td></tr>`;

  const data = await api('/financing');
  if (!data.success) { showToast('Failed to load financing applications.', 'error'); return; }

  const apps = data.applications || [];
  if (totalEl) totalEl.textContent = `${apps.length} Applications`;

  if (apps.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No financing applications yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = apps.map(app => {
    const statusMap = {
      'pending':   '<span class="status-pill reserved">Pending</span>',
      'reviewing': '<span class="status-pill draft">Reviewing</span>',
      'approved':  '<span class="status-pill available">Approved</span>',
      'rejected':  '<span class="status-pill sold">Rejected</span>'
    };
    return `
      <tr>
        <td>
          <div class="table-vehicle-name">${app.name}</div>
          <div class="table-vehicle-sub">${app.email}</div>
          ${app.phone ? `<div class="table-vehicle-sub">${app.phone}</div>` : ''}
        </td>
        <td>${app.vehicle || '—'}</td>
        <td>
          ${app.monthly_income ? `Income: ${fmtNLE(app.monthly_income)}<br>` : ''}
          ${app.down_payment ? `Down: ${fmtNLE(app.down_payment)}<br>` : ''}
          ${app.loan_term_months ? `${app.loan_term_months} months` : ''}
        </td>
        <td>${app.employment || '—'}</td>
        <td>${fmtDate(app.created_at)}</td>
        <td class="actions-col text-right">
          <select class="status-select-mini" onchange="updateFinancingStatus(${app.id}, this.value)">
            <option value="pending"   ${app.status==='pending'   ?'selected':''}>Pending</option>
            <option value="reviewing" ${app.status==='reviewing' ?'selected':''}>Reviewing</option>
            <option value="approved"  ${app.status==='approved'  ?'selected':''}>Approved</option>
            <option value="rejected"  ${app.status==='rejected'  ?'selected':''}>Rejected</option>
          </select>
          <button class="icon-btn sm danger" onclick="confirmDelete('financing',${app.id},'${app.name.replace(/'/g,"\\'")}','Finance Application')" title="Delete">
            <i class="ri-delete-bin-line"></i>
          </button>
        </td>
      </tr>`;
  }).join('');
}

async function updateFinancingStatus(id, status) {
  const data = await api(`/financing/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  if (data.success) showToast(`Application marked as ${status}`, 'success');
  else showToast(data.message || 'Failed to update.', 'error');
}

// ──────────────────────────────────────────────
// SETTINGS TAB
// ──────────────────────────────────────────────
function loadSettingsTab() {
  if (currentAdmin) {
    const nameEl = $('settings-name');
    const emailEl = $('settings-email');
    if (nameEl) nameEl.value = currentAdmin.name || '';
    if (emailEl) emailEl.value = currentAdmin.email || '';
  }
}

async function savePasswordSettings(e) {
  e.preventDefault();
  const current = $('settings-cur-pw')?.value;
  const newpw   = $('settings-new-pw')?.value;
  const confirm = $('settings-confirm-pw')?.value;
  const errEl   = $('pw-error');

  if (!current || !newpw || !confirm) { if (errEl) { errEl.textContent = 'All fields required.'; errEl.style.display = 'block'; } return; }
  if (newpw !== confirm)  { if (errEl) { errEl.textContent = 'New passwords do not match.'; errEl.style.display = 'block'; } return; }
  if (newpw.length < 8)   { if (errEl) { errEl.textContent = 'Password must be at least 8 characters.'; errEl.style.display = 'block'; } return; }
  if (errEl) errEl.style.display = 'none';

  const btn = $('pw-save-btn');
  btn.disabled = true;
  const data = await api('/auth/password', { method: 'PATCH', body: JSON.stringify({ currentPassword: current, newPassword: newpw }) });
  btn.disabled = false;

  if (data.success) {
    showToast('Password updated successfully!', 'success');
    e.target.reset();
  } else {
    if (errEl) { errEl.textContent = data.message || 'Update failed.'; errEl.style.display = 'block'; }
  }
}

// ──────────────────────────────────────────────
// EXPORT CSV
// ──────────────────────────────────────────────
function exportInventoryCSV() {
  if (!inventoryData.length) { showToast('No inventory to export.', 'warning'); return; }
  const headers = ['ID','Title','Brand','Model','Year','Price (NLE)','Mileage (km)','Fuel','HP','Engine','Transmission','Body','Colour','Location','Condition','Status','Featured','Created'];
  const rows = inventoryData.map(v => [
    v.id, v.title, v.brand, v.model, v.year, v.price, v.mileage,
    v.fuel, v.hp, v.engine, v.transmission, v.body, v.colour,
    v.location, v.condition_type, v.status, v.featured ? 'Yes' : 'No', v.created_at
  ].map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','));

  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `prestige-motors-inventory-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Inventory exported as CSV!', 'success');
}

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Apply theme
  applyTheme(currentTheme);

  // Auto-login if token exists
  if (authToken && currentAdmin) {
    updateAdminUI();
    showPage('app');
    navigate('dashboard');
  } else {
    showPage('login');
  }

  // Login form
  $('loginForm')?.addEventListener('submit', handleLogin);

  // Vehicle form
  $('vehicleForm')?.addEventListener('submit', saveVehicle);

  // Password settings form
  $('passwordForm')?.addEventListener('submit', savePasswordSettings);

  // Delete modal buttons
  $('confirmDeleteBtn')?.addEventListener('click', executeDelete);
  $('cancelDeleteBtn')?.addEventListener('click', closeDeleteModal);

  // Logout modal buttons
  $('confirmLogoutBtn')?.addEventListener('click', doLogout);
  $('cancelLogoutBtn')?.addEventListener('click', hideLogoutModal);

  // Vehicle modal close
  $('vehicleModalClose')?.addEventListener('click', closeVehicleModal);

  // Close modals on overlay click
  document.addEventListener('click', (e) => {
    if (e.target?.id === 'vehicleModal') closeVehicleModal();
    if (e.target?.id === 'deleteModal')  closeDeleteModal();
    if (e.target?.id === 'logoutModal')  hideLogoutModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeVehicleModal();
      closeDeleteModal();
      hideLogoutModal();
    }
  });

  // Close profile dropdown on outside click
  document.addEventListener('click', (e) => {
    const dd = $('profileDropdown');
    const pb = $('profileBtn');
    if (dd && pb && !pb.contains(e.target) && !dd.contains(e.target)) {
      dd.classList.remove('open');
    }
  });

  // Image upload preview
  $('vf-images')?.addEventListener('change', function() { handleImagePreview(this); });

  // Inventory search
  $('inventorySearch')?.addEventListener('keyup', filterInventory);

  // Inventory filter buttons
  $$('.inv-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setInventoryFilter(btn.dataset.status));
  });

  // Export CSV
  $('exportCsvBtn')?.addEventListener('click', exportInventoryCSV);
});
