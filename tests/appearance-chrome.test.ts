import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  APPEARANCE_CHROME_DARK,
  APPEARANCE_CHROME_LIGHT,
  appearanceChromeColor,
} from "../src/lib/appearance-chrome.ts"

test("public appearance chrome writes hex theme-color by replacing the tag", () => {
  assert.equal(APPEARANCE_CHROME_LIGHT, "#FFFFFF")
  assert.equal(APPEARANCE_CHROME_DARK, "#161C24")
  assert.equal(appearanceChromeColor(false), APPEARANCE_CHROME_LIGHT)
  assert.equal(appearanceChromeColor(true), APPEARANCE_CHROME_DARK)

  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8")
  const provider = readFileSync(new URL("../src/components/ThemeProvider.tsx", import.meta.url), "utf8")
  const manager = readFileSync(new URL("../src/components/ThemeColorManager.tsx", import.meta.url), "utf8")
  const chrome = readFileSync(new URL("../src/lib/appearance-chrome.ts", import.meta.url), "utf8")

  assert.match(html, /theme-color" content="#FFFFFF"/)
  assert.match(html, /isDark \? "#161C24" : "#FFFFFF"/)
  assert.match(html, /querySelectorAll\('meta\[name="theme-color"\]'\)\.forEach/)
  assert.doesNotMatch(html, /theme-color" content="hsl/)
  assert.match(provider, /applyAppearanceChrome/)
  assert.match(manager, /applyAppearanceChrome/)
  assert.match(manager, /resolvedAppearanceIsDark/)
  assert.doesNotMatch(provider, /hsl\(/)
  assert.doesNotMatch(manager, /hsl\(/)
  assert.match(chrome, /el\.remove\(\)/)
  assert.match(chrome, /document\.head\.appendChild\(meta\)/)
})
