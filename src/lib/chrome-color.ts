export const LIGHT_CHROME_COLOR = "#FFFFFF"
export const DARK_CHROME_COLOR = "#141B21"

export function resolvedIsDark(theme: string): boolean {
  if (theme === "dark") return true
  if (theme === "light") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function chromeThemeColor(isDark: boolean): string {
  return isDark ? DARK_CHROME_COLOR : LIGHT_CHROME_COLOR
}

export function applyChromeThemeColor(isDark: boolean) {
  const color = chromeThemeColor(isDark)
  let meta = document.querySelector("meta[name=\"theme-color\"]")
  if (!meta) {
    meta = document.createElement("meta")
    meta.setAttribute("name", "theme-color")
    document.head.appendChild(meta)
  }
  meta.setAttribute("content", color)
}
