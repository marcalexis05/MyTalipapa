// Simple offline cache using localStorage

const CACHE_KEY_STALLS = 'mytalipapa_stalls_cache';
const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

export const cacheStallsData = (data) => {
  try {
    const payload = {
      timestamp: Date.now(),
      data: data
    };
    localStorage.setItem(CACHE_KEY_STALLS, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed to cache stalls data:', e);
  }
};

export const getCachedStallsData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_STALLS);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY_STALLS);
      return null;
    }
    
    return parsed.data;
  } catch (e) {
    console.error('Failed to read cached stalls data:', e);
    return null;
  }
};
