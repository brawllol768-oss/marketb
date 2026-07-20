function debounce(fn, w) { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn(...a), w); }; }
function generateAdminCode() { const ch = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = 'BB-ADMIN-'; for (let i = 0; i < 8; i++) { if (i > 0 && i % 4 === 0) c += '-'; c += ch[Math.floor(Math.random() * ch.length)]; } return c; }
function formatPrice(n) { if (typeof n === 'string') n = parseInt(n.replace(/[^\d]/g, '')) || 0; if (isNaN(n) || n == null) n = 0; if (n === 0) return 'Бесплатно'; return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
function parsePrice(s) { if (typeof s === 'number') return s; if (!s) return 0; const n = parseInt(s.toString().replace(/[^\d]/g, '')); return isNaN(n) ? 0 : n; }
function formatPriceInput(v) { const n = v.replace(/[^\d]/g, ''); return n ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '0'; }
function timeAgo(ts) { const d = Date.now() - ts, m = Math.floor(d / 60000); if (m < 1) return 'только что'; if (m < 60) return m + ' мин. назад'; const h = Math.floor(m / 60); if (h < 24) return h + ' ч. назад'; const dd = Math.floor(h / 24); return dd < 7 ? dd + ' дн. назад' : new Date(ts).toLocaleDateString('ru-RU'); }
function toast(msg, type) { type = type || 'success'; const el = document.createElement('div'); el.className = 'toast ' + type; el.innerHTML = msg; document.getElementById('toastContainer').appendChild(el); setTimeout(() => { el.style.transition = 'opacity .4s, transform .4s'; el.style.opacity = '0'; el.style.transform = 'translateX(100%)'; setTimeout(() => el.remove(), 400); }, 3000); }
function escapeHtml(s) { if (s == null) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
function getInitials(n) { return (n || '?').trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'; }
function renderAvatarHTML(u) { return (u && u.avatar) ? ('<img src="' + u.avatar + '" alt="">') : escapeHtml(getInitials(u && (u.name || u.username))); }
function isAdmin(u) { return u && (u.role === 'admin' || CONFIG.DEFAULT_ADMINS.includes(u.username)); }
function isBanned(u) { return u && (u.banned === true || (u.banUntil && new Date(u.banUntil) > new Date())); }
function isMuted(u) { return u && (u.muted === true || (u.muteUntil && new Date(u.muteUntil) > new Date())); }

let _userCache = new Map();
let _lastUsersUpdate = 0;
function getUserRating(un) { 
  if (state._usersUpdated !== _lastUsersUpdate) {
    _userCache.clear();
    state.users.forEach(u => _userCache.set(u.username, u));
    _lastUsersUpdate = state._usersUpdated;
  }
  const u = _userCache.get(un);
  if (!u || !u.reviews || !u.reviews.length) return { avg: 0, count: 0 }; 
  const s = u.reviews.reduce((a, r) => a + r.rating, 0); 
  return { avg: s / u.reviews.length, count: u.reviews.length }; 
}
function renderStars(r) { const f = Math.floor(r), h = r % 1 >= 0.5 ? 1 : 0, e = 5 - f - h; return '⭐'.repeat(f) + (h ? '✨' : '') + '☆'.repeat(e); }
function addNotification(t, m, type) { if (db && currentUser) db.ref('notifications/' + currentUser.id).push({ title: t, message: m, type: type || 'info', time: Date.now(), read: false }); }
function updateNotificationBadge() {
  const u = state.notifications.filter(n => !n.read).length; const b = document.getElementById('bellBadge');
  if (b) { b.textContent = u; b.style.display = u > 0 ? 'block' : 'none'; }
  const cb = document.getElementById('chatBadge');
  if (cb && state.user) { const uc = state.chats.filter(c => c.participants && c.participants.includes(state.user.username) && (c.unreadCount || 0) > 0).length; cb.textContent = uc; cb.style.display = uc > 0 ? 'block' : 'none'; }
}
function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add('active'); }
function closeModal(el) { if (el && el.closest) el.closest('.modal-overlay').classList.remove('active'); }
function emptyHTML(i, t, p) { return '<div class="empty"><div class="empty-icon">' + i + '</div><h3>' + t + '</h3><p>' + p + '</p></div>'; }
function applyTheme(th) { if (th === 'default') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', th); try { localStorage.setItem('bb_theme', th); } catch(e) {} toast('🎨 Тема изменена', 'success'); }
function validateFile(f) { const mx = 10 * 1024 * 1024; if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) return { valid: false, error: 'Неподдерживаемый формат' }; if (f.size > mx) return { valid: false, error: 'Файл слишком большой (макс. 10MB)' }; return { valid: true }; }
function getUserByUsername(un) {
  if (state._usersUpdated !== _lastUsersUpdate) {
    _userCache.clear();
    state.users.forEach(u => _userCache.set(u.username, u));
    _lastUsersUpdate = state._usersUpdated;
  }
  return _userCache.get(un);
}
