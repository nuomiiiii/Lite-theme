import assert from "node:assert/strict"
import test from "node:test"

import { formatBytes } from "../src/lib/format.ts"

test("displays byte sizes as GB and TB instead of GiB and TiB", () => {
  assert.equal(formatBytes(0), "0 Bytes")
  assert.equal(formatBytes(1024), "1 KB")
  assert.equal(formatBytes(1024 ** 2), "1 MB")
  assert.equal(formatBytes(1024 ** 3), "1 GB")
  assert.equal(formatBytes(1024 ** 4), "1 TB")
  assert.match(formatBytes(2.5 * 1024 ** 3), /GB$/)
  assert.match(formatBytes(3 * 1024 ** 4), /TB$/)
  assert.doesNotMatch(formatBytes(1024 ** 3), /GiB/)
  assert.doesNotMatch(formatBytes(1024 ** 4), /TiB/)
})
