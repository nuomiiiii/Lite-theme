import i18n from "i18next"
import { initReactI18next } from "react-i18next"

export const PUBLIC_LANGUAGES = ["zh-CN", "zh-TW", "en-US", "ja-JP"] as const
export type PublicLanguage = (typeof PUBLIC_LANGUAGES)[number]
export const LANGUAGE_STORAGE_KEY = "language"

const localeLoaders: Record<PublicLanguage, () => Promise<{ default: Record<string, unknown> }>> = {
  "zh-CN": () => import("./locales/zh-CN/translation.json"),
  "zh-TW": () => import("./locales/zh-TW/translation.json"),
  "en-US": () => import("./locales/en/translation.json"),
  "ja-JP": () => import("./locales/ja/translation.json"),
}

const localeLoads = new Map<PublicLanguage, Promise<Record<string, unknown>>>()

export function resolvePublicLanguage(language?: string | null): PublicLanguage | "" {
  const raw = String(language || "")
    .trim()
    .replace(/_/g, "-")
  if (!raw) return ""
  if ((PUBLIC_LANGUAGES as readonly string[]).includes(raw)) return raw as PublicLanguage
  const lower = raw.toLowerCase()
  if (lower === "ja" || lower.startsWith("ja-")) return "ja-JP"
  if (lower === "zh" || lower.startsWith("zh-")) {
    return /(?:^|-)(?:tw|hk|mo|hant)(?:-|$)/i.test(raw) ? "zh-TW" : "zh-CN"
  }
  if (lower === "en" || lower.startsWith("en-")) return "en-US"
  return ""
}

export function readStoredLanguage(): PublicLanguage | "" {
  if (typeof window === "undefined") return ""
  try {
    return resolvePublicLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY))
  } catch {
    return ""
  }
}

function persistLanguage(lng: PublicLanguage) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng)
  } catch {
    // Private mode can block storage; the in-memory language still applies.
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng
  }
}

export async function loadPublicLocale(language: string) {
  const lng = resolvePublicLanguage(language) || "zh-CN"
  let pending = localeLoads.get(lng)
  if (!pending) {
    pending = localeLoaders[lng]().then((mod) => mod.default)
    localeLoads.set(lng, pending)
  }
  const data = await pending
  if (i18n.isInitialized) {
    i18n.addResourceBundle(lng, "translation", data, true, true)
  }
  return lng
}

export function preloadPublicLocales() {
  return Promise.all(PUBLIC_LANGUAGES.map((code) => loadPublicLocale(code)))
}

export async function changePublicLanguage(language: string, options?: { persist?: boolean }) {
  const lng = await loadPublicLocale(language)
  await i18n.changeLanguage(lng)
  if (options?.persist === false) {
    if (typeof document !== "undefined") document.documentElement.lang = lng
  } else {
    persistLanguage(lng)
  }
  return lng
}

const initialLng = readStoredLanguage() || "zh-CN"

export const i18nReady = loadPublicLocale(initialLng).then(async (lng) => {
  const data = await localeLoads.get(lng)
  if (typeof document !== "undefined") document.documentElement.lang = lng
  await i18n.use(initReactI18next).init({
    lng,
    fallbackLng: lng,
    supportedLngs: [...PUBLIC_LANGUAGES],
    resources: data ? { [lng]: { translation: data } } : undefined,
    partialBundledLanguages: true,
    load: "currentOnly",
    interpolation: {
      escapeValue: false,
    },
  })
})

export default i18n
