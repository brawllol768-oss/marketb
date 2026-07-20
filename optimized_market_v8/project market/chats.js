function renderChats(main) {
  if (!state.user) { main.innerHTML = emptyHTML('💬', 'Нет доступа', 'Создайте профиль.'); return; }
  if (isBanned(state.user)) { main.innerHTML = emptyHTML('🚫', 'Аккаунт заблокирован', 'Вы не можете использовать чаты.'); return; }
  const myChats = state.chats.filter(c => c.participants && c.participants.includes(state.user.username));
  const generalChat = state.chats.find(c => c.id === 'general_chat');
  
  // Сохраняем состояние ввода и скролла
  let savedInput = '', isFocused = false, scrollTop = 0;
  const oldInput = document.getElementById('msgInput');
  if (oldInput) { savedInput = oldInput.value; isFocused = document.activeElement === oldInput; }
  const oldMsgs = document.getElementById('chatMessages');
  const isScrolledToBottom = oldMsgs ? (oldMsgs.scrollHeight - oldMsgs.scrollTop <= oldMsgs.clientHeight + 10) : true;

  const renderChatsListHTML = () => {
    return (generalChat ? `<div class="chat-item ${state.currentChat === 'general_chat' ? 'active' : ''}" data-chat="general_chat" style="background:linear-gradient(135deg,var(--accent),var(--accent-hover));color:white;"><div class="chat-avatar" style="background:white;color:var(--accent);">👥</div><div class="chat-info"><div class="chat-name" style="color:white;">Общий чат</div><div class="chat-last" style="color:rgba(255,255,255,0.8);">Общайтесь со всеми</div></div></div>` : '') +
      (myChats.length === 0 && !generalChat ? '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">💬 Нет чатов.<br>Найдите пользователя через поиск.</div>' : myChats.map(c => { const ou = c.participants.find(p => p !== state.user.username); const o = getUserByUsername(ou) || { name: ou, username: ou }; const lm = c.messages && Object.keys(c.messages).length > 0 ? Object.values(c.messages).pop() : null; const uc = c.unreadCount || 0; return `<div class="chat-item ${state.currentChat === c.id ? 'active' : ''}" data-chat="${c.id}"><div class="chat-avatar">${renderAvatarHTML(o)}</div><div class="chat-info"><div class="chat-name">${escapeHtml(o.name || ou)}</div><div class="chat-last">${lm ? escapeHtml(lm.text).slice(0, 40) : 'Нет сообщений'}</div></div>${uc > 0 ? `<div class="chat-unread">${uc}</div>` : ''}<button class="chat-delete" data-delete-chat="${c.id}" title="Удалить чат">🗑️</button></div>`; }).join(''));
  };

  const layout = main.querySelector('.chats-layout');
  if (layout) {
    document.getElementById('chatsList').innerHTML = renderChatsListHTML();
    document.getElementById('chatWindow').innerHTML = renderChatWindow();
  } else {
    main.innerHTML = `<div class="chats-layout">
      <div class="chats-sidebar">
        <div class="chats-search"><input type="text" id="chatSearchInput" placeholder="🔍 Поиск по @username..."></div>
        <div class="user-search-results" id="userSearchResults" style="display:none;"></div>
        <div class="chats-list" id="chatsList">${renderChatsListHTML()}</div>
      </div>
      <div class="chat-window" id="chatWindow">${renderChatWindow()}</div>
    </div>`;
  }

  const si = document.getElementById('chatSearchInput'), rs = document.getElementById('userSearchResults');
  if (!si._listener) {
    si._listener = true;
    si.addEventListener('input', () => { clearTimeout(state.searchTimeout); state.searchTimeout = setTimeout(() => { const q = si.value.trim().toLowerCase().replace(/^@/, ''); if (!q) { rs.style.display = 'none'; rs.innerHTML = ''; return; } const m = state.users.filter(u => u.username !== state.user.username && (u.username.toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q))); rs.style.display = 'block'; if (!m.length) { rs.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:13px;text-align:center;">🔍 Пользователь не найден</div>'; return; } rs.innerHTML = m.map(u => { const ec = state.chats.find(c => c.participants && c.participants.includes(state.user.username) && c.participants.includes(u.username)); return `<div class="user-result" data-username="${escapeHtml(u.username)}" data-chat-id="${ec ? ec.id : ''}"><div class="chat-avatar">${renderAvatarHTML(u)}</div><div class="user-result-info"><div class="user-result-name">${escapeHtml(u.name || u.username)} ${isAdmin(u) ? '<span style="color:var(--accent-light);font-size:10px;">🛡️</span>' : ''}</div><div class="user-result-user">@${escapeHtml(u.username)}</div></div><div class="user-result-action">${ec ? '📨 Открыть' : '✍️ Написать'}</div></div>`; }).join(''); rs.querySelectorAll('.user-result').forEach(el => { el.addEventListener('click', () => { const un = el.dataset.username, eid = el.dataset.chatId; if (eid) state.currentChat = eid; else { openChatWith({ username: un, name: '', avatar: null }); return; } si.value = ''; rs.style.display = 'none'; renderView(); }); }); }, 300); });
  }

  const cl = document.getElementById('chatsList');
  cl.onclick = (e) => {
    const btn = e.target.closest('.chat-delete');
    if (btn) { e.stopPropagation(); const cid = btn.dataset.deleteChat; if (confirm('🗑️ Удалить этот чат?')) { db.ref('chats/' + cid).remove().then(() => { if (state.currentChat === cid) state.currentChat = null; toast('🗑️ Чат удалён', 'success'); renderView(); }).catch(() => toast('❌ Ошибка', 'error')); } return; }
    const item = e.target.closest('.chat-item');
    if (item) { state.currentChat = item.dataset.chat; renderView(); }
  };

  const sb = document.getElementById('sendMsgBtn'), mi = document.getElementById('msgInput');
  if (sb && mi) { 
    mi.value = savedInput;
    if (isFocused) mi.focus();
    const send = () => { const t = mi.value.trim(); if (!t) return; const ch = state.chats.find(c => c.id === state.currentChat); if (!ch) return; db.ref('chats/' + ch.id + '/messages').push({ from: state.user.username, text: t, time: Date.now(), read: false }).then(() => { mi.value = ''; setTimeout(() => { const mm = document.getElementById('chatMessages'); if (mm) mm.scrollTop = mm.scrollHeight; }, 100); }).catch(() => toast('❌ Ошибка отправки', 'error')); }; 
    sb.onclick = send; 
    mi.onkeydown = e => { if (e.key === 'Enter') send(); }; 
  }
  
  const msgs = document.getElementById('chatMessages');
  if (msgs) {
     if (isScrolledToBottom) msgs.scrollTop = msgs.scrollHeight;
     else if (oldMsgs && !layout) msgs.scrollTop = scrollTop;
  }

  markMessagesAsRead(); attachMessageDeleteHandlers();
}
function renderChatWindow() {
  if (!state.currentChat) return `<div class="chat-empty"><div class="chat-empty-icon">💬</div><h3>Выберите чат</h3><p>Или найдите пользователя через поиск</p></div>`;
  if (state.currentChat === 'general_chat') {
    const ch = state.chats.find(c => c.id === 'general_chat');
    return `<div class="chat-header"><div class="chat-avatar" style="background:linear-gradient(135deg,var(--accent),var(--accent-hover));color:white;">👥</div><div><div class="chat-header-name">Общий чат</div><div class="chat-header-user">Общайтесь со всеми пользователями</div></div></div><div class="chat-messages" id="chatMessages">${(!ch || !ch.messages || !Object.keys(ch.messages).length) ? '<div style="text-align:center;color:var(--text-muted);padding:20px;font-size:13px;">💬 Начните общение в общем чате!</div>' : Object.entries(ch.messages).map(([k, m]) => `<div class="msg ${m.from === state.user.username ? 'me' : 'other'}"><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px;">@${escapeHtml(m.from)}</div>${m.deleted ? '<span style="opacity:0.5;font-style:italic;">🗑️ Сообщение удалено</span>' : escapeHtml(m.text)}<span class="msg-time">${timeAgo(m.time)}</span>${m.from === state.user.username && !m.deleted ? `<button class="msg-delete-btn" data-msg-key="${k}" title="Удалить сообщение">✕</button>` : ''}</div>`).join('')}</div><div class="chat-input"><input type="text" id="msgInput" placeholder="Написать сообщение..." maxlength="500"><button class="btn btn-primary" id="sendMsgBtn">➤</button></div>`;
  }
  const ch = state.chats.find(c => c.id === state.currentChat);
  if (!ch) return `<div class="chat-empty">❌ Чат не найден</div>`;
  const ou = ch.participants.find(p => p !== state.user.username); const o = getUserByUsername(ou) || { name: ou, username: ou };
  return `<div class="chat-header"><div class="chat-avatar">${renderAvatarHTML(o)}</div><div><div class="chat-header-name">${escapeHtml(o.name || ou)} ${isAdmin(o) ? '<span style="color:var(--accent-light);font-size:10px;">🛡️</span>' : ''}</div><div class="chat-header-user">@${escapeHtml(ou)}</div></div><div class="chat-header-actions"><button class="btn btn-danger" id="deleteChatBtn" title="Удалить чат">🗑️</button></div></div><div class="chat-messages" id="chatMessages">${(!ch.messages || !Object.keys(ch.messages).length) ? '<div style="text-align:center;color:var(--text-muted);padding:20px;font-size:13px;">💬 Начните диалог</div>' : Object.entries(ch.messages).map(([k, m]) => `<div class="msg ${m.from === state.user.username ? 'me' : 'other'}">${m.deleted ? '<span style="opacity:0.6;font-style:italic;">🗑️ Сообщение удалено</span>' : escapeHtml(m.text)}<span class="msg-time">${timeAgo(m.time)}</span>${m.from === state.user.username && !m.deleted ? `<span class="msg-read">${m.read ? '✓✓' : '✓'}</span><button class="msg-delete-btn" data-msg-key="${k}" title="Удалить сообщение">✕</button>` : ''}</div>`).join('')}</div><div class="chat-input"><input type="text" id="msgInput" placeholder="Написать сообщение..." maxlength="500"><button class="btn btn-primary" id="sendMsgBtn">➤</button></div>`;
}
function markMessagesAsRead() {
  if (!state.currentChat || !state.user) return;
  const ch = state.chats.find(c => c.id === state.currentChat); if (!ch || !ch.messages) return;
  const up = {}; Object.entries(ch.messages).forEach(([id, m]) => { if (m.from !== state.user.username && !m.read && !m.deleted) up['chats/' + ch.id + '/messages/' + id + '/read'] = true; });
  if (Object.keys(up).length) db.ref().update(up);
}
function attachMessageDeleteHandlers() {
  const mc = document.getElementById('chatMessages'); if (!mc) return;
  mc.querySelectorAll('.msg-delete-btn').forEach(btn => { btn.addEventListener('click', (e) => { e.stopPropagation(); const k = btn.dataset.msgKey; if (!k) return; if (!confirm('🗑️ Удалить это сообщение?')) return; const ch = state.chats.find(c => c.id === state.currentChat); if (!ch) return; db.ref('chats/' + ch.id + '/messages/' + k).update({ deleted: true, deletedAt: Date.now() }).then(() => toast('🗑️ Сообщение удалено', 'success')).catch(() => toast('❌ Ошибка удаления', 'error')); }); });
}
function openChatWith(ou) {
  if (!state.user) { toast('👤 Сначала создайте профиль', 'warning'); return; }
  if (ou.username === state.user.username) { toast('⚠️ Нельзя написать себе', 'warning'); return; }
  let ch = state.chats.find(c => c.participants && c.participants.includes(state.user.username) && c.participants.includes(ou.username));
  if (!ch) { ch = { participants: [state.user.username, ou.username], messages: [], unreadCount: 0 }; const r = db.ref('chats').push(); ch.id = r.key; r.set(ch); }
  state.currentChat = ch.id; state.currentView = 'chats';
  document.querySelectorAll('[data-view]').forEach(x => x.classList.remove('active'));
  document.querySelector('[data-view="chats"]').classList.add('active');
  renderView(); toast('💬 Чат открыт', 'success');
}