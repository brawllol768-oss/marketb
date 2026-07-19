firebase.initializeApp(firebaseConfig);
db = firebase.database();
try { storage = firebase.storage(); console.log('✅ Firebase Storage инициализирован'); }
catch (e) { console.warn('⚠️ Firebase Storage недоступен:', e); storage = null; }
if (window.Telegram && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;
  try { tg.expand(); tg.ready(); tg.setHeaderColor('#0a1a0f'); tg.setBackgroundColor('#0a1a0f'); tg.disableVerticalSwipes(); } catch (e) {}
  window.addEventListener('load', () => { setTimeout(() => { try { tg.expand(); } catch (e) {} }, 100); });
}
let activeListeners = {};
function initFirebaseListeners() {
  initGeneralChat();
  if (!activeListeners.listings) {
    activeListeners.listings = db.ref('listings').on('value', (snap) => {
      const data = snap.val();
      state.listings = data ? Object.keys(data).map(k => ({ ...data[k], id: k })) : [];
      state.listingsLoaded = true;
      if (['market','my','favorites','listing','admin','support'].includes(state.currentView)) debouncedRender();
    });
    // === СТРАХОВКА ОТ «ВЕЧНОГО» ЛОАДЕРА: если за 1.5с база не ответила (пусто/медленно/права) — убираем спиннер ===
    setTimeout(() => { if (!state.listingsLoaded) { state.listingsLoaded = true; console.log('⏱️ таймаут лоадера рынка — показываем рынок/пусто'); debouncedRender(); } }, 1500);
  }
  if (!activeListeners.users) {
    activeListeners.users = db.ref('users').on('value', (snap) => {
      const data = snap.val();
      state.users = data ? Object.values(data) : [];
      const my = state.users.find(u => u.id === currentUser.id);
      state.user = my || null;
      updateMaintenanceOverlay();
      debouncedRender();
    });
  }
  if (!activeListeners.chats) {
    activeListeners.chats = db.ref('chats').on('value', (snap) => {
      const data = snap.val();
      state.chats = data ? Object.keys(data).map(k => ({ ...data[k], id: k })) : [];
      updateNotificationBadge();
      if (state.currentView === 'chats' && state.currentChat) { const m = document.getElementById('chatMessages'); if (m) m.scrollTop = m.scrollHeight; }
    });
  }
  if (currentUser && !activeListeners.notifications) {
    activeListeners.notifications = db.ref('notifications/' + currentUser.id).on('value', (snap) => {
      const data = snap.val();
      state.notifications = data ? Object.keys(data).map(k => ({ ...data[k], id: k })) : [];
      updateNotificationBadge();
    });
  }
  if (!activeListeners.complaints) {
    activeListeners.complaints = db.ref('complaints').on('value', (snap) => {
      const data = snap.val();
      state.complaints = data ? Object.keys(data).map(k => ({ ...data[k], id: k })) : [];
    });
  }
  if (!activeListeners.support) {
    activeListeners.support = db.ref('support').on('value', (snap) => {
      const data = snap.val();
      state.support = data ? Object.keys(data).map(k => ({ ...data[k], id: k })) : [];
      if (state.currentView === 'support' || state.currentView === 'admin') debouncedRender();
    });
  }
  if (!activeListeners.settings) {
    activeListeners.settings = db.ref('settings/maintenance').on('value', (snap) => {
      const v = snap.val();
      state.maintenance = !!(v && v.enabled);
      state.maintenanceMsg = (v && v.message) ? v.message : 'Ведутся технические работы. Скоро вернёмся!';
      updateMaintenanceOverlay();
    });
  }
}
function updateMaintenanceOverlay() {
  const ov = document.getElementById('maintenanceOverlay'); if (!ov) return;
  const isCreator = !!(state.user && state.user.creatorCodeUsed);
  ov.style.display = (state.maintenance && !isCreator) ? 'flex' : 'none';
  const msg = document.getElementById('maintenanceMsg');
  if (msg && state.maintenanceMsg) msg.textContent = state.maintenanceMsg;
}
function initGeneralChat() {
  db.ref('chats/general_chat').once('value', (snap) => {
    if (!snap.exists()) { db.ref('chats/general_chat').set({ id: 'general_chat', type: 'general', participants: ['all'], messages: [], createdAt: Date.now() }); }
  });
}