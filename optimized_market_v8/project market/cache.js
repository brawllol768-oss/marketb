const renderCache = new Map();
const CACHE_TTL = 60000;
function getCachedRender(k) { const c = renderCache.get(k); if (c && Date.now() - c.timestamp < CACHE_TTL) return c.html; renderCache.delete(k); return null; }
function setCachedRender(k, h) { renderCache.set(k, { html: h, timestamp: Date.now() }); }
function clearRenderCache() { renderCache.clear(); }
setInterval(clearRenderCache, CACHE_TTL);