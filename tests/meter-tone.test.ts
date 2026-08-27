import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { packetFillTone, resourceUsageTone, cpuCoreCount, loadUsagePercent } from "../src/lib/meter-tone.ts"

const serverCard = readFileSync(new URL("../src/components/ServerCard.tsx", import.meta.url), "utf8")
const utils = readFileSync(new URL("../src/lib/utils.ts", import.meta.url), "utf8")
const detailChart = readFileSync(new URL("../src/components/ServerDetailChart.tsx", import.meta.url), "utf8")

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

test("load bars use per-core load instead of the CPU model name count", () => {
  assert.equal(cpuCoreCount(undefined), 1)
  assert.equal(cpuCoreCount(0), 1)
  assert.equal(cpuCoreCount(4), 4)
  assert.equal(loadUsagePercent(1.08, 1), 100)
  assert.equal(resourceUsageTone(loadUsagePercent(1.08, 1)), "coral")
  assert.equal(loadUsagePercent(1.08, 4), 27)
  assert.equal(resourceUsageTone(loadUsagePercent(1.08, 4)), "green")
  assert.equal(loadUsagePercent(2.8, 4), 70)
  assert.equal(resourceUsageTone(loadUsagePercent(2.8, 4)), "amber")
  assert.equal(loadUsagePercent(3.6, 4), 90)
  assert.equal(resourceUsageTone(loadUsagePercent(3.6, 4)), "coral")
  assert.match(utils, /cpu_cores: Number\(server\.cpu_cores\) \|\| 0/)
  assert.match(serverCard, /loadUsagePercent\(info\.load_1, info\.cpu_cores\)/)
  assert.doesNotMatch(serverCard, /cpu_info\.filter/)
  assert.match(detailChart, /cpuCoreCount\(info\.cpu_cores\)/)
})
