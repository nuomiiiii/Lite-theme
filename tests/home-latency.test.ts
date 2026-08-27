import assert from "node:assert/strict"
import test from "node:test"

import { HOME_LATENCY_CARD_LIMIT, homeLatencyGridTemplate, hourPacketFillPercent, latencyBarTone, mapPingStatsToHomeLatency, readHomeLatencyCache, summarizeHomeLatencySamples, writeHomeLatencyCache } from "../src/lib/home-latency.ts"

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

function sample(taskId: string, timestamp: number, latency: number | null, lossRatio: number, count: number) {
  return { entityId: "node-a", taskId, taskName: `Task ${taskId}`, timestamp, latency, lossRatio, count }
}

test("restores recent per-task latency values during a page refresh", () => {
  const storage = memoryStorage()
  const summary = {
    taskId: "1",
    taskName: "Shanghai",
    latency: 32,
    packetLoss: 1.5,
    latencyHistory: [30, 32],
    packetLossHistory: [0, 3],
    updatedAt: 120_000,
  }

  writeHomeLatencyCache(storage, { "node-a": [summary] }, 200_000)
  assert.deepEqual(readHomeLatencyCache(storage, ["node-a"], 210_000), { "node-a": [summary] })
})

test("ignores stale or unrelated latency cache entries", () => {
  const storage = memoryStorage()
  const summary = {
    taskId: "1",
    taskName: "Shanghai",
    latency: 32,
    packetLoss: 0,
    latencyHistory: [32],
    packetLossHistory: [0],
    updatedAt: 120_000,
  }

  writeHomeLatencyCache(storage, { "node-a": [summary] }, 200_000)
  assert.equal(readHomeLatencyCache(storage, ["node-b"], 210_000), undefined)
  assert.equal(readHomeLatencyCache(storage, ["node-a"], 200_000 + 5 * 60_000 + 1), undefined)
})

test("keeps every ping task as a separate weighted summary", () => {
  const bucket = 5 * 60_000
  const result = summarizeHomeLatencySamples(
    [
      sample("1", bucket, 20, 0, 10),
      sample("1", bucket, 40, 0.1, 10),
      sample("1", bucket * 2, 35, 0, 20),
      sample("2", bucket * 2, 80, 0, 5),
    ],
    2,
  )

  assert.equal(result["node-a"].length, 2)
  const first = result["node-a"].find((item) => item.taskId === "1")!
  const second = result["node-a"].find((item) => item.taskId === "2")!
  assert.ok(Math.abs((first.latencyHistory[0] || 0) - 560 / 19) < 0.0001)
  assert.equal(first.packetLossHistory[0], 5)
  assert.equal(first.latency, 35)
  assert.equal(first.packetLoss, 2.5)
  assert.equal(second.latency, 80)
  assert.equal(second.taskName, "Task 2")
})

test("keeps each task timeline continuous when records skip intervals", () => {
  const bucket = 5 * 60_000
  const result = summarizeHomeLatencySamples(
    [sample("1", bucket, 20, 1, 1), sample("1", bucket * 3, 30, 0, 1)],
    3,
  )["node-a"][0]

  assert.deepEqual(result.latencyHistory, [null, null, 30])
  assert.deepEqual(result.packetLossHistory, [100, null, 0])
  assert.equal(result.packetLoss, 50)
})

test("weights a task loss rate by probe count", () => {
  const bucket = 5 * 60_000
  const result = summarizeHomeLatencySamples(
    [sample("1", bucket, null, 1, 2), sample("1", bucket * 2, 25, 0, 18)],
    2,
  )["node-a"][0]

  assert.equal(result.packetLoss, 10)
  assert.deepEqual(result.packetLossHistory, [100, 0])
})

test("keeps total packet loss visible without inventing latency", () => {
  const result = summarizeHomeLatencySamples([sample("1", 60_000, null, 1, 12)])["node-a"][0]
  assert.equal(result.latency, null)
  assert.equal(result.packetLoss, 100)
})

test("fills the probe bar from last-hour reply rate, not expected ping count", () => {
  assert.equal(hourPacketFillPercent({}), 0)
  assert.equal(hourPacketFillPercent({ packetLoss: 0 }), 0)
  assert.equal(hourPacketFillPercent({ packetLoss: 25 }), 0)
  assert.equal(hourPacketFillPercent({ total: 0, valid: 0, packetLoss: 0 }), 0)
  assert.equal(hourPacketFillPercent({ total: 60, valid: 60 }), 100)
  assert.equal(hourPacketFillPercent({ total: 60, valid: 57, packetLoss: 5 }), 95)
  assert.equal(hourPacketFillPercent({ total: 12, valid: 12, interval: 60 }), 100)
  assert.equal(hourPacketFillPercent({ total: 15, valid: 15, packetLoss: 0 }), 100)
})

test("colors 0-80ms green, 80-180ms amber, and 180ms+ coral", () => {
  assert.equal(latencyBarTone(null), "empty")
  assert.equal(latencyBarTone(-4), "empty")
  assert.equal(latencyBarTone(0), "green")
  assert.equal(latencyBarTone(13), "green")
  assert.equal(latencyBarTone(80), "green")
  assert.equal(latencyBarTone(80.1), "amber")
  assert.equal(latencyBarTone(135), "amber")
  assert.equal(latencyBarTone(179.9), "amber")
  assert.equal(latencyBarTone(180), "coral")
  assert.equal(latencyBarTone(200), "coral")
})

test("maps ping metric stats onto per-task home summaries", () => {
  const result = mapPingStatsToHomeLatency(
    [
      { entity_id: "node-a", task_id: "2", name: "Tokyo", latest: 80, loss: 0 },
      { entity_id: "node-a", task_id: "1", latest: 32, avg: 40, loss: 1.5 },
    ],
    [
      { id: 1, name: "Shanghai" },
      { id: 2, name: "Tokyo" },
    ],
  )

  assert.equal(result["node-a"].length, 2)
  assert.equal(result["node-a"][0].taskName, "Shanghai")
  assert.equal(result["node-a"][0].latency, 32)
  assert.equal(result["node-a"][1].taskName, "Tokyo")
})

test("treats zero-sample ping stats as empty instead of a full green bar", () => {
  const result = mapPingStatsToHomeLatency([
    { entity_id: "node-a", task_id: "1", name: "Fujian", latest: null, loss: 0, total: 0, valid: 0 },
  ])
  assert.equal(result["node-a"][0].latency, null)
  assert.equal(result["node-a"][0].packetLoss, null)
  assert.equal(hourPacketFillPercent(result["node-a"][0]), 0)
})

test("homepage cards keep at most four probe tasks and fill one PC row", () => {
  assert.equal(HOME_LATENCY_CARD_LIMIT, 4)
  assert.equal(homeLatencyGridTemplate(1), "repeat(1, minmax(0, 1fr))")
  assert.equal(homeLatencyGridTemplate(2), "repeat(2, minmax(0, 1fr))")
  assert.equal(homeLatencyGridTemplate(3), "repeat(3, minmax(0, 1fr))")
  assert.equal(homeLatencyGridTemplate(4), "repeat(4, minmax(0, 1fr))")
  assert.equal(homeLatencyGridTemplate(8), "repeat(4, minmax(0, 1fr))")
})
