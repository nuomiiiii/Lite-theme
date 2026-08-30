import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { chromeThemeColor, DARK_CHROME_COLOR, LIGHT_CHROME_COLOR } from "../src/lib/chrome-color.ts"

const provider = readFileSync(new URL("../src/components/ThemeProvider.tsx", import.meta.url), "utf8")
const manager = readFileSync(new URL("../src/components/ThemeColorManager.tsx", import.meta.url), "utf8")
const header = readFileSync(new URL("../src/components/Header.tsx", import.meta.url), "utf8")
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8")

test("iOS chrome color matches the public header", () => {
  assert.equal(LIGHT_CHROME_COLOR, "#FFFFFF")
  assert.equal(DARK_CHROME_COLOR, "#141B21")
  assert.equal(chromeThemeColor(false), LIGHT_CHROME_COLOR)
  assert.equal(chromeThemeColor(true), DARK_CHROME_COLOR)
  assert.match(header, /bg-white\/96/)
  assert.match(header, /dark:bg-\[#141B21\]\/97/)
  assert.match(index, /#141B21/)
  assert.match(index, /#FFFFFF/)
  assert.match(index, /--bg: #F4F7F9/)
  assert.match(index, /--bg: #141B21/)
  assert.match(provider, /applyChromeThemeColor/)
  assert.match(manager, /applyChromeThemeColor/)
  assert.doesNotMatch(provider, /hsl\(30 15% 8%\)/)
  assert.doesNotMatch(manager, /hsl\(0 0% 98%\)/)
})
