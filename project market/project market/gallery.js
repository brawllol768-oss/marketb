let currentGalleryIndex = 0, currentGalleryImages = [], gTX = 0, gEX = 0, gTY = 0, gCY = 0;
function openGalleryModal(images, index) {
  currentGalleryImages = images; currentGalleryIndex = index || 0; showGalleryImage();
  document.getElementById('galleryModal').classList.add('active'); document.body.style.overflow = 'hidden';
  const m = document.getElementById('galleryModal');
  m.addEventListener('touchstart', gTouchStart, { passive: true });
  m.addEventListener('touchmove', gTouchMove, { passive: true });
  m.addEventListener('touchend', gTouchEnd, { passive: true });
  document.addEventListener('keydown', gKey);
}
function closeGalleryModal() {
  document.getElementById('galleryModal').classList.remove('active'); document.body.style.overflow = '';
  const m = document.getElementById('galleryModal');
  m.removeEventListener('touchstart', gTouchStart); m.removeEventListener('touchmove', gTouchMove); m.removeEventListener('touchend', gTouchEnd);
  document.removeEventListener('keydown', gKey);
}
function gKey(e) { if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') closeGalleryModal(); else if (e.key === 'ArrowLeft') changeGalleryImage(-1); else if (e.key === 'ArrowRight') changeGalleryImage(1); }
function gTouchStart(e) { gTX = e.changedTouches[0].screenX; gTY = e.changedTouches[0].screenY; }
function gTouchMove(e) { gCY = e.changedTouches[0].screenY; }
function gTouchEnd(e) { gEX = e.changedTouches[0].screenX; const dy = gCY - gTY, dx = gTX - gEX; if (dy > 100 && Math.abs(dx) < 50) closeGalleryModal(); else if (Math.abs(dx) > 50) changeGalleryImage(dx > 0 ? 1 : -1); }
function showGalleryImage() {
  const c = document.getElementById('galleryModalContent'), ct = document.getElementById('galleryCounter'), it = currentGalleryImages[currentGalleryIndex];
  c.innerHTML = it.type === 'video' ? ('<video src="' + it.url + '" controls autoplay style="max-width:100%;max-height:90vh;"></video>') : ('<img src="' + it.url + '" alt="" style="max-width:100%;max-height:90vh;">');
  ct.textContent = (currentGalleryIndex + 1) + ' / ' + currentGalleryImages.length;
}
function changeGalleryImage(d) { currentGalleryIndex += d; if (currentGalleryIndex < 0) currentGalleryIndex = currentGalleryImages.length - 1; if (currentGalleryIndex >= currentGalleryImages.length) currentGalleryIndex = 0; showGalleryImage(); }
document.getElementById('galleryModal').addEventListener('click', (e) => { if (e.target.id === 'galleryModal') closeGalleryModal(); });