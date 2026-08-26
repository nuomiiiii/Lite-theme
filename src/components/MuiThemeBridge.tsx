import CssBaseline from "@mui/material/CssBaseline"
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles"
import { ReactNode, useEffect, useMemo, useState } from "react"

import { createLiteTheme } from "@/theme/createLiteTheme"

function readAppearance(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export default function MuiThemeBridge({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<"light" | "dark">(readAppearance)

  useEffect(() => {
    const observer = new MutationObserver(() => setAppearance(readAppearance()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const theme = useMemo(() => createLiteTheme(appearance), [appearance])

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  )
}
