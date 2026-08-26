import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import enTranslation from "./locales/en/translation.json"
import jaTranslation from "./locales/ja/translation.json"
import zhCNTranslation from "./locales/zh-CN/translation.json"
import zhTWTranslation from "./locales/zh-TW/translation.json"

const PUBLIC_LANGUAGES = ["zh-CN", "zh-TW", "en-US", "ja-JP"]

const resources = {
  "en-US": {
    translation: enTranslation,
  },
  "zh-CN": {
    translation: zhCNTranslation,
  },
  "zh-TW": {
    translation: zhTWTranslation,
  },
  "ja-JP": {
    translation: jaTranslation,
  },
}

const getStoredLanguage = () => {
  const stored = localStorage.getItem("language") || "zh-CN"
  return PUBLIC_LANGUAGES.includes(stored) ? stored : "zh-CN"
}

i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLanguage(),
  fallbackLng: "zh-CN",
  supportedLngs: PUBLIC_LANGUAGES,
  interpolation: {
    escapeValue: false,
  },
})

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("language", lng)
})

export default i18n
