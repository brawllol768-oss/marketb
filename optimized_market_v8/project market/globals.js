const firebaseConfig = {
  apiKey: "AIzaSyCrJ3lpTsxZuBWOeNqEEUN0rN5ZwT1IKGY",
  authDomain: "blackberry-market.firebaseapp.com",
  databaseURL: "https://blackberry-market-default-rtdb.firebaseio.com",
  projectId: "blackberry-market",
  storageBucket: "blackberry-market.firebasestorage.app",
  messagingSenderId: "699242196256",
  appId: "1:699242196256:web:fe092f0f75d81d22cefb45",
  measurementId: "G-8T57V1B5RS"
};
const CONFIG = { CREATOR_CODE: 'Создатель-BB2026-ADMIN', DEFAULT_ADMINS: ['admin', 'moderator', 'creator'] };
const state = {
  listings: [], users: [], chats: [], complaints: [], notifications: [], adminCodes: [], support: [],
  currentView: 'market', currentListingId: null, currentChat: null, currentSupportTicket: null, editingListingId: null,
  filters: { category: 'all', server: 'all', sort: 'new', search: '' },
  searchTimeout: null, renderTimeout: null,
  listingsLoaded: false, _usersUpdated: 0, maintenance: false, maintenanceMsg: 'Ведутся технические работы. Скоро вернёмся!'
};
// Универсальный маппинг категорий (понимает оба набора: inventory/atm-банкомат И прочие)
const CAT_ICONS = { inventory: '🎒', atm: '🏧', realestate: '🏠', transport: '🚗', weapon: '🔫', skins: '🎨', free: '🎁' };
const CAT_NAMES = { inventory: 'Инвентарь', atm: 'Банкомат', realestate: 'Недвижимость', transport: 'Транспорт', weapon: 'Оружие', skins: 'Скины', free: 'Бесплатно' };
const STATUS_NAMES = { pending: '⏳ На модерации', approved: '✅ Одобрено', rejected: '❌ Отклонено' };
let db = null, storage = null, currentUser = null, uploadedFiles = [], supportAttachments = [];
let isSelectOpen = false, avatarTemp = null, selectedRating = 5, fileInput = null, filePreview = null;

function getStableId() {
  try { if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) return 'tg_' + window.Telegram.WebApp.initDataUnsafe.user.id; } catch (e) {}
  let id = null; try { id = localStorage.getItem('bb_local_id'); } catch (e) {}
  if (!id) { id = 'local_' + Date.now() + '_' + Math.floor(Math.random() * 1e6); try { localStorage.setItem('bb_local_id', id); } catch (e) {} }
  return id;
}
(function initCurrentUser() {
  const id = getStableId(); let tg = null;
  try { if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) tg = window.Telegram.WebApp.initDataUnsafe.user; } catch (e) {}
  if (tg) {
    const full = ((tg.first_name || '') + (tg.last_name ? ' ' + tg.last_name : '')).trim();
    currentUser = { id: id, username: tg.username || ('user' + tg.id), name: full || 'Пользователь', avatar: null, role: 'user', createdAt: Date.now(), favorites: [], subscriptions: [], completedDeals: 0 };
  } else {
    currentUser = { id: id, username: 'guest', name: 'Гость', avatar: null, role: 'user', createdAt: Date.now(), favorites: [], subscriptions: [], completedDeals: 0 };
  }
})();