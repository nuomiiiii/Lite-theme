import { ReactNode, createContext, useEffect, useState } from "react"

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
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(storageKey) as Theme) || "system")

  useEffect(() => {
    const root = window.document.documentElement

    const applyResolved = (isDark: boolean) => {
      root.classList.remove("light", "dark")
      root.classList.add(isDark ? "dark" : "light")
      applyAppearanceChrome(isDark)
    }

    applyResolved(resolvedAppearanceIsDark(theme))

    if (theme !== "system") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (event: MediaQueryListEvent) => applyResolved(event.matches)
    mediaQuery.addEventListener("change", onChange)
    return () => mediaQuery.removeEventListener("change", onChange)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>
}

export { ThemeProviderContext }
