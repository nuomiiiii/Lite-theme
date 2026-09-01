import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const prefetch = readFileSync(new URL("../src/lib/prefetch-monitor.ts", import.meta.url), "utf8")
const chart = readFileSync(new URL("../src/components/NetworkChart.tsx", import.meta.url), "utf8")

test("uses a shared monitor query key for homepage prefetch and the network page", () => {
  assert.match(prefetch, /export function monitorQueryKey\(serverId: number, hours = DEFAULT_MONITOR_HOURS\)/)
  assert.match(prefetch, /return \["monitor", serverId, hours\] as const/)
  assert.match(chart, /monitorQueryKey\(server_id, hours\)/)
  assert.match(chart, /queryFn: \(\) => fetchMonitor\(server_id, hours\)/)
})
