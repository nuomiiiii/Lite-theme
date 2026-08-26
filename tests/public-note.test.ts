import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const utils = readFileSync(new URL("../src/lib/utils.ts", import.meta.url), "utf8")

test("ignores plain public remarks instead of parsing them as JSON", () => {
  assert.match(utils, /if \(!raw \|\| raw\[0\] !== "\{"\)/)
  assert.doesNotMatch(utils, /Error parsing public note/)
})
