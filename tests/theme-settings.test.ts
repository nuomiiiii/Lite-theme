import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const manifest = JSON.parse(readFileSync(new URL("../Lite-theme.json", import.meta.url), "utf8"))
const settings = manifest.configuration.data as Array<Record<string, unknown>>
const keys = settings.map((item) => item.key).filter(Boolean)
const header = readFileSync(new URL("../src/components/Header.tsx", import.meta.url), "utf8")
const themeSwitcher = readFileSync(new URL("../src/components/ThemeSwitcher.tsx", import.meta.url), "utf8")
const serverCard = readFileSync(new URL("../src/components/ServerCard.tsx", import.meta.url), "utf8")
const detailOverview = readFileSync(new URL("../src/components/ServerDetailOverview.tsx", import.meta.url), "utf8")
const networkChart = readFileSync(new URL("../src/components/NetworkChart.tsx", import.meta.url), "utf8")
const utils = readFileSync(new URL("../src/lib/utils.ts", import.meta.url), "utf8")

test("publishes the independent Lite-Theme identity", () => {
  assert.equal(existsSync(new URL("../Lite-theme.json", import.meta.url)), true)
  assert.equal(existsSync(new URL("../komari-theme.json", import.meta.url)), false)
  assert.equal(manifest.name, "Lite-Theme")
  assert.equal(manifest.short, "lite-theme")
  assert.equal(manifest.version, "1.0.4")
  assert.equal(manifest.author, "Nomi")
  assert.equal(manifest.url, "https://github.com/nuomiiiii/Lite-theme")
  assert.equal(manifest.preview, "preview.png")
  assert.equal(manifest.upstream, undefined)
})

test("keeps only settings used by the fixed default card experience", () => {
  assert.deepEqual(keys, [
    "CustomBackgroundImage",
    "CustomMobileBackgroundImage",
    "CustomLogo",
    "ForceTheme",
    "ForcePeakCutEnabled",
    "ShowServerBandwidth",
    "DefaultBillingCurrency",
    "CnySymbolStyle",
  ])
})

test("does not expose alternate card, map or decoration switches", () => {
  for (const removed of [
    "EnableVerticalCard",
    "ForceCardInline",
    "CardLayout",
    "ShowGlobalMap",
    "ShowServiceTracker",
    "DisableAnimatedMan",
    "DisableOverviewWave",
    "ShowHomeLatency",
    "HideIPv4IPv6Tag",
    "TrafficResetDayOverrides",
    "ServerBillingCurrencyOverrides",
  ]) {
    assert.equal(keys.includes(removed), false, `${removed} should not be present`)
  }
  assert.doesNotMatch(utils, /TrafficResetDayOverrides/)
  assert.doesNotMatch(utils, /ServerBillingCurrencyOverrides/)
})

test("shows server bandwidth on cards only when the theme switch is on", () => {
  const setting = settings.find((item) => item.key === "ShowServerBandwidth")
  assert.equal(setting?.type, "switch")
  assert.equal(setting?.default, false)
  assert.match(utils, /bandwidth: typeof server\.bandwidth === "string" \? server\.bandwidth\.trim\(\) : ""/)
  assert.match(serverCard, /readShowServerBandwidth/)
  assert.match(serverCard, /serverBandwidthLabel/)
  assert.doesNotMatch(serverCard, /planDataMod\?\.bandwidth/)
})

test("keeps language, appearance and login in the public header", () => {
  assert.match(header, /<LanguageSwitcher \/>/)
  assert.match(header, /<ModeToggle \/>/)
  assert.match(header, /href="\/admin"/)
  assert.doesNotMatch(header, /startIcon|LogIn/)
  assert.match(header, /#0E86DD/)
  assert.match(header, /h-\[82px\]/)
  assert.match(header, /lite-page-shell/)
  assert.match(themeSwitcher, /AutoThemeIcon/)
  assert.doesNotMatch(themeSwitcher, /BrightnessAuto/)
  assert.doesNotMatch(themeSwitcher, /SunMoon/)
})

test("shows the site description after the header divider on mobile", () => {
  assert.match(header, /site_desc/)
  assert.doesNotMatch(header, /hidden min-w-0 truncate text-base text-\[#7A8792\] sm:inline/)
  assert.match(header, /line-clamp-2/)
  assert.match(header, /text-\[11px\] leading-snug/)
})

test("does not render IP addresses on public cards or detail identity", () => {
  assert.doesNotMatch(serverCard, /\.ipv[46]|IPv[46]/)
  assert.doesNotMatch(detailOverview, /\.ipv[46]|IPv[46]/)
})

test("renders country flags as fixed-size SVGs without a framed background", () => {
  const flag = readFileSync(new URL("../src/components/ServerFlag.tsx", import.meta.url), "utf8")
  assert.doesNotMatch(serverCard, /rounded-\[4px\] border border-\[#DDE4E9\] bg-\[#F4F7F9\]/)
  assert.match(serverCard, /<ServerFlag /)
  assert.match(flag, /country-flag-icons\/react\/3x2/)
  assert.match(flag, /h-\[15px\] w-\[22px\]/)
  assert.match(flag, /h-\[18px\] w-\[27px\]/)
})

test("lets visitors isolate one or more ping-task curves", () => {
  assert.match(networkChart, /if \(initialChart && chartDataKey.includes\(initialChart\)\) return \[initialChart\]/)
  assert.match(networkChart, /return \[\.\.\.chartDataKey\]/)
  assert.match(networkChart, /setActiveCharts\(\[\.\.\.chartDataKey\]\)/)
  assert.match(networkChart, /toggleChart/)
  assert.match(networkChart, /monitor\.allTasks/)
  assert.match(networkChart, /HISTORY_TIME_OPTIONS/)
  assert.match(networkChart, /selectedTaskSampleCount/)
  assert.match(networkChart, /formatCompactTime/)
})
