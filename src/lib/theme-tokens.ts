export const THEME = {
  ink: "#202A33",
  ink2: "#566571",
  muted: "#7A8792",
  blue: "#0E86DD",
  blueHover: "#0C76C4",
  blueSoft: "#E8F4FC",
  coral: "#FF6B5E",
  green: "#22B573",
  greenSoft: "#DDF7E8",
  page: "#F4F7F9",
  surface: "#FFFFFF",
  surfaceSoft: "#FBFCFD",
  line: "#DDE4E9",
  lineSoft: "#E9EEF1",
  barTrack: "#E8EDF0",
  disk: "#E4A029",
  darkPage: "#11171D",
  darkSurface: "#1A2229",
  darkSurfaceSoft: "#171E24",
  darkLine: "#2D3943",
  darkLineSoft: "#26313A",
  darkBlueSoft: "#12334A",
  darkGreenSoft: "#143C2B",
  darkBarTrack: "#2B3740",
  hero: "#202A33",
} as const

export const RESOURCE_COLORS = {
  cpu: THEME.blue,
  memory: THEME.coral,
  storage: THEME.disk,
} as const

export const PROBE_COLORS = [THEME.blue, THEME.green, THEME.coral, THEME.disk, "#8A56DE", "#74BEF0"] as const
