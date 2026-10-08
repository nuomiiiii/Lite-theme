import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const source = readFileSync(new URL("../src/components/NetworkChart.tsx", import.meta.url), "utf8")

test("chart hover uses the axis time and a drawn anchor for gap rows", () => {
  assert.match(source, /allowDuplicatedCategory=\{false\}/)
  assert.match(source, /const time = Number\(tooltipProps\.label\)/)
  assert.doesNotMatch(source, /payload\?\.\[0\]\?\.payload\?\.created_at/)
  assert.match(source, /data=\{processedData\}[\s\S]{0,180}dataKey=\{HOVER_ANCHOR_KEY\}/)
})
