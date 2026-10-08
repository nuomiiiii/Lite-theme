import assert from "node:assert/strict"
import test from "node:test"

import { successLatency, weightedSuccessDelay } from "../src/lib/ping-sample.ts"

test("partial loss keeps the successful average instead of compensating again", () => {
  assert.equal(successLatency(100, 2, 0.5), 100)
  assert.equal(successLatency(0, 2, 0.5), 0)
  assert.equal(successLatency(100, 2, 1), null)
  assert.equal(successLatency(-1, 2, 1), null)
  assert.equal(successLatency(150, 2, 0), 150)
  assert.equal(successLatency(-1, 1), null)
  assert.equal(successLatency(100, 1), 100)
})

test("overview delay is weighted by successful samples", () => {
  const average = weightedSuccessDelay([
    { delay: 100, count: 1, lossPercent: 0 },
    { delay: 200, count: 9, lossPercent: 0 },
  ])
  assert.equal(average, 190)
  assert.equal(weightedSuccessDelay([{ delay: 100, count: 4, lossPercent: 100 }]), null)
})
