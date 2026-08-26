import assert from "node:assert/strict"
import test from "node:test"

import { packetFillTone, resourceUsageTone } from "../src/lib/meter-tone.ts"

test("packet fill is greener when the last hour is more complete", () => {
  assert.equal(packetFillTone(0), "empty")
  assert.equal(packetFillTone(50), "coral")
  assert.equal(packetFillTone(79.9), "coral")
  assert.equal(packetFillTone(80), "amber")
  assert.equal(packetFillTone(94.9), "amber")
  assert.equal(packetFillTone(95), "green")
  assert.equal(packetFillTone(100), "green")
})

test("resource meters turn amber then coral as usage rises", () => {
  assert.equal(resourceUsageTone(0), "green")
  assert.equal(resourceUsageTone(1.3), "green")
  assert.equal(resourceUsageTone(44.4), "green")
  assert.equal(resourceUsageTone(69.9), "green")
  assert.equal(resourceUsageTone(70), "amber")
  assert.equal(resourceUsageTone(89.9), "amber")
  assert.equal(resourceUsageTone(90), "coral")
  assert.equal(resourceUsageTone(100), "coral")
})
