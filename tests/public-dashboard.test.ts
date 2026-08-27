import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const footer = readFileSync(new URL("../src/components/Footer.tsx", import.meta.url), "utf8")
const serverPage = readFileSync(new URL("../src/pages/Server.tsx", import.meta.url), "utf8")
const groupSwitch = readFileSync(new URL("../src/components/GroupSwitch.tsx", import.meta.url), "utf8")
const languageSwitcher = readFileSync(new URL("../src/components/LanguageSwitcher.tsx", import.meta.url), "utf8")
const i18n = readFileSync(new URL("../src/i18n.js", import.meta.url), "utf8")
const theme = readFileSync(new URL("../src/theme/createLiteTheme.ts", import.meta.url), "utf8")
const websocket = readFileSync(new URL("../src/context/websocket-provider.tsx", import.meta.url), "utf8")
const liteApi = readFileSync(new URL("../src/lib/lite-api.ts", import.meta.url), "utf8")
const themeHomeSort = readFileSync(new URL("../src/lib/theme-home-sort.ts", import.meta.url), "utf8")

test("limits public languages to Chinese, English and Japanese", () => {
  assert.match(languageSwitcher, /"zh-CN"/)
  assert.match(languageSwitcher, /"zh-TW"/)
  assert.match(languageSwitcher, /"en-US"/)
  assert.match(languageSwitcher, /"ja-JP"/)
  assert.doesNotMatch(languageSwitcher, /ru-RU|es-ES|de-DE|ta-IN/)
  assert.match(i18n, /ja-JP/)
  assert.doesNotMatch(i18n, /ru-RU|es-ES|de-DE|ta-IN/)
})

test("hides homepage sort, version and Ctrl+K", () => {
  const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8")
  const index = readFileSync(new URL("../index.html", import.meta.url), "utf8")
  assert.doesNotMatch(serverPage, /defaultSort/)
  assert.match(serverPage, /readThemeHomeSort/)
  assert.doesNotMatch(footer, /Ctrl|⌘|V1\.0\.0|themeBy/)
  assert.match(footer, /Powered by Lite/)
  assert.match(footer, /mt-3/)
  assert.doesNotMatch(footer, /pt-7|pb-3 pt-3/)
  assert.doesNotMatch(main, /CommandProvider|SortProvider|TooltipProvider|sonner/)
  assert.doesNotMatch(index, /flag-icons|font-logos/)
  assert.equal(existsSync(new URL("../src/lib/geo-json-string.ts", import.meta.url)), false)
  assert.equal(existsSync(new URL("../src/lib/geo-limit.ts", import.meta.url)), false)
  assert.equal(existsSync(new URL("../src/components/ui/command.tsx", import.meta.url)), false)
  assert.equal(existsSync(new URL("../public/animated-man.webp", import.meta.url)), false)
  assert.equal(existsSync(new URL("../src/components/Icon.tsx", import.meta.url)), false)
})

test("uses brand blue and nested group radii", () => {
  assert.match(theme, /#0E86DD/)
  assert.match(groupSwitch, /const GROUP_RADIUS_PX = 8/)
  assert.match(groupSwitch, /const GROUP_INNER_RADIUS_PX = GROUP_RADIUS_PX - GROUP_PADDING_PX/)
})

test("homepage uses the charcoal two-panel status banner", () => {
  const overview = readFileSync(new URL("../src/components/ServerOverview.tsx", import.meta.url), "utf8")
  assert.match(overview, /SYSTEM HEALTH/)
  assert.match(overview, /serverOverview.globalStatus/)
  assert.match(overview, /LIVE TRAFFIC/)
  assert.match(overview, /#202A33/)
})

test("homepage latency probes omit the packet-loss status row", () => {
  const latency = readFileSync(new URL("../src/components/ServerLatencySummary.tsx", import.meta.url), "utf8")
  const card = readFileSync(new URL("../src/components/ServerCard.tsx", import.meta.url), "utf8")
  const planInfo = readFileSync(new URL("../src/components/PlanInfo.tsx", import.meta.url), "utf8")
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
  assert.doesNotMatch(latency, /丢包 /)
  assert.doesNotMatch(latency, /稳定/)
  assert.doesNotMatch(latency, /y1="21"|polyline|sparklinePoints|grid-cols-3/)
  assert.match(latency, /h-\[5px\]/)
  assert.match(latency, /homeLatencyGridTemplate/)
  assert.match(latency, /HOME_LATENCY_CARD_LIMIT/)
  assert.match(latency, /slice\(0, HOME_LATENCY_CARD_LIMIT\)/)
  assert.match(latency, /latencyBarTone/)
  assert.match(latency, /packetFillTone/)
  assert.match(card, /resourceUsageTone/)
  assert.doesNotMatch(latency, /packetLoss \?\? 0\) >= 5/)
  assert.doesNotMatch(planInfo, /regionTag/)
  assert.doesNotMatch(planInfo, /country_code/)
  assert.doesNotMatch(planInfo, /networkRoute/)
  assert.match(card, /flex flex-wrap items-center justify-between gap-x-3/)
  assert.doesNotMatch(planInfo, /trafficVol/)
  assert.doesNotMatch(planInfo, /bandwidth/)
  assert.match(planInfo, /extraList/)
  assert.doesNotMatch(app, /PageTransition/)
})

test("header and page body share the same content shell", () => {
  const header = readFileSync(new URL("../src/components/Header.tsx", import.meta.url), "utf8")
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
  const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8")
  assert.match(css, /lite-page-shell/)
  assert.match(css, /max-w-\[1520px\]/)
  assert.match(header, /lite-page-shell/)
  assert.match(app, /lite-page-shell/)
  assert.doesNotMatch(header, /max-w-\[1420px\]/)
})

test("applies homepage sort from theme settings", () => {
  assert.match(themeHomeSort, /HomeSortType/)
  assert.match(themeHomeSort, /HomeSortOrder/)
  assert.match(serverPage, /inset-y-0 right-3 flex items-center/)
  assert.doesNotMatch(serverPage, /top-1\.5/)
})

test("keeps public dashboard polling cheap", () => {
  assert.match(websocket, /STATUS_POLL_MS = 5000/)
  assert.match(websocket, /getLiteNodes\(false\)/)
  assert.match(liteApi, /public:getPingMetricStats/)
  assert.match(liteApi, /historyMaxPoints/)
  assert.match(serverPage, /refetchInterval: 5_000/)
  assert.doesNotMatch(serverPage, /max-\[620px\]:flex-col/)
})

test("keeps assigned ping tasks on the public monitor even without metric points", () => {
  assert.match(liteApi, /mergeAssignedPingMonitors/)
  assert.match(liteApi, /unionPingTasksForClient/)
  assert.match(liteApi, /seedAssignedHomeLatency/)
})

test("public locales share the visitor-facing copy keys", () => {
  const required = [
    "serverOverview.globalStatus",
    "home.allServers",
    "home.serverCount",
    "serverCard.cumulative",
    "serverDetail.backToList",
    "monitor.overview",
    "region.asia",
    "traffic.resetToday",
    "privateSite.title",
  ]
  const locales = ["zh-CN", "zh-TW", "en", "ja"]
  for (const locale of locales) {
    const json = JSON.parse(readFileSync(new URL(`../src/locales/${locale}/translation.json`, import.meta.url), "utf8"))
    for (const key of required) {
      const value = key.split(".").reduce((node: unknown, part) => (node as Record<string, unknown>)?.[part], json)
      assert.equal(typeof value, "string", `${locale} missing ${key}`)
    }
  }
})
