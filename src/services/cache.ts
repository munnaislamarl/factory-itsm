/**
 * Lightweight read-through cache for the data layer.
 *
 * Google Apps Script responses can take several seconds (cold starts), so we
 * keep fetched collections in memory AND localStorage and serve them instantly
 * on navigation / reload, refreshing in the background when the entry goes
 * stale. Mutations clear the affected keys.
 */

const MEM = new Map<string, { data: unknown; expires: number }>()
const LS_PREFIX = 'factory-itsm.cache.'

export const DEFAULT_TTL = 5 * 60 * 1000

export const LOOKUP_COLLECTIONS = [
  'departments',
  'locations',
  'employees',
  'users',
  'vendors',
  'assets',
  'servers',
  'software',
  'spare_parts',
  'ticket_categories',
  'ticket_subcategories',
] as const

export const CACHE_KEYS = {
  lookups: 'lookups:all',
  dashboard: (scope: string) => `dashboard:${scope}`,
  list: (collection: string, optionsKey: string) => `list:${collection}:${optionsKey}`,
}

export function cacheGet<T>(key: string): T | null {
  const mem = MEM.get(key)
  if (mem && mem.expires > Date.now()) return mem.data as T

  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    if (raw) {
      const parsed = JSON.parse(raw) as { data: T; expires: number }
      if (parsed.expires > Date.now()) {
        MEM.set(key, parsed)
        return parsed.data
      }
      localStorage.removeItem(LS_PREFIX + key)
    }
  } catch {
    // ignore storage errors
  }
  return null
}

export function cacheSet<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  const entry = { data, expires: Date.now() + ttl }
  MEM.set(key, entry)
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry))
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function cacheClear(prefix?: string): void {
  for (const key of [...MEM.keys()]) {
    if (!prefix || key.startsWith(prefix)) MEM.delete(key)
  }
  try {
    for (const storageKey of Object.keys(localStorage)) {
      if (!storageKey.startsWith(LS_PREFIX)) continue
      const logical = storageKey.slice(LS_PREFIX.length)
      if (!prefix || logical.startsWith(prefix)) localStorage.removeItem(storageKey)
    }
  } catch {
    // ignore
  }
}

export function isLookupCollection(collection: string): boolean {
  return (LOOKUP_COLLECTIONS as readonly string[]).includes(collection)
}
