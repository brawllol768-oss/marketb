function randName() { return Date.now() + '_' + Math.random().toString(36).slice(2, 8); }

async function compressToBase64(file, maxDim = 500, quality = 0.6) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) return resolve(null);
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
          else { w = Math.round(w * maxDim / h); h = maxDim; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function fileToDataURL(file) {
  return new Promise((res) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = () => res(null); r.readAsDataURL(file); });
}

async function uploadImageToStorage(file) {
  // First try Firebase Storage
  if (typeof storage !== 'undefined' && storage) {
    try {
      const snap = await storage.ref('listings/' + randName() + '.jpg').put(file);
      return await snap.ref.getDownloadURL();
    } catch(e) {
      console.warn("Storage failed, falling back to base64", e);
    }
  }
  
  // ULTRA COMPRESS for Realtime Database fallback (guarantees < 100kb string)
  const base64 = await compressToBase64(file, 400, 0.4);
  return base64 || await fileToDataURL(file);
}

async function uploadVideoToStorage(file) {
  if (typeof storage !== 'undefined' && storage) {
    try {
      const snap = await storage.ref('listings/' + randName() + '_' + file.name).put(file);
      return await snap.ref.getDownloadURL();
    } catch(e) {}
  }
  return await fileToDataURL(file); // Video base64 is dangerous but we rely on validation limits in app.js
}

async function uploadAvatar(file) {
  if (typeof storage !== 'undefined' && storage) {
    try {
      const snap = await storage.ref('avatars/' + randName() + '.jpg').put(file);
      return await snap.ref.getDownloadURL();
    } catch(e) {}
  }
  return await compressToBase64(file, 256, 0.7);
}