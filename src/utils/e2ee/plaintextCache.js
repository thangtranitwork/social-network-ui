const memoryCache = new Map();

export function setCachedPlaintext(key, text) {
  if (!key || !text) return;
  memoryCache.set(key, text);
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(`e2e_pt_${key}`, text);
    } catch (e) {
      // Ignore quota exceeded errors
    }
  }
}

export function getCachedPlaintext(key) {
  if (!key) return null;
  if (memoryCache.has(key)) return memoryCache.get(key);
  if (typeof window !== "undefined") {
    try {
      const val = sessionStorage.getItem(`e2e_pt_${key}`);
      if (val) {
        memoryCache.set(key, val);
        return val;
      }
    } catch (e) {
      return null;
    }
  }
  return null;
}
