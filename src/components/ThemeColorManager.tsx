"use client"

import { useTheme } from "@/hooks/use-theme"
import { applyAppearanceChrome, resolvedAppearanceIsDark } from "@/lib/appearance-chrome"
import { useEffect } from "react"

export function ThemeColorManager() {
  const { theme } = useTheme()

  useEffect(() => {
    const updateThemeColor = () => applyAppearanceChrome(resolvedAppearanceIsDark(theme))

    updateThemeColor()

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", updateThemeColor)

    return () => mediaQuery.removeEventListener("change", updateThemeColor)
  }, [theme])

  return null
}
