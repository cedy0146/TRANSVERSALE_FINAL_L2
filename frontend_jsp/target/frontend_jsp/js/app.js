/**
 * EclectriDB — Frontend JS
 * Gestion du thème, API, Toast, Animations
 */

const API_BASE = 'http://localhost:3000/api';

// ==========================================
// THEME MANAGER (Mode sombre / clair)
// ==========================================
const ThemeManager = {
  init() {
    const saved = localStorage.getItem('theme') || 'dark';
    this.apply(saved);
    document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggle());
  },
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    this.apply(current === 'dark' ? 'light' : 'dark');
  }
};

// ==========================================
// API CLIENT
// ==========================================
const API = {
  async request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    const resp = await fetch(API_BASE + path, opts);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.message || 'Erreur serveur');
    return data;
  },
  get:    (path)        => API.request('GET', path),
  post:   (path, body)  => API.request('POST', path, body),
  put:    (path, body)  => API.request('PUT', path, body),
  delete: (path)        => API.request('DELETE', path),

  // Endpoints
  foyers:    { getAll: ()    => API.get('/foyers'),           getById: id => API.get(`/foyers/${id}`),     create: d => API.post('/foyers', d),    update: (id,d) => API.put(`/foyers/${id}`, d),    remove: id => API.delete(`/foyers/${id}`)    },
  batteries: { getAll: ()    => API.get('/batteries'),        getById: id => API.get(`/batteries/${id}`),  create: d => API.post('/batteries', d), update: (id,d) => API.put(`/batteries/${id}`, d), remove: id => API.delete(`/batteries/${id}`) },
  demandes:  { getAll: ()    => API.get('/demandes'),         getById: id => API.get(`/demandes/${id}`),   create: d => API.post('/demandes', d),  update: (id,d) => API.put(`/demandes/${id}`, d),  remove: id => API.delete(`/demandes/${id}`)  },
  rapports:  { getAll: ()    => API.get('/rapports'),         getById: id => API.get(`/rapports/${id}`),   remove: id => API.delete(`/rapports/${id}`)                                                                                             },
  users:     { getAll: ()    => API.get('/utilisateurs'),     getById: id => API.get(`/utilisateurs/${id}`), remove: id => API.delete(`/utilisateurs/${id}`)                                                                                      },
  auth:      { login: d      => API.post('/auth/login', d),   register: d => API.post('/auth/register', d) },
  alloc:     { lancer: ()    => API.post('/allocation/lancer', {}), comparer: () => API.get('/allocation/comparer') },
  health:    { check: ()     => API.get('/health') },
};

// ==========================================
// TOAST (Rétroaction utilisateur — IHM)
// ==========================================
const Toast = {
  container: null,
  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', duration = 4000) {
    if (!this.container) this.init();
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error'),
  warning: (msg) => Toast.show(msg, 'warning'),
  info:    (msg) => Toast.show(msg, 'info'),
};

// ==========================================
// AUTH MANAGER
// ==========================================
const Auth = {
  getUser() {
    try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; }
  },
  setUser(user) {
    sessionStorage.setItem('user', JSON.stringify(user));
  },
  logout() {
    sessionStorage.removeItem('user');
    window.location.href = 'login.jsp';
  },
  guard() {
    if (!this.getUser()) window.location.href = 'login.jsp';
  },
  isAdmin() {
    const u = this.getUser();
    return u && u.role === 'RESPONSABLE';
  }
};

// ==========================================
// MODAL
// ==========================================
const Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('hidden'); el.style.display = 'flex'; }
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('hidden'); el.style.display = 'none'; }
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.classList.add('hidden'); m.style.display = 'none';
    });
  }
};

// ==========================================
// LOADING STATE
// ==========================================
function setLoading(id, loading) {
  const el = document.getElementById(id);
  if (!el) return;
  if (loading) {
    el.dataset.original = el.innerHTML;
    el.innerHTML = '<span class="spin" style="display:inline-block">⟳</span> Chargement...';
    el.disabled = true;
  } else {
    el.innerHTML = el.dataset.original || el.innerHTML;
    el.disabled = false;
  }
}

// ==========================================
// NUMBER FORMATTING
// ==========================================
const fmt = {
  num: (n, d = 0) => (typeof n === 'number' ? n.toFixed(d) : '—'),
  kWh: (n) => `${fmt.num(n, 1)} kWh`,
  wh:  (n) => n >= 1000 ? `${fmt.num(n/1000, 1)} kWh` : `${fmt.num(n, 0)} Wh`,
  date: (s) => s ? new Date(s).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—',
  datetime: (s) => s ? new Date(s).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—',
  pct: (n, t) => t > 0 ? Math.round((n / t) * 100) : 0,
};

// ==========================================
// BATTERY LEVEL HELPER
// ==========================================
function getBatteryClass(pct) {
  if (pct >= 50) return 'high';
  if (pct >= 20) return 'medium';
  return 'low';
}

// ==========================================
// CONFIRM DELETE
// ==========================================
function confirmDelete(message, onConfirm) {
  if (confirm(message || 'Confirmer la suppression ?')) onConfirm();
}

// ==========================================
// SIDEBAR NAVIGATION
// ==========================================
function initNavigation() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Mobile sidebar toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));
  }

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', () => Auth.logout());

  // User display
  const user = Auth.getUser();
  if (user) {
    const avatar = document.querySelector('.user-avatar');
    if (avatar) avatar.textContent = user.username?.[0]?.toUpperCase() || '?';
    const usernameEl = document.getElementById('current-username');
    if (usernameEl) usernameEl.textContent = user.username;
    const roleEl = document.getElementById('current-role');
    if (roleEl) {
      roleEl.textContent = user.role || 'VILLAGEOIS';
      roleEl.className = `badge ${user.role === 'RESPONSABLE' ? 'badge-blue' : 'badge-green'}`;
    }
  }
}

// ==========================================
// MINI BAR CHART (canvas-free SVG)
// ==========================================
function renderMiniChart(containerId, data, color = '#4a9eff') {
  const container = document.getElementById(containerId);
  if (!container || !data || data.length === 0) return;
  const max = Math.max(...data, 1);
  const w = container.clientWidth || 200;
  const h = 60;
  const barW = Math.max(4, (w / data.length) - 3);
  let svg = `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">`;
  data.forEach((v, i) => {
    const barH = Math.max(2, (v / max) * (h - 4));
    const x = i * (w / data.length);
    const y = h - barH;
    svg += `<rect x="${x + 1}" y="${y}" width="${barW}" height="${barH}" rx="2" fill="${color}" opacity="0.8"/>`;
  });
  svg += '</svg>';
  container.innerHTML = svg;
}

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Toast.init();
  initNavigation();

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) Modal.closeAll();
    });
  });

  // Close modals on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') Modal.closeAll();
  });
});
