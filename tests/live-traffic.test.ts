import assert from "node:assert/strict"
import test from "node:test"

import { recordHomeTraffic, resetHomeTraffic } from "../src/lib/live-traffic.ts"

test("records a visible live-traffic line on the first sample", () => {
  resetHomeTraffic()
  const first = recordHomeTraffic(1, 2, 10_000)
  assert.equal(first.length, 2)
  assert.equal(first[0].up, 1)
  assert.equal(first[1].t, 10_000)
})

test("keeps adding points when speed stays the same across polls", () => {
  resetHomeTraffic()
  recordHomeTraffic(1, 2, 10_000)
  const next = recordHomeTraffic(1, 2, 15_000)
  assert.equal(next.length, 3)
  assert.equal(next.at(-1)?.t, 15_000)
})
