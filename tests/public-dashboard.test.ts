import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const footer = readFileSync(new URL("../src/components/Footer.tsx", import.meta.url), "utf8")
const serverPage = readFileSync(new URL("../src/pages/Server.tsx", import.meta.url), "utf8")
const groupSwitch = readFileSync(new URL("../src/components/GroupSwitch.tsx", import.meta.url), "utf8")
const languageSwitcher = readFileSync(new URL("../src/components/LanguageSwitcher.tsx", import.meta.url), "utf8")
const i18n = readFileSync(new URL("../src/i18n.ts", import.meta.url), "utf8")
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

test("loads only the current public language until the language menu is opened", () => {
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
  const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8")
  assert.doesNotMatch(i18n, /import enTranslation from/)
  assert.doesNotMatch(i18n, /import zhCNTranslation from/)
  assert.match(i18n, /import\("\.\/locales\/zh-CN\/translation\.json"\)/)
  assert.match(i18n, /import\("\.\/locales\/zh-TW\/translation\.json"\)/)
  assert.match(i18n, /import\("\.\/locales\/en\/translation\.json"\)/)
  assert.match(i18n, /import\("\.\/locales\/ja\/translation\.json"\)/)
  assert.match(i18n, /export function preloadPublicLocales/)
  assert.match(i18n, /export async function changePublicLanguage/)
  assert.match(i18n, /load: "currentOnly"/)
  assert.match(main, /i18nReady/)
  assert.match(languageSwitcher, /preloadPublicLocales\(\)/)
  assert.match(languageSwitcher, /changePublicLanguage\(code\)/)
  assert.match(app, /readStoredLanguage\(\)/)
  assert.match(app, /changePublicLanguage\(lng, \{ persist: false \}\)/)
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
  assert.match(latency, /grid-cols-2/)
  assert.match(latency, /col-span-2/)
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

test("restores homepage scroll after leaving a server detail page", () => {
  const header = readFileSync(new URL("../src/components/Header.tsx", import.meta.url), "utf8")
  const overview = readFileSync(new URL("../src/components/ServerDetailOverview.tsx", import.meta.url), "utf8")
  const serverCard = readFileSync(new URL("../src/components/ServerCard.tsx", import.meta.url), "utf8")
  assert.match(serverPage, /restoreHomeScroll\(\)/)
  assert.match(serverPage, /saveHomeScroll\(\)/)
  assert.match(serverPage, /addEventListener\("scroll"/)
  assert.match(serverCard, /saveHomeScroll\(\)/)
  assert.match(header, /clearHomeScroll\(\)/)
  assert.match(overview, /navigate\("\/"\)/)
})

test("public PWA uses cover viewport and root safe-area insets", () => {
  const index = readFileSync(new URL("../index.html", import.meta.url), "utf8")
  const header = readFileSync(new URL("../src/components/Header.tsx", import.meta.url), "utf8")
  const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8")
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
  assert.match(index, /viewport-fit=cover/)
  assert.match(index, /lite-standalone/)
  assert.match(index, /apple-mobile-web-app-status-bar-style" content="black-translucent"/)
  assert.match(index, /rel="apple-touch-icon" href="\/apple-touch-icon\.png/)
  assert.match(css, /--safe-area-top: 0px/)
  assert.match(css, /display-mode: standalone/)
  assert.match(css, /html\.lite-standalone/)
  assert.match(css, /--safe-area-top: env\(safe-area-inset-top, 0px\)/)
  assert.match(header, /pt-\[var\(--safe-area-top\)\]/)
  assert.match(header, /backdrop-blur-sm/)
  assert.match(header, /bg-white\/96/)
  assert.match(app, /var\(--safe-area-bottom\)/)
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
  assert.match(websocket, /readLiveStatusCache/)
  assert.match(websocket, /writeLiveStatusCache/)
  assert.doesNotMatch(websocket, /messageHistory|HISTORY_LIMIT|needReconnect/)
  assert.match(liteApi, /public:getPingMetricStats/)
  assert.match(liteApi, /historyMaxPoints/)
  assert.match(serverPage, /refetchInterval: 5_000/)
  assert.doesNotMatch(serverPage, /max-\[620px\]:flex-col/)
})

test("drops unused public-dashboard leftovers", () => {
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
  const header = readFileSync(new URL("../src/components/Header.tsx", import.meta.url), "utf8")
  const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8")
  const chart = readFileSync(new URL("../src/components/ui/chart.tsx", import.meta.url), "utf8")
  const sortContext = readFileSync(new URL("../src/context/sort-context.ts", import.meta.url), "utf8")
  const formatInfo = readFileSync(new URL("../src/lib/utils.ts", import.meta.url), "utf8")
  assert.doesNotMatch(app, /RefreshToast/)
  assert.doesNotMatch(header, /RefreshToast|needReconnect/)
  assert.doesNotMatch(main, /url="\/api\/v1\/ws\/server"/)
  assert.doesNotMatch(chart, /ChartLegend/)
  assert.doesNotMatch(sortContext, /createContext|SortContext/)
  assert.doesNotMatch(formatInfo, /boot_time_string|gpu_info/)
  assert.equal(existsSync(new URL("../src/lib/theme-colors.ts", import.meta.url)), false)
})

test("shows a loader instead of a blank page while public settings load", () => {
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
  const loader = readFileSync(new URL("../src/components/loading/Loader.tsx", import.meta.url), "utf8")
  const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8")
  assert.match(app, /<Header \/>/)
  assert.match(app, /!settingData \? \(\s*<Loader visible \/>/)
  assert.match(app, /useLayoutEffect/)
  assert.doesNotMatch(app, /isCustomCodeInjected/)
  assert.doesNotMatch(app, /if \(!settingData\) \{\s*return null/)
  assert.doesNotMatch(app, /fullscreen/)
  assert.match(loader, /CircularProgress/)
  assert.match(loader, /size=\{44\}/)
  assert.match(loader, /#0E86DD/)
  assert.match(loader, /common\.loading/)
  assert.match(loader, /flex-1/)
  assert.doesNotMatch(loader, /fullscreen/)
  assert.doesNotMatch(loader, /min-h-dvh/)
  assert.doesNotMatch(css, /hamster-loading/)
  assert.doesNotMatch(loader, /hamster-spinner/)
})

test("keeps assigned ping tasks on the public monitor even without metric points", () => {
  assert.match(liteApi, /mergeAssignedPingMonitors/)
  assert.match(liteApi, /unionPingTasksForClient/)
  assert.match(liteApi, /seedAssignedHomeLatency/)
})

test("prefetches probe charts from homepage hover, press and visibility", () => {
  const latency = readFileSync(new URL("../src/components/ServerLatencySummary.tsx", import.meta.url), "utf8")
  const card = readFileSync(new URL("../src/components/ServerCard.tsx", import.meta.url), "utf8")
  const chart = readFileSync(new URL("../src/components/NetworkChart.tsx", import.meta.url), "utf8")
  const prefetch = readFileSync(new URL("../src/lib/prefetch-monitor.ts", import.meta.url), "utf8")
  assert.match(prefetch, /prefetchQuery/)
  assert.match(prefetch, /priority/)
  assert.match(prefetch, /MAX_IDLE_PREFETCH = 1/)
  assert.match(latency, /IntersectionObserver/)
  assert.match(latency, /onPointerEnter/)
  assert.match(latency, /onPointerDown/)
  assert.match(latency, /prefetchRef\.current\?\.\(false\)/)
  assert.match(card, /prefetchServerMonitor/)
  assert.match(card, /prefetchMonitor\(true\)/)
  assert.match(chart, /monitorQueryKey/)
  assert.match(chart, /readHomeLatencyCache/)
  assert.match(chart, /waitingForChart/)
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
    "common.loading",
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
