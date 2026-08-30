"use client"

import { applyChromeThemeColor, resolvedIsDark } from "@/lib/chrome-color"
import { useTheme } from "@/hooks/use-theme"
import { useEffect } from "react"

export function ThemeColorManager() {
  const { theme } = useTheme()

  useEffect(() => {
    const updateThemeColor = () => {
      applyChromeThemeColor(resolvedIsDark(theme))
    }

    updateThemeColor()
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", updateThemeColor)
    return () => mediaQuery.removeEventListener("change", updateThemeColor)
  }, [theme])

  return null
}
