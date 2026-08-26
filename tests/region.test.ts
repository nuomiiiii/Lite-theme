import assert from "node:assert/strict"
import test from "node:test"

import { continentLabel, regionStats, regionTone } from "../src/lib/region.ts"
import { sparklinePoints } from "../src/lib/sparkline.ts"

test("maps country codes into the homepage region line", () => {
  assert.equal(continentLabel("TW"), "asia")
  assert.equal(continentLabel("US"), "america")
  assert.equal(continentLabel("DE"), "europe")
  assert.equal(continentLabel("AU"), "oceania")

  const stats = regionStats([
    { country_code: "TW", online: true },
    { country_code: "JP", online: true },
    { country_code: "US", online: false },
  ])
  assert.deepEqual(stats.find((item) => item.label === "asia"), { label: "asia", online: 2, total: 2 })
  assert.equal(regionTone({ label: "asia", online: 2, total: 2 }), "green")
  assert.equal(regionTone({ label: "america", online: 0, total: 1 }), "coral")
})

test("builds sparkline points for latency probes", () => {
  const points = sparklinePoints([34, 36, 32, 34])
  assert.match(points, /0\.0,/)
  assert.match(points, /100\.0,/)
})
