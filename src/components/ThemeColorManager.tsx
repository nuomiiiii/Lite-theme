import { useTheme } from "@/hooks/use-theme"
import { applyAppearanceChrome, resolvedAppearanceIsDark } from "@/lib/appearance-chrome"
import { useLayoutEffect } from "react"

export function ThemeColorManager() {
  const { theme } = useTheme()

  useLayoutEffect(() => {
    applyAppearanceChrome(resolvedAppearanceIsDark(theme))

    if (theme !== "system") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyAppearanceChrome(resolvedAppearanceIsDark(theme))
    mediaQuery.addEventListener("change", onChange)
    return () => mediaQuery.removeEventListener("change", onChange)
  }, [theme])

  return null
}
