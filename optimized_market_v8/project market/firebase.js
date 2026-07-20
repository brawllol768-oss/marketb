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
    activeListeners.listings = true;
    const ref = db.ref('listings');
    ref.on('child_added', (snap) => {
      const idx = state.listings.findIndex(l => l.id === snap.key);
      if (idx === -1) { state.listings.push({ ...snap.val(), id: snap.key }); state.listingsLoaded = true; debouncedRender(); }
    });
    ref.on('child_changed', (snap) => {
      const idx = state.listings.findIndex(l => l.id === snap.key);
      if (idx !== -1) { state.listings[idx] = { ...snap.val(), id: snap.key }; debouncedRender(); }
    });
    ref.on('child_removed', (snap) => {
      state.listings = state.listings.filter(l => l.id !== snap.key);
      debouncedRender();
    });
    ref.once('value', () => { state.listingsLoaded = true; debouncedRender(); });
    setTimeout(() => { if (!state.listingsLoaded) { state.listingsLoaded = true; console.log('⏱️ таймаут лоадера рынка'); debouncedRender(); } }, 1500);
  }
  if (!activeListeners.users) {
    activeListeners.users = true; state._usersUpdated = 0;
    const ref = db.ref('users');
    const updateMyUser = () => { const my = state.users.find(u => u.id === currentUser.id); state.user = my || null; updateMaintenanceOverlay(); debouncedRender(); };
    ref.on('child_added', (snap) => {
      const idx = state.users.findIndex(l => l.id === snap.key);
      if (idx === -1) { state.users.push({ ...snap.val(), id: snap.key }); updateMyUser(); state._usersUpdated++; }
    });
    ref.on('child_changed', (snap) => {
      const idx = state.users.findIndex(l => l.id === snap.key);
      if (idx !== -1) { state.users[idx] = { ...snap.val(), id: snap.key }; updateMyUser(); state._usersUpdated++; }
    });
    ref.on('child_removed', (snap) => {
      state.users = state.users.filter(l => l.id !== snap.key);
      updateMyUser(); state._usersUpdated++;
    });
    ref.once('value', updateMyUser);
  }
  if (!activeListeners.chats) {
    activeListeners.chats = true;
    const ref = db.ref('chats');
    const updateChatUI = () => {
      updateNotificationBadge();
      if (state.currentView === 'chats' && state.currentChat) { const m = document.getElementById('chatMessages'); if (m) m.scrollTop = m.scrollHeight; }
      debouncedRender();
    };
    ref.on('child_added', (snap) => {
      const idx = state.chats.findIndex(l => l.id === snap.key);
      if (idx === -1) { state.chats.push({ ...snap.val(), id: snap.key }); updateChatUI(); }
    });
    ref.on('child_changed', (snap) => {
      const idx = state.chats.findIndex(l => l.id === snap.key);
      if (idx !== -1) { state.chats[idx] = { ...snap.val(), id: snap.key }; updateChatUI(); }
    });
    ref.on('child_removed', (snap) => {
      state.chats = state.chats.filter(l => l.id !== snap.key);
      updateChatUI();
    });
    ref.once('value', updateChatUI);
  }
  if (currentUser && !activeListeners.notifications) {
    activeListeners.notifications = true;
    const ref = db.ref('notifications/' + currentUser.id);
    const updateNotifUI = () => { updateNotificationBadge(); };
    ref.on('child_added', (snap) => {
      const idx = state.notifications.findIndex(l => l.id === snap.key);
      if (idx === -1) { state.notifications.push({ ...snap.val(), id: snap.key }); updateNotifUI(); }
    });
    ref.on('child_changed', (snap) => {
      const idx = state.notifications.findIndex(l => l.id === snap.key);
      if (idx !== -1) { state.notifications[idx] = { ...snap.val(), id: snap.key }; updateNotifUI(); }
    });
    ref.on('child_removed', (snap) => {
      state.notifications = state.notifications.filter(l => l.id !== snap.key);
      updateNotifUI();
    });
    ref.once('value', updateNotifUI);
  }
  if (!activeListeners.complaints) {
    activeListeners.complaints = true;
    const ref = db.ref('complaints');
    ref.on('child_added', (snap) => {
      const idx = state.complaints.findIndex(l => l.id === snap.key);
      if (idx === -1) { state.complaints.push({ ...snap.val(), id: snap.key }); }
    });
    ref.on('child_changed', (snap) => {
      const idx = state.complaints.findIndex(l => l.id === snap.key);
      if (idx !== -1) { state.complaints[idx] = { ...snap.val(), id: snap.key }; }
    });
    ref.on('child_removed', (snap) => {
      state.complaints = state.complaints.filter(l => l.id !== snap.key);
    });
  }
  if (!activeListeners.support) {
    activeListeners.support = true;
    const ref = db.ref('support');
    const updateSupportUI = () => { if (state.currentView === 'support' || state.currentView === 'admin') debouncedRender(); };
    ref.on('child_added', (snap) => {
      const idx = state.support.findIndex(l => l.id === snap.key);
      if (idx === -1) { state.support.push({ ...snap.val(), id: snap.key }); updateSupportUI(); }
    });
    ref.on('child_changed', (snap) => {
      const idx = state.support.findIndex(l => l.id === snap.key);
      if (idx !== -1) { state.support[idx] = { ...snap.val(), id: snap.key }; updateSupportUI(); }
    });
    ref.on('child_removed', (snap) => {
      state.support = state.support.filter(l => l.id !== snap.key);
      updateSupportUI();
    });
    ref.once('value', updateSupportUI);
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