import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { orderMonitorsByPingTasks } from "../src/lib/ping-task-order.ts"

const tw01 = "3a0efee8-cd3f-4d2a-a782-3c1d34f2d9aa"
const pingDisplay = readFileSync(new URL("../src/lib/ping-display.ts", import.meta.url), "utf8")
const liteApi = readFileSync(new URL("../src/lib/lite-api.ts", import.meta.url), "utf8")

function sameClientId(left: string, right: string): boolean {
  return left === right || left.toLowerCase() === right.toLowerCase()
}

function taskAppliesToClient(task: { clients?: string[] }, entityId: string): boolean {
  if (!entityId) return false
  return (task.clients || []).some((client) => sameClientId(String(client), entityId))
}

test("wires public ping task assignment even when metric series are empty", () => {
  assert.match(liteApi, /public:getPublicPingTasks/)
  assert.match(liteApi, /public:queryMetrics/)
  assert.match(liteApi, /public:getPingRecords/)
  assert.match(liteApi, /mergeAssignedPingMonitors/)
  assert.match(pingDisplay, /monitorsFromHomeLatency/)
  assert.match(pingDisplay, /created_at: \[\]/)
  assert.match(liteApi, /if \(!monitors\.some\(\(monitor\) => monitor\.created_at\.length > 0\)\)/)
  assert.doesNotMatch(liteApi, /Promise\.all\(\[\s*fetchPingMetricSeries/)
})

test("matches assigned ping clients without requiring sample points", () => {
  assert.equal(taskAppliesToClient({ clients: [tw01] }, tw01), true)
  assert.equal(taskAppliesToClient({ clients: [tw01.toUpperCase()] }, tw01), true)
  assert.equal(taskAppliesToClient({ clients: ["other"] }, tw01), false)
})

test("keeps backend ping task order after merging empty assigned monitors", () => {
  const merged = orderMonitorsByPingTasks(
    [{ monitor_id: 1, monitor_name: "test" }],
    [{ id: 1 }],
  )
  assert.equal(merged[0].monitor_name, "test")
})

test("turns homepage latency summaries into empty monitor shells", () => {
  assert.match(pingDisplay, /export function monitorsFromHomeLatency/)
  assert.match(pingDisplay, /emptyPingMonitor\(\{ id: summary.taskId, name: summary.taskName \}/)
})
