let isSubmitting = false, isSavingProfile = false;
function on(id, ev, fn) { const el = (typeof id === 'string') ? document.getElementById(id) : id; if (el) el.addEventListener(ev, fn); return el; }
window.addEventListener('error', (e) => { console.error('⚠️ Ошибка на странице:', e.message, e.filename, e.lineno); });

window.addEventListener('load', () => {
  console.log('✅ app.js load, currentUser.id =', currentUser && currentUser.id);
  fileInput = document.getElementById('fileInput'); filePreview = document.getElementById('filePreview');
  const st = localStorage.getItem('bb_theme'); if (st) { applyTheme(st); document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === st)); }
  fillServers(); initFirebaseListeners(); setupFileUpload();
  const cf = document.getElementById('createForm');
  if (cf) { const pi = cf.querySelector('input[name="price"]'); if (pi) pi.addEventListener('input', function () { const cp = this.selectionStart, ol = this.value.length; this.value = formatPriceInput(this.value); const nl = this.value.length; this.setSelectionRange(cp + (nl - ol), cp + (nl - ol)); }); }
  document.querySelectorAll('#starRating span').forEach(s => s.addEventListener('click', () => { selectedRating = +s.dataset.star; const rv = document.getElementById('ratingValue'); if (rv) rv.value = selectedRating; document.querySelectorAll('#starRating span').forEach((x, i) => { x.style.opacity = i < selectedRating ? '1' : '0.3'; }); }));
  on('avatarInput', 'change', e => { const f = e.target.files[0]; if (!f) return; window._avatarFile = f; const r = new FileReader(); r.onload = ev => { avatarTemp = ev.target.result; const ap = document.getElementById('avatarPreview'); if (ap) ap.innerHTML = `<img src="${ev.target.result}" class="thumb">`; }; r.readAsDataURL(f); });
  on('supportAttachNewBtn', 'click', () => { const fi = document.getElementById('supportNewFileInput'); if (fi) fi.click(); });
  on('supportNewFileInput', 'change', async (e) => { for (const f of Array.from(e.target.files)) { if (!f.type.startsWith('image/')) { toast('⚠️ Только изображения', 'warning'); continue; } if (f.size > 5 * 1024 * 1024) { toast('⚠️ Файл слишком большой', 'warning'); continue; } try { const r = new FileReader(); r.onload = (ev) => { if (!window._sna) window._sna = []; window._sna.push({ url: ev.target.result, name: f.name }); renderNewAttachments(); }; r.readAsDataURL(f); } catch (er) { toast('❌ Ошибка', 'error'); } } e.target.value = ''; });
});

function renderNewAttachments() {
  const bx = document.getElementById('supportNewAttachments'); if (!bx) return; const sna = window._sna || [];
  bx.innerHTML = sna.map((a, i) => `<div style="position:relative;display:inline-block;"><img src="${a.url}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:2px solid var(--border);"><button type="button" data-rm-new="${i}" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--danger);color:white;border:none;font-size:12px;cursor:pointer;">✕</button></div>`).join('');
  bx.querySelectorAll('[data-rm-new]').forEach(b => b.addEventListener('click', () => { (window._sna || []).splice(parseInt(b.dataset.rmNew), 1); renderNewAttachments(); }));
}

function fillServers() {
  const fs = document.getElementById('serverFilter'), fm = document.querySelector('#createServerSelect'); if (!fs || !fm) return;
  fs.innerHTML = '<option value="all">Все сервера</option>'; fm.innerHTML = '<option value="">Выберите сервер</option>';
  for (let i = 1; i <= 33; i++) { const o = `<option value="${i}">Сервер ${i}</option>`; fs.innerHTML += o; fm.innerHTML += o; }
}

document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', () => { document.querySelectorAll('[data-view]').forEach(x => x.classList.remove('active')); el.classList.add('active'); state.currentView = el.dataset.view; if (el.dataset.view === 'support') state.currentSupportTicket = null; renderView(); }));
document.querySelectorAll('[data-cat]').forEach(el => el.addEventListener('click', () => { document.querySelectorAll('[data-cat]').forEach(x => x.classList.remove('active')); el.classList.add('active'); state.filters.category = el.dataset.cat; if (state.currentView !== 'market') { state.currentView = 'market'; document.querySelectorAll('[data-view]').forEach(x => x.classList.remove('active')); const m = document.querySelector('[data-view="market"]'); if (m) m.classList.add('active'); } renderView(); }));
const debouncedSearch = debounce((v) => { state.filters.search = v.trim(); if (state.currentView !== 'market') { state.currentView = 'market'; document.querySelectorAll('[data-view]').forEach(x => x.classList.remove('active')); const m = document.querySelector('[data-view="market"]'); if (m) m.classList.add('active'); } renderView(); }, 300);
on('searchInput', 'input', e => debouncedSearch(e.target.value));
on('serverFilter', 'change', e => { state.filters.server = e.target.value; if (state.currentView !== 'market') { state.currentView = 'market'; document.querySelectorAll('[data-view]').forEach(x => x.classList.remove('active')); const m = document.querySelector('[data-view="market"]'); if (m) m.classList.add('active'); } renderView(); });
on('bellBtn', 'click', () => {
  const l = document.getElementById('notificationsList'); if (!l) return;
  if (!state.notifications.length) l.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px;">🔕 Нет уведомлений</div>';
  else { l.innerHTML = state.notifications.map(n => `<div style="padding:12px;border-bottom:1px solid var(--border);${n.read ? 'opacity:0.6;' : ''}"><div style="font-weight:700;margin-bottom:4px;">${n.title}</div><div style="font-size:12px;color:var(--text-muted);">${n.message}</div><div style="font-size:10px;color:var(--text-muted);margin-top:4px;">${timeAgo(n.time)}</div></div>`).join(''); state.notifications.forEach(n => { if (!n.read) db.ref('notifications/' + currentUser.id + '/' + n.id).update({ read: true }); }); }
  openModal('notificationsModal');
});
on('logoClick', 'click', () => { state.currentView = 'market'; document.querySelectorAll('[data-view]').forEach(x => x.classList.remove('active')); const m = document.querySelector('[data-view="market"]'); if (m) m.classList.add('active'); renderView(); });
on('mobileMenuBtn', 'click', () => { const sb = document.getElementById('sidebar'), mo = document.getElementById('mobileOverlay'); if (sb) sb.classList.toggle('mobile-open'); if (mo) mo.classList.toggle('active'); });
on('mobileOverlay', 'click', () => { const sb = document.getElementById('sidebar'), mo = document.getElementById('mobileOverlay'); if (sb) sb.classList.remove('mobile-open'); if (mo) mo.classList.remove('active'); });
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', e => { closeModal(e.target); if (e.target.closest('#createModal')) { uploadedFiles = []; if (filePreview) filePreview.innerHTML = ''; if (fileInput) fileInput.value = ''; } }));
document.querySelectorAll('.modal-overlay').forEach(ov => ov.addEventListener('click', (e) => { if (isSelectOpen || e.target.closest('select')) return; if (e.target === ov && ov.id !== 'profileModal') ov.classList.remove('active'); }));
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(m => { if (m.id !== 'profileModal') m.classList.remove('active'); }); });

// === ДЕЛЕГИРОВАНИЕ ВСЕХ ФОРМ (capture → гарантированный preventDefault, форма НЕ перезагружает страницу) ===
document.addEventListener('submit', function (e) {
  const form = e.target; if (!form || !form.id) return;
  if (form.id === 'profileForm') { e.preventDefault(); handleProfileSubmit(form); }
  else if (form.id === 'createForm') { e.preventDefault(); handleCreateSubmit(form); }
  else if (form.id === 'reportForm') { e.preventDefault(); handleReportSubmit(form); }
  else if (form.id === 'reviewForm') { e.preventDefault(); handleReviewSubmit(form); }
  else if (form.id === 'deleteListingForm') { e.preventDefault(); handleDeleteSubmit(form); }
  else if (form.id === 'supportForm') { e.preventDefault(); handleSupportSubmit(form); }
  else if (form.id === 'actionForm') { e.preventDefault(); handleActionSubmit(form); }
}, true);
document.addEventListener('click', function (e) {
  const btn = e.target.closest('button'); if (!btn || btn.type !== 'button') return;
  const form = btn.closest('form'); if (!form || !form.id) return;
  if (form.id === 'profileForm') { e.preventDefault(); handleProfileSubmit(form); }
  else if (form.id === 'createForm') { e.preventDefault(); handleCreateSubmit(form); }
  else if (form.id === 'reportForm') { e.preventDefault(); handleReportSubmit(form); }
  else if (form.id === 'reviewForm') { e.preventDefault(); handleReviewSubmit(form); }
  else if (form.id === 'deleteListingForm') { e.preventDefault(); handleDeleteSubmit(form); }
  else if (form.id === 'supportForm') { e.preventDefault(); handleSupportSubmit(form); }
  else if (form.id === 'actionForm') { e.preventDefault(); handleActionSubmit(form); }
});

document.addEventListener('click', (e) => {
  if (e.target.closest('#editProfileBtn') && state.user) {
    const f = document.getElementById('profileForm'); if (!f) return;
    if (f.name) f.name.value = state.user.name || '';
    if (f.username) f.username.value = state.user.username || '';
    if (f.adminCode) f.adminCode.value = '';
    avatarTemp = null; window._avatarFile = null;
    const ap = document.getElementById('avatarPreview');
    if (ap) ap.innerHTML = state.user.avatar ? `<img src="${state.user.avatar}" class="thumb">` : '';
    openModal('profileModal');
  }
  if (e.target.closest('#logoutBtn')) {
    if (!confirm('🚪 Выйти и удалить аккаунт?\n\nВаш профиль и избранное будут удалены безвозвратно.\nОбъявления останутся на рынке.\n\nПри следующем входе нужно будет создать профиль заново.')) return;
    const uid = currentUser.id;
    const cleanup = () => { try { localStorage.removeItem('bb_local_id'); } catch (er) {} try { localStorage.removeItem('bb_theme'); } catch (er) {} state.user = null; toast('👋 Аккаунт удалён', 'warning'); setTimeout(() => location.reload(), 600); };
    db.ref('users/' + uid).remove().then(cleanup).catch(() => { console.warn('не удалось удалить профиль из базы, чистим локально'); cleanup(); });
  }
});

function setFieldError(form, field, bad) { const g = form.querySelector(`[data-field="${field}"]`); if (g) { if (bad) g.classList.add('invalid'); else g.classList.remove('invalid'); } }

function handleProfileSubmit(form) {
  console.log('📨 handleProfileSubmit вызван');
  if (isSavingProfile) { console.log('⏳ уже сохраняется, игнор'); return; }
  const d = Object.fromEntries(new FormData(form));
  const name = (d.name || '').trim();
  const username = (d.username || '').trim();
  let ok = true;
  if (name.length < 3) { setFieldError(form, 'name', true); toast('⚠️ Имя: минимум 3 символа', 'warning'); ok = false; } else setFieldError(form, 'name', false);
  if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) { setFieldError(form, 'username', true); toast('⚠️ @username: 3–20 символов, только латиница, цифры, _ и точка', 'warning'); ok = false; } else setFieldError(form, 'username', false);
  if (!ok) { console.log('❌ валидация не прошла'); return; }
  const ex = state.users.find(u => u.username === username && u.id !== currentUser.id);
  if (ex) { setFieldError(form, 'username', true); toast('❌ Этот @username уже занят', 'error'); return; }
  isSavingProfile = true;
  const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button'); const oh = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = '0.6'; submitBtn.innerHTML = '⏳ Сохранение...'; }
  const finish = (iac) => finalizeProfileUpdate(username, iac, form, d, submitBtn, oh);
  const aci = (d.adminCode || '').trim();
  if (aci) {
    if (aci === CONFIG.CREATOR_CODE) { toast('✅ Код создателя активирован!', 'success'); finish(true); }
    else db.ref('adminCodes').orderByChild('code').equalTo(aci).once('value', snap => {
      let f = false; snap.forEach(ch => { if (!ch.val().used) { ch.ref.update({ used: true, usedBy: username, usedAt: Date.now() }); f = true; } });
      if (!f) { toast('❌ Неверный или использованный код', 'error'); setFieldError(form, 'adminCode', true); isSavingProfile = false; if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = ''; submitBtn.innerHTML = oh; } return; }
      finish(true);
    });
  } else finish(false);
}

// === СОХРАНЕНИЕ ПРОФИЛЯ: МГНОВЕННОЕ (окно закрывается сразу, запись + аватар — в фоне) ===
function finalizeProfileUpdate(username, iac, form, d, submitBtn, oh) {
  const iad = CONFIG.DEFAULT_ADMINS.includes(username);
  const up = { name: (d.name || '').trim(), username: username, role: (iac || iad) ? 'admin' : 'user' };
  if (iac && (d.adminCode || '').trim() === CONFIG.CREATOR_CODE) up.creatorCodeUsed = true;
  if (!state.user) up.createdAt = Date.now();
  const localAvatar = avatarTemp || (state.user && state.user.avatar) || null; // превью показываем сразу, без ожидания сети
  const avatarFile = window._avatarFile || null;
  // 1) оптимистично и мгновенно — UI реагирует сразу
  state.user = Object.assign({}, state.user || currentUser, up, { id: currentUser.id, favorites: (state.user && state.user.favorites) || [], completedDeals: (state.user && state.user.completedDeals) || 0, avatar: localAvatar });
  avatarTemp = null; window._avatarFile = null;
  closeModal(form.closest('.modal-overlay'));
  toast('✅ Профиль сохранён', 'success');
  state.currentView = 'profile'; document.querySelectorAll('[data-view]').forEach(x => x.classList.remove('active')); const pm = document.querySelector('[data-view="profile"]'); if (pm) pm.classList.add('active');
  renderView();
  isSavingProfile = false; if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = ''; submitBtn.innerHTML = oh; }
  console.log('✅ профиль показан мгновенно, запись в базу идёт в фоне');
  // 2) запись в базу — в фоне, не блокирует интерфейс
  db.ref('users/' + currentUser.id).update(up).then(() => {
    console.log('✅ профиль записан в базу');
    if (avatarFile) {
      uploadAvatar(avatarFile).then(url => { state.user.avatar = url; db.ref('users/' + currentUser.id).update({ avatar: url }); renderView(); console.log('✅ аватар загружен в фоне'); }).catch(er => { console.warn('⚠️ аватар не загрузился:', er); });
    }
  }).catch(er => { console.error('❌ ошибка записи профиля:', er); toast('⚠️ Не удалось сохранить в базу: ' + (er.message || er), 'error'); });
}

function handleCreateSubmit(form) {
  if (isSubmitting) return;
  if (!state.user) { toast('👤 Сначала создайте профиль', 'warning'); openModal('profileModal'); return; }
  if (isBanned(state.user)) { toast('🚫 Аккаунт заблокирован', 'error'); return; }
  if (isMuted(state.user)) { toast('🔇 Вам запрещено создавать объявления', 'error'); return; }
  const d = Object.fromEntries(new FormData(form));
  let ok = true;
  const title = (d.title || '').trim();
  if (title.length < 3) { setFieldError(form, 'title', true); ok = false; } else setFieldError(form, 'title', false);
  if (d.price === undefined || d.price === null || d.price === '') { setFieldError(form, 'price', true); ok = false; } else setFieldError(form, 'price', false);
  if (!d.server) { setFieldError(form, 'server', true); ok = false; } else setFieldError(form, 'server', false);
  if (!d.category) { setFieldError(form, 'category', true); ok = false; } else setFieldError(form, 'category', false);
  if (!ok) { toast('❌ Заполните все обязательные поля', 'error'); return; }
  const pr = parsePrice(d.price);
  const dup = state.listings.some(l => l.seller && l.seller.username === state.user.username && (l.title || '').trim().toLowerCase() === title.toLowerCase() && l.server === d.server && (Date.now() - (l.date || 0)) < 30000);
  if (dup) { toast('⚠️ Похожее объявление уже отправлено. Подождите 30 секунд.', 'warning'); return; }
  isSubmitting = true; const sb = form.querySelector('button[type="submit"]'); const oh = sb ? sb.innerHTML : '';
  if (sb) { sb.disabled = true; sb.style.opacity = '0.6'; sb.style.pointerEvents = 'none'; sb.innerHTML = '⏳ Отправка...'; }
  (async () => {
    try {
      const ni = { title: title, price: pr, server: d.server, category: d.category, description: (d.description || '').trim(), seller: { name: state.user.name, username: state.user.username, avatar: state.user.avatar || null }, date: Date.now(), status: 'pending', rejectReason: null };
      if (uploadedFiles.length) { const fi = uploadedFiles.find(x => x.type === 'image'); if (fi) ni.img = fi.url; ni.media = uploadedFiles.map(x => ({ type: x.type, url: x.url, name: x.name })); }
      if (state.editingListingId) { await db.ref('listings/' + state.editingListingId).update({ ...ni, status: 'pending', rejectReason: null, editedAt: Date.now() }); toast('✅ Объявление обновлено', 'success'); }
      else { await db.ref('listings').push(ni); toast('✅ Объявление отправлено на модерацию', 'success'); }
      form.reset(); if (filePreview) filePreview.innerHTML = ''; uploadedFiles = []; state.editingListingId = null; closeModal(form.closest('.modal-overlay'));
    } catch (er) { console.error(er); toast('❌ Ошибка при создании', 'error'); }
    finally { isSubmitting = false; if (sb) { sb.disabled = false; sb.style.opacity = ''; sb.style.pointerEvents = ''; sb.innerHTML = oh; } }
  })();
}

function handleReportSubmit(form) {
  const d = Object.fromEntries(new FormData(form));
  if (!state.user) { toast('👤 Сначала создайте профиль', 'warning'); return; }
  db.ref('complaints').push({ reporter: state.user.username, target: d.reportTarget, type: d.reportType, reason: d.reportReason, description: d.reportDescription, time: Date.now(), resolved: false });
  toast('🚨 Жалоба отправлена модераторам', 'warning'); closeModal(form.closest('.modal-overlay')); form.reset();
}
function handleReviewSubmit(form) {
  const d = Object.fromEntries(new FormData(form));
  if (!state.user) { toast('👤 Сначала создайте профиль', 'warning'); return; }
  const tu = state.users.find(u => u.username === d.reviewTarget); if (!tu) { toast('❌ Пользователь не найден', 'error'); return; }
  if (!tu.reviews) tu.reviews = [];
  tu.reviews.push({ from: state.user.username, rating: +d.rating, text: d.reviewText || '', time: Date.now() });
  state.user.completedDeals = (state.user.completedDeals || 0) + 1;
  db.ref('users/' + tu.id).update({ reviews: tu.reviews }); db.ref('users/' + state.user.id).update({ completedDeals: state.user.completedDeals });
  toast(`⭐ Отзыв оставлен (${d.rating}/5)`, 'success'); closeModal(form.closest('.modal-overlay')); form.reset(); selectedRating = 5; document.querySelectorAll('#starRating span').forEach(x => x.style.opacity = '1');
}
function handleDeleteSubmit(form) {
  const id = document.getElementById('deleteListingId'); if (!id || !id.value) return;
  const r = form.deleteReason ? form.deleteReason.value.trim() : '';
  db.ref('listings/' + id.value).remove(); toast('🗑️ Объявление удалено', 'warning');
  if (r) addNotification('Объявление удалено', 'Причина: ' + r, 'info');
  state.currentView = 'my'; renderView(); closeModal(form.closest('.modal-overlay'));
}
function handleSupportSubmit(form) {
  if (!state.user) { toast('👤 Создайте профиль', 'warning'); return; }
  const sj = document.getElementById('supportSubject'); const ds = document.getElementById('supportDescription');
  const sjv = sj ? sj.value.trim() : ''; const dsv = ds ? ds.value.trim() : '';
  if (!sjv || sjv.length < 3) { toast('⚠️ Укажите тему', 'warning'); return; }
  if (!dsv || dsv.length < 5) { toast('⚠️ Опишите проблему', 'warning'); return; }
  const sna = window._sna || [];
  const nt = { userId: state.user.id, username: state.user.username, name: state.user.name, subject: sjv, status: 'open', createdAt: Date.now(), updatedAt: Date.now(), messages: [{ from: state.user.username, fromId: state.user.id, text: dsv, attachments: sna.slice(), time: Date.now(), read: false, isAdmin: false }] };
  db.ref('support').push(nt).then(ref => {
    toast('✅ Обращение создано', 'success'); window._sna = []; form.reset(); const bx = document.getElementById('supportNewAttachments'); if (bx) bx.innerHTML = ''; closeModal(document.getElementById('supportModal'));
    state.users.forEach(u => { if (isAdmin(u)) db.ref('notifications/' + u.id).push({ title: '🛠️ Новое обращение в техподдержку', message: `Тикет: ${sjv}\nОт: @${state.user.username}`, type: 'info', time: Date.now(), read: false, supportTicketId: ref.key }); });
  }).catch(er => { console.error(er); toast('❌ Ошибка создания', 'error'); });
}
function handleActionSubmit(form) {
  const fd = Object.fromEntries(new FormData(form));
  const u = state.users.find(x => x.username === fd.targetUsername); if (!u) { toast('❌ Пользователь не найден', 'error'); return; }
  const up = {};
  if (fd.actionType === 'ban') { up.banned = true; up.banReason = fd.reason; up.banBy = state.user.username; up.bannedAt = Date.now(); if (fd.duration) up.banUntil = Date.now() + parseInt(fd.duration) * 3600000; toast(`🚫 @${u.username} заблокирован`, 'warning'); }
  else if (fd.actionType === 'mute') { up.muted = true; up.muteReason = fd.reason; up.muteBy = state.user.username; up.mutedAt = Date.now(); if (fd.duration) up.muteUntil = Date.now() + parseInt(fd.duration) * 3600000; toast(`🔇 @${u.username} ограничен`, 'warning'); }
  else { up.banned = false; up.muted = false; up.banUntil = null; up.muteUntil = null; toast(`✅ @${u.username} разблокирован`, 'success'); }
  db.ref('users/' + u.id).update(up); closeModal(form.closest('.modal-overlay'));
}

on('skipDeleteBtn', 'click', () => { const id = document.getElementById('deleteListingId'); if (!id || !id.value) return; db.ref('listings/' + id.value).remove(); toast('🗑️ Удалено', 'warning'); state.currentView = 'my'; renderView(); closeModal(document.getElementById('deleteListingModal')); });

function setupFileUpload() {
  if (!fileInput) return;
  fileInput.addEventListener('change', async (e) => {
    const nf = Array.from(e.target.files); fileInput.value = '';
    const rem = 10 - uploadedFiles.length; if (rem <= 0) { toast('⚠️ Максимум 10 файлов. Удалите лишние.', 'warning'); return; }
    const fa = nf.slice(0, rem); if (nf.length > rem) toast(`⚠️ Добавлено только ${rem} из ${nf.length} (лимит 10)`, 'warning');
    for (const f of fa) { const v = validateFile(f); if (!v.valid) { toast(`⚠️ ${f.name}: ${v.error}`, 'warning'); continue; } try { if (f.type.startsWith('image/')) { const u = await uploadImageToStorage(f); uploadedFiles.push({ type: 'image', url: u, name: f.name, size: f.size }); } else if (f.type.startsWith('video/')) { const u = await uploadVideoToStorage(f); uploadedFiles.push({ type: 'video', url: u, name: f.name, size: f.size }); } } catch (er) { toast(`❌ Ошибка загрузки ${f.name}`, 'error'); } }
    renderFilePreview(); if (uploadedFiles.length) toast(`✅ Загружено файлов: ${uploadedFiles.length}`, 'success');
  });
}
function renderFilePreview() {
  if (!filePreview) return; if (!uploadedFiles.length) { filePreview.innerHTML = ''; return; }
  filePreview.innerHTML = uploadedFiles.map((f, i) => `<div class="thumb-wrap" style="position:relative;display:inline-block;">${f.type === 'video' ? `<div class="thumb video-thumb" data-idx="${i}"></div>` : `<img class="thumb" src="${f.url}" alt="${escapeHtml(f.name)}" data-idx="${i}">`}<button type="button" data-remove-idx="${i}" style="position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;background:rgba(220,38,38,0.95);color:#fff;border:2px solid #fff;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.4);z-index:10;padding:0;" title="Удалить файл">✕</button></div>`).join('');
  filePreview.querySelectorAll('.thumb').forEach(t => t.addEventListener('click', (e) => { if (e.target.closest('[data-remove-idx]')) return; const i = parseInt(t.dataset.idx); openGalleryModal(uploadedFiles.map(x => ({ type: x.type, url: x.url })), i); }));
  filePreview.querySelectorAll('[data-remove-idx]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); removeUploadedFile(parseInt(b.dataset.removeIdx)); }));
}
function removeUploadedFile(i) { if (i < 0 || i >= uploadedFiles.length) return; uploadedFiles.splice(i, 1); renderFilePreview(); toast('🗑️ Файл удалён', 'info'); }
document.addEventListener('DOMContentLoaded', () => { const cm = document.getElementById('createModal'); if (cm) cm.querySelectorAll('select').forEach(s => { s.addEventListener('mousedown', (e) => { e.stopPropagation(); isSelectOpen = true; setTimeout(() => { isSelectOpen = false; }, 300); }); s.addEventListener('click', (e) => e.stopPropagation()); }); });