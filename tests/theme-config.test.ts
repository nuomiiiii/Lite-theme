import assert from "node:assert/strict"
import test from "node:test"

import { readShowServerBandwidth, readThemeBoolean, serverBandwidthLabel } from "../src/lib/theme-config.ts"

test("bandwidth display defaults off and ignores blank values", () => {
  assert.equal(readShowServerBandwidth(), false)
  assert.equal(readThemeBoolean("ShowServerBandwidth", false), false)
  assert.equal(serverBandwidthLabel("  1 Gbps  "), "1 Gbps")
  assert.equal(serverBandwidthLabel("   "), "")
  assert.equal(serverBandwidthLabel(undefined), "")
})
