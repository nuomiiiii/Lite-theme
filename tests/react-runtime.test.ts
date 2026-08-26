import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const viteConfig = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8")

test("keeps React as a single runtime when MUI dependencies use junctions", () => {
  assert.match(viteConfig, /react:\s*path\.resolve\(projectRoot,\s*"node_modules\/react"\)/)
  assert.match(viteConfig, /"react-dom":\s*path\.resolve\(projectRoot,\s*"node_modules\/react-dom"\)/)
  assert.match(viteConfig, /dedupe:\s*\["react",\s*"react-dom"\]/)
  assert.doesNotMatch(viteConfig, /preserveSymlinks:\s*true/)
})
