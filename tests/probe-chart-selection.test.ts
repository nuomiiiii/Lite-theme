import assert from "node:assert/strict"
import test from "node:test"

import { monitorNameForId, nextActiveCharts } from "../src/lib/probe-chart-selection.ts"

test("applies the URL ping task after the chart keys first initialize as all tasks", () => {
  const keys = ["test2", "test", "测试"]
  const first = nextActiveCharts({
    chartDataKey: keys,
    initializedSignature: "",
    previous: [],
  })
  assert.deepEqual(first.charts, keys)
  assert.equal(first.skip, false)

  const second = nextActiveCharts({
    chartDataKey: keys,
    initialChart: "test2",
    initializedSignature: first.signature,
    appliedInitial: first.appliedInitial,
    previous: first.charts,
  })
  assert.deepEqual(second.charts, ["test2"])
  assert.equal(second.appliedInitial, "test2")
  assert.equal(second.skip, false)

  const afterUserSelectsAll = nextActiveCharts({
    chartDataKey: keys,
    initialChart: "test2",
    initializedSignature: second.signature,
    appliedInitial: second.appliedInitial,
    previous: keys,
  })
  assert.equal(afterUserSelectsAll.skip, true)
  assert.deepEqual(afterUserSelectsAll.charts, keys)
})

test("matches ping task ids even when monitor_id is a numeric string", () => {
  const records = [
    { monitor_id: "2" as unknown as number, monitor_name: "test2" },
    { monitor_id: 3, monitor_name: "test" },
  ]
  assert.equal(monitorNameForId(records, 2), "test2")
  assert.equal(monitorNameForId(records, 3), "test")
  assert.equal(monitorNameForId(records, undefined), undefined)
})
