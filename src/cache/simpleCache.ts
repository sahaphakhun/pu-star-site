type CacheEntry<T> = {
  data: T;
  expires: number;
};

const store = new Map<string, CacheEntry<any>>();

export function getCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlMs = 60_000) {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function clearCache(key: string) {
  store.delete(key);
} 