function compressImage(file, maxDim, quality) {
  maxDim = maxDim || 1280; quality = quality || 0.8;
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') { resolve(file); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) { if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; } else { w = Math.round(w * maxDim / h); h = maxDim; } }
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        c.toBlob((b) => { resolve(b || file); }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
function fileToDataURL(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsDataURL(file); });
}
async function uploadToStorage(file, path) {
  if (storage) { try { const snap = await storage.ref(path).put(file); return await snap.ref.getDownloadURL(); } catch (e) { console.warn('⚠️ Storage недоступен, fallback base64:', e); } }
  return await fileToDataURL(file);
}
function randName() { return Date.now() + '_' + Math.random().toString(36).slice(2, 8); }
async function uploadImageToStorage(file) {
  const compressed = await compressImage(file, 1280, 0.8);
  console.log('✅ Изображение сжато:', (compressed.size / 1024).toFixed(1), 'KB');
  return await uploadToStorage(compressed, 'listings/' + randName() + '.jpg');
}
async function uploadVideoToStorage(file) {
  console.log('✅ Видео загружено:', (file.size / 1024).toFixed(1), 'KB');
  return await uploadToStorage(file, 'listings/' + randName() + '_' + (file.name || 'video.mp4').replace(/\s/g, '_'));
}
async function uploadAvatar(file) {
  const compressed = await compressImage(file, 256, 0.85);
  return await uploadToStorage(compressed, 'avatars/' + (currentUser ? currentUser.id : 'anon') + '_' + Date.now() + '.jpg');
}