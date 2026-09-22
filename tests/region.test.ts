import assert from "node:assert/strict"
import test from "node:test"

import { continentLabel, regionStats, uniqueCountryCount } from "../src/lib/region.ts"

test("maps country codes into the homepage region line", () => {
  assert.equal(continentLabel("TW"), "asia")
  assert.equal(continentLabel("US"), "america")
  assert.equal(continentLabel("DE"), "europe")
  assert.equal(continentLabel("AU"), "oceania")

  const stats = regionStats([
    { country_code: "TW", online: true },
    { country_code: "JP", online: true },
    { country_code: "US", online: false },
  ])
  assert.deepEqual(stats.find((item) => item.label === "asia"), { label: "asia", online: 2, total: 2 })
  assert.equal(uniqueCountryCount([{ country_code: "TW" }, { country_code: "tw" }, { country_code: "US" }, { country_code: "" }]), 2)
})
