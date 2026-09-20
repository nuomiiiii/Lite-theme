import assert from "node:assert/strict"
import test from "node:test"

import { detectCanadianDollarCurrency, detectHongKongDollarCurrency, getStaticCurrencyLabel } from "../src/lib/currency-label.ts"

test("displays Canadian dollars as C$", () => {
  assert.equal(getStaticCurrencyLabel("CAD"), "C$")
  assert.equal(getStaticCurrencyLabel("CNY"), "¥")
})

test("displays Hong Kong dollars as HK$", () => {
  assert.equal(getStaticCurrencyLabel("HKD"), "HK$")
  assert.equal(getStaticCurrencyLabel("HK$"), "HK$")
})

test("recognizes Canadian dollars embedded in legacy amount values", () => {
  assert.equal(detectCanadianDollarCurrency("CA$45"), "CAD")
  assert.equal(detectCanadianDollarCurrency("45 CA$"), "CAD")
  assert.equal(detectCanadianDollarCurrency("C$45"), "CAD")
  assert.equal(detectCanadianDollarCurrency("CAD 45"), "CAD")
  assert.equal(detectCanadianDollarCurrency("$45"), undefined)
  assert.equal(detectCanadianDollarCurrency("45"), undefined)
})

test("recognizes Hong Kong dollars embedded in legacy amount values", () => {
  assert.equal(detectHongKongDollarCurrency("HK$45"), "HKD")
  assert.equal(detectHongKongDollarCurrency("45 HK$"), "HKD")
  assert.equal(detectHongKongDollarCurrency("HKD 45"), "HKD")
  assert.equal(detectHongKongDollarCurrency("$45"), undefined)
  assert.equal(detectHongKongDollarCurrency("C$45"), undefined)
})
