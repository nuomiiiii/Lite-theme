export const APPEARANCE_CHROME_LIGHT = "#FFFFFF"
export const APPEARANCE_CHROME_DARK = "#161C24"

export function appearanceChromeColor(isDark: boolean) {
  return isDark ? APPEARANCE_CHROME_DARK : APPEARANCE_CHROME_LIGHT
}

export function applyThemeColorMeta(color: string) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.remove())
  const meta = document.createElement("meta")
  meta.setAttribute("name", "theme-color")
  meta.setAttribute("content", color)
  document.head.appendChild(meta)
}

export function resolvedAppearanceIsDark(theme: "dark" | "light" | "system") {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  }
  return theme === "dark"
}

export function applyAppearanceChrome(isDark: boolean) {
  applyThemeColorMeta(appearanceChromeColor(isDark))
}
