import { alpha, createTheme } from "@mui/material/styles"

const GREY = {
  100: "#F9FAFB",
  200: "#F4F6F8",
  300: "#DFE3E8",
  400: "#C4CDD5",
  500: "#919EAB",
  600: "#637381",
  700: "#454F5B",
  800: "#1C252E",
  900: "#141A21",
}

const ACCENT = "#0E86DD"

export function createLiteTheme(mode: "light" | "dark") {
  const isLight = mode === "light"

  return createTheme({
    palette: {
      mode,
      primary: { main: ACCENT, contrastText: "#FFFFFF" },
      background: { default: isLight ? "#F4F7F9" : "#11171D", paper: isLight ? "#FFFFFF" : "#1A2229" },
      text: { primary: isLight ? GREY[800] : "#FFFFFF", secondary: isLight ? GREY[600] : GREY[400] },
      divider: alpha(GREY[500], isLight ? 0.2 : 0.24),
      action: { hover: alpha(GREY[500], 0.08), selected: alpha(ACCENT, isLight ? 0.08 : 0.16) },
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: '"Public Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      button: { textTransform: "none", fontWeight: 600, fontSize: 14 },
      body1: { fontSize: 15, lineHeight: 1.6, letterSpacing: 0 },
      body2: { fontSize: 14, lineHeight: 1.55, letterSpacing: 0 },
      caption: { fontSize: 13, lineHeight: 1.45, letterSpacing: 0 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isLight ? "#F4F7F9" : "#11171D",
            color: isLight ? GREY[800] : "#FFFFFF",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { minWidth: 0, borderRadius: 8, fontWeight: 600 },
          sizeSmall: { minHeight: 32, paddingLeft: 12, paddingRight: 12 },
          sizeMedium: { minHeight: 38, paddingLeft: 14, paddingRight: 14 },
          contained: {
            backgroundColor: ACCENT,
            color: "#FFFFFF",
            "&:hover": { backgroundColor: "#0C76C4" },
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { borderRadius: 8, border: `1px solid ${alpha(GREY[500], isLight ? 0.2 : 0.24)}` } },
      },
      MuiPaper: { styleOverrides: { rounded: { borderRadius: 8 } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: isLight ? GREY[200] : alpha("#FFFFFF", 0.06),
            transition: "background-color 180ms ease, box-shadow 180ms ease",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha(GREY[500], isLight ? 0.2 : 0.32) },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: alpha(GREY[500], isLight ? 0.4 : 0.48) },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: ACCENT, borderWidth: 1 },
            "&.Mui-focused": { boxShadow: `0 0 0 3px ${alpha(ACCENT, isLight ? 0.1 : 0.16)}` },
          },
        },
      },
      MuiMenu: {
        defaultProps: { transitionDuration: { enter: 180, exit: 120 } },
        styleOverrides: {
          paper: {
            borderRadius: 8,
            padding: 4,
            border: `1px solid ${alpha(GREY[500], isLight ? 0.2 : 0.24)}`,
            backgroundImage: "none",
          },
        },
      },
      MuiMenuItem: { styleOverrides: { root: { minHeight: 38, borderRadius: 8 } } },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 48,
            paddingLeft: 4,
            paddingRight: 4,
            marginRight: 28,
            textTransform: "none",
            fontSize: 14,
            fontWeight: 500,
            color: isLight ? GREY[600] : GREY[400],
            "&.Mui-selected": { color: isLight ? GREY[800] : "#FFFFFF", fontWeight: 600 },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 6, fontWeight: 500 } } },
      MuiSwitch: {
        styleOverrides: {
          root: { width: 38, height: 22, padding: 0 },
          switchBase: {
            padding: 3,
            "&.Mui-checked": { transform: "translateX(16px)", color: "#FFFFFF", "+ .MuiSwitch-track": { backgroundColor: ACCENT, opacity: 1 } },
          },
          thumb: { width: 16, height: 16 },
          track: { borderRadius: 11, backgroundColor: isLight ? GREY[400] : GREY[600], opacity: 1 },
        },
      },
    },
  })
}
