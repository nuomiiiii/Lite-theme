import assert from "node:assert/strict"
import test from "node:test"

import { LIVE_STATUS_CACHE_MAX_AGE_MS, readLiveStatusCache, writeLiveStatusCache } from "../src/lib/live-status-cache.ts"

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}

function snapshot(now = 1_700_000_000_000) {
  return JSON.stringify({
    now,
    servers: [
      {
        id: 1,
        uuid: "node-a",
        name: "edge",
        last_active: "2026-08-27T10:00:00Z",
        online: true,
        state: { cpu: 12 },
        host: { platform: "linux" },
      },
    ],
  })
}

test("restores a recent live status snapshot for the homepage", () => {
  const storage = memoryStorage()
  const data = snapshot()
  writeLiveStatusCache(storage, data, 200_000)
  assert.deepEqual(readLiveStatusCache(storage, 210_000), { data })
})

test("ignores stale or invalid live status snapshots", () => {
  const storage = memoryStorage()
  writeLiveStatusCache(storage, snapshot(), 200_000)
  assert.equal(readLiveStatusCache(storage, 200_000 + LIVE_STATUS_CACHE_MAX_AGE_MS + 1), null)

  storage.setItem("lite-live-status-v1", "{not-json")
  assert.equal(readLiveStatusCache(storage, 210_000), null)

  storage.setItem("lite-live-status-v1", JSON.stringify({ savedAt: 200_000, data: JSON.stringify({ now: 1, servers: "nope" }) }))
  assert.equal(readLiveStatusCache(storage, 210_000), null)
})
