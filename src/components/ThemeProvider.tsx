import { ReactNode, createContext, useLayoutEffect, useState } from "react"
import { flushSync } from "react-dom"

import { applyAppearanceChrome, resolvedAppearanceIsDark } from "@/lib/appearance-chrome"

export type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({ children, storageKey = "vite-ui-theme" }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem(storageKey) as Theme) || "system")

  useLayoutEffect(() => {
    applyAppearanceChrome(resolvedAppearanceIsDark(theme))

    if (theme !== "system") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (event: MediaQueryListEvent) => applyAppearanceChrome(event.matches)
    mediaQuery.addEventListener("change", onChange)
    return () => mediaQuery.removeEventListener("change", onChange)
  }, [theme])

  const value = {
    theme,
    setTheme: (next: Theme) => {
      localStorage.setItem(storageKey, next)
      applyAppearanceChrome(resolvedAppearanceIsDark(next))
      flushSync(() => setThemeState(next))
    },
  }

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>
}

export { ThemeProviderContext }
