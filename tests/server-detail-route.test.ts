import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { isNetworkView, parsePingTaskId, resolveServerRouteId, uuidToNumber } from "../src/lib/server-route.ts"

test("supports both server detail route conventions", () => {
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
  const manifest = JSON.parse(readFileSync(new URL("../Lite-theme.json", import.meta.url), "utf8")) as {
    navigation?: { server_detail?: string; server_network?: string; ping_task_parameter?: string }
  }

  assert.match(app, /lite-page-shell/)
  assert.doesNotMatch(app, /PageTransition/)
  assert.match(app, /<Route path="\/instance\/:id" element={<ServerDetail \/>} \/>/)
  assert.equal(manifest.navigation?.server_detail, "/server/{uuid}")
  assert.equal(manifest.navigation?.server_network, "/server/{uuid}?view=network")
  assert.equal(manifest.navigation?.ping_task_parameter, "ping_task")
})

test("resolves UUID and legacy numeric server routes to the same internal ID contract", () => {
  const uuid = "00000000-0000-4000-8000-000000000014"

  assert.equal(resolveServerRouteId(uuid), uuidToNumber(uuid))
  assert.equal(resolveServerRouteId(uuid.toUpperCase()), uuidToNumber(uuid))
  assert.equal(resolveServerRouteId("14"), 14)
  assert.equal(resolveServerRouteId("server14"), null)
})

test("accepts only positive safe ping task IDs", () => {
  assert.equal(parsePingTaskId("1"), 1)
  assert.equal(parsePingTaskId("0"), undefined)
  assert.equal(parsePingTaskId("-1"), undefined)
  assert.equal(parsePingTaskId("task-1"), undefined)
  assert.equal(parsePingTaskId(null), undefined)
})

test("opens the network overview only for the explicit network view", () => {
  assert.equal(isNetworkView("network"), true)
  assert.equal(isNetworkView("detail"), false)
  assert.equal(isNetworkView("Network"), false)
  assert.equal(isNetworkView(""), false)
  assert.equal(isNetworkView(null), false)
})

test("uses one resolved server ID for overview, realtime charts and ping charts", () => {
  const page = readFileSync(new URL("../src/pages/ServerDetail.tsx", import.meta.url), "utf8")
  const overview = readFileSync(new URL("../src/components/ServerDetailOverview.tsx", import.meta.url), "utf8")
  const realtime = readFileSync(new URL("../src/components/ServerDetailChart.tsx", import.meta.url), "utf8")
  const network = readFileSync(new URL("../src/components/NetworkChart.tsx", import.meta.url), "utf8")

  assert.match(page, /resolveServerRouteId\(routeId\)/)
  assert.match(page, /isNetworkView\(searchParams\.get\("view"\)\) \|\| pingTaskId !== undefined/)
  assert.match(page, /setCurrentTab\(openNetworkView \? tabs\[1\] : tabs\[0\]\)/)
  assert.match(page, /<ServerDetailOverview server_id=\{serverId\}/)
  assert.match(page, /<ServerDetailChart server_id=\{serverId\} show=\{currentTab === tabs\[0\]\}/)
  assert.match(page, /<NetworkChart server_id=\{serverId\}[^>]+initialMonitorId=\{pingTaskId\}/)
  assert.match(overview, /size="lg"/)
  assert.match(overview, /text-\[22px\]/)
  assert.match(overview, /flex min-w-0 items-center gap-3/)
  assert.doesNotMatch(overview, /text-\[28px\]/)
  assert.match(overview, /mb-3.5 inline-flex h-8/)
  assert.doesNotMatch(overview, /pl-10/)
  assert.doesNotMatch(overview, /inline-flex h-7 items-center/)
  const tabSwitch = readFileSync(new URL("../src/components/TabSwitch.tsx", import.meta.url), "utf8")
  assert.match(tabSwitch, /px-0 text-sm font-semibold/)
  assert.match(tabSwitch, /left-0 right-0/)
  assert.doesNotMatch(tabSwitch, /px-4 text-sm/)
  assert.doesNotMatch(realtime, /Number\(server_id\)/)
  assert.match(realtime, /data-testid={`resource-realtime-\$\{dataKey\}`}/)
  assert.match(realtime, /flex min-w-0 items-center gap-3.5/)
  assert.match(realtime, /ml-auto min-w-0 max-w-\[58%\] truncate text-right/)
  assert.doesNotMatch(realtime, /grid-cols-\[42px_minmax\(0,1fr\)\]/)
  assert.match(realtime, /data-testid={`resource-history-\$\{dataKey\}`}/)
  assert.match(realtime, /HISTORY_TIME_OPTIONS/)
  assert.match(realtime, /fetchResourceHistory/)
  assert.match(realtime, /min-\[861px\]:grid-cols-3/)
  assert.doesNotMatch(realtime, /justUpdated/)
  assert.match(realtime, /linear-gradient\(90deg,rgba\(7,141,238,0.08\)/)
  assert.match(network, /monitor\.monitor_id === initialMonitorId/)
})
