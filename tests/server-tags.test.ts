import assert from "node:assert/strict"
import test from "node:test"

import { parseCardTags, parseServerTags } from "../src/lib/server-tags.ts"
import { selectedTaskSampleCount } from "../src/lib/probe-samples.ts"
import { probeHistoryMaxPoints } from "../src/lib/history-range.ts"
import { formatCompactTime } from "../src/lib/format.ts"

test("card tags follow admin tag colors including explicit suffixes", () => {
  const tags = parseServerTags("500Mbps<green>;200Mbps<blue>;<JPY>")
  assert.deepEqual(tags.map((tag) => [tag.text, tag.color]), [
    ["500Mbps", "green"],
    ["200Mbps", "blue"],
  ])
})

test("tags without a color rotate through the same admin palette", () => {
  const tags = parseServerTags("alpha;beta")
  assert.equal(tags[0].color, "ruby")
  assert.equal(tags[1].color, "gray")
})

test("falls back to plan extra only when server tags are empty", () => {
  assert.equal(parseCardTags({ tags: "500Mbps<green>", extra: "ignored" })[0].text, "500Mbps")
  assert.equal(parseCardTags({ extra: "green:500Mbps" })[0].color, "green")
})

test("sample count uses one task window instead of summing selected tasks", () => {
  assert.equal(selectedTaskSampleCount([718, 718]), 718)
  assert.equal(selectedTaskSampleCount([0, 720]), 720)
  assert.equal(selectedTaskSampleCount([0, 0]), null)
})

test("one-hour probe history keeps 5-second resolution", () => {
  assert.equal(probeHistoryMaxPoints(1), 720)
})

test("compact last-update time fits a mobile table cell", () => {
  assert.equal(formatCompactTime(new Date(2026, 7, 27, 9, 19, 0).getTime()), "08-27 09:19")
})
