import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { resolveThemeBillingStartDate } from "../src/lib/theme-billing.ts"

test("theme billing start prefers public remark then expiry minus cycle", () => {
  assert.equal(
    resolveThemeBillingStartDate(
      { created_at: "2020-01-01T00:00:00.000Z", expired_at: "2026-10-04T00:00:00.000Z", billing_cycle: 30 },
      "2025-02-01T00:00:00.000Z",
    ),
    "2025-02-01T00:00:00.000Z",
  )
  assert.equal(
    resolveThemeBillingStartDate({
      created_at: "2020-01-01T00:00:00.000Z",
      expired_at: "2026-10-04T00:00:00.000Z",
      billing_cycle: 30,
    }),
    "2026-09-04T00:00:00.000Z",
  )
  assert.equal(
    resolveThemeBillingStartDate({ created_at: "2020-01-01T00:00:00.000Z" }),
    null,
  )
})

test("theme billing start no longer reads node created_at", () => {
  const utils = readFileSync(new URL("../src/lib/utils.ts", import.meta.url), "utf8")
  const billing = readFileSync(new URL("../src/lib/theme-billing.ts", import.meta.url), "utf8")
  assert.match(billing, /export function resolveThemeBillingStartDate/)
  assert.match(utils, /from "@\/lib\/theme-billing"/)
  assert.doesNotMatch(utils, /server\?\.created_at \|\| \(expiredRaw && bc/)
  assert.match(utils, /不再把节点数据库创建时间当作计费周期开始/)
  assert.doesNotMatch(billing, /server\?\.created_at \|\|/)
})
