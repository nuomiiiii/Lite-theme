export const LIVE_STATUS_CACHE_KEY = "lite-live-status-v1"
export const LIVE_STATUS_CACHE_MAX_AGE_MS = 5 * 60_000

type ReadableStorage = Pick<Storage, "getItem">
type WritableStorage = Pick<Storage, "setItem">

interface LiveStatusCachePayload {
  savedAt: number
  data: string
}

function isLiveStatusSnapshot(raw: string): boolean {
  try {
    const data = JSON.parse(raw) as { servers?: unknown }
    return Boolean(data && typeof data === "object" && Array.isArray(data.servers))
  } catch {
    return false
  }
}

export function readLiveStatusCache(storage: ReadableStorage | null, now = Date.now()): { data: string } | null {
  if (!storage) return null

  try {
    const parsed = JSON.parse(storage.getItem(LIVE_STATUS_CACHE_KEY) || "null") as Partial<LiveStatusCachePayload> | null
    if (!parsed || typeof parsed.savedAt !== "number" || !Number.isFinite(parsed.savedAt) || typeof parsed.data !== "string") {
      return null
    }
    if (parsed.savedAt > now + 60_000 || now - parsed.savedAt > LIVE_STATUS_CACHE_MAX_AGE_MS) return null
    if (!isLiveStatusSnapshot(parsed.data)) return null
    return { data: parsed.data }
  } catch {
    return null
  }
}

export function writeLiveStatusCache(storage: WritableStorage | null, data: string, savedAt = Date.now()): void {
  if (!storage || !isLiveStatusSnapshot(data)) return

  try {
    const payload: LiveStatusCachePayload = { savedAt, data }
    storage.setItem(LIVE_STATUS_CACHE_KEY, JSON.stringify(payload))
  } catch {
    // Live polling still fills the homepage when storage is unavailable.
  }
}
