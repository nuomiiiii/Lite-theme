export type ServerTagColor =
  | "ruby"
  | "gray"
  | "gold"
  | "bronze"
  | "brown"
  | "yellow"
  | "amber"
  | "orange"
  | "tomato"
  | "red"
  | "crimson"
  | "pink"
  | "plum"
  | "purple"
  | "violet"
  | "indigo"
  | "blue"
  | "cyan"
  | "teal"
  | "jade"
  | "green"
  | "grass"
  | "lime"
  | "mint"
  | "sky"

export interface ServerTag {
  text: string
  color: ServerTagColor
}

const TAG_COLOR_ORDER: ServerTagColor[] = [
  "ruby",
  "gray",
  "gold",
  "bronze",
  "brown",
  "yellow",
  "amber",
  "orange",
  "tomato",
  "red",
  "crimson",
  "pink",
  "plum",
  "purple",
  "violet",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "jade",
  "green",
  "grass",
  "lime",
  "mint",
  "sky",
]

const TAG_COLOR_SET = new Set<string>(TAG_COLOR_ORDER)
const TAG_CURRENCIES = ["CNY", "JPY", "USD", "EUR", "GBP", "HKD", "TWD", "KRW", "SGD", "CAD", "AUD"]
const TAG_COLOR_REMOVE = new RegExp(`<\\s*(${[...TAG_COLOR_ORDER, "iris"].join("|")})\\s*>`, "ig")
const TAG_CURRENCY_REMOVE = new RegExp(`<\\s*(${TAG_CURRENCIES.join("|")})\\s*>`, "ig")
const TAG_TRAFFIC_RESET_REMOVE = /<\s*TRD\s*:\s*\d{1,2}\s*>/ig
const NAMED_COLOR_PREFIX = new RegExp(`^(${[...TAG_COLOR_ORDER, "iris"].join("|")}):`, "i")

export const SERVER_TAG_TONE: Record<ServerTagColor, { bg: string; fg: string; darkBg: string; darkFg: string }> = {
  gray: { bg: "#F0F0F3", fg: "#60646C", darkBg: "#2A2D32", darkFg: "#B0B4BA" },
  gold: { bg: "#F9EDD1", fg: "#71624B", darkBg: "#2C2418", darkFg: "#CBB99F" },
  bronze: { bg: "#F5E8DD", fg: "#7D5E54", darkBg: "#2A221C", darkFg: "#C9B4A8" },
  brown: { bg: "#F5E8DC", fg: "#815C46", darkBg: "#2A211B", darkFg: "#CDB4A4" },
  yellow: { bg: "#FFF4BB", fg: "#9E6C00", darkBg: "#2C2500", darkFg: "#EFD34A" },
  amber: { bg: "#FFE8C6", fg: "#AD5700", darkBg: "#2C1D00", darkFg: "#FFCA16" },
  orange: { bg: "#FFE4D5", fg: "#CC4E00", darkBg: "#2C1608", darkFg: "#FFA057" },
  tomato: { bg: "#FFE6E2", fg: "#CA3214", darkBg: "#2D1613", darkFg: "#EC8E7B" },
  red: { bg: "#FFE5E5", fg: "#CE2C31", darkBg: "#2D1517", darkFg: "#FF9592" },
  ruby: { bg: "#FFE4EA", fg: "#CA244D", darkBg: "#2B1520", darkFg: "#F591B2" },
  crimson: { bg: "#FFE4ED", fg: "#D31E66", darkBg: "#2C1422", darkFg: "#F586B0" },
  pink: { bg: "#FCE4F0", fg: "#CF3897", darkBg: "#2B1324", darkFg: "#F277BA" },
  plum: { bg: "#F8E5F8", fg: "#953EA3", darkBg: "#271427", darkFg: "#D864D8" },
  purple: { bg: "#F3E7F9", fg: "#8145B5", darkBg: "#251427", darkFg: "#C767DC" },
  violet: { bg: "#EDE9FE", fg: "#6550B9", darkBg: "#1F1633", darkFg: "#AA8EFF" },
  indigo: { bg: "#E6EDFE", fg: "#3A5BC7", darkBg: "#15192D", darkFg: "#9EB1FF" },
  blue: { bg: "#E6F4FE", fg: "#0D74CE", darkBg: "#0D2136", darkFg: "#70B8FF" },
  cyan: { bg: "#E2F9FB", fg: "#0C7792", darkBg: "#082C32", darkFg: "#4CCCE6" },
  teal: { bg: "#E0F8F3", fg: "#0D7A6F", darkBg: "#0B2A26", darkFg: "#0BD8B6" },
  jade: { bg: "#E2F7ED", fg: "#208368", darkBg: "#0D271E", darkFg: "#1FD8A4" },
  green: { bg: "#E3F9E9", fg: "#218358", darkBg: "#0F291E", darkFg: "#3DD68C" },
  grass: { bg: "#E5F6E3", fg: "#2A7E3B", darkBg: "#142B18", darkFg: "#63C174" },
  lime: { bg: "#EBF7CB", fg: "#5C7C2F", darkBg: "#1B2710", darkFg: "#B1EE4B" },
  mint: { bg: "#E0F8F2", fg: "#027864", darkBg: "#092C26", darkFg: "#58D5BA" },
  sky: { bg: "#E1F6FD", fg: "#00749E", darkBg: "#0C2431", darkFg: "#74C7EC" },
}

function resolveTagColor(raw: string | null | undefined, index: number): ServerTagColor {
  const color = String(raw || "").trim().toLowerCase()
  const resolved = color === "iris" ? "blue" : color
  if (TAG_COLOR_SET.has(resolved)) return resolved as ServerTagColor
  return TAG_COLOR_ORDER[index % TAG_COLOR_ORDER.length]
}

function stripTagMetadata(part: string): { text: string; color: string | null } {
  const colorMatch = part.match(/<(\w+)>\s*$/i)
  let color = colorMatch ? colorMatch[1] : null
  let text = part.replace(TAG_COLOR_REMOVE, "").replace(TAG_CURRENCY_REMOVE, "").replace(TAG_TRAFFIC_RESET_REMOVE, "").trim()
  const prefix = text.match(NAMED_COLOR_PREFIX)
  if (!color && prefix) {
    color = prefix[1]
    text = text.slice(prefix[0].length).trim()
  }
  return { text, color }
}

function parseParts(source: string, delimiter: string): ServerTag[] {
  const tags: ServerTag[] = []
  for (const rawPart of source.split(delimiter)) {
    const part = rawPart.trim()
    if (!part) continue
    const parsed = stripTagMetadata(part)
    if (!parsed.text) continue
    tags.push({ text: parsed.text, color: resolveTagColor(parsed.color, tags.length) })
  }
  return tags
}

export function parseServerTags(tags?: string | null): ServerTag[] {
  if (!tags || !tags.trim()) return []
  return parseParts(tags, ";")
}

export function parsePlanExtraTags(extra?: string | null): ServerTag[] {
  if (!extra || !extra.trim()) return []
  return parseParts(extra, ",")
}

export function parseCardTags(input: { tags?: string | null; extra?: string | null }): ServerTag[] {
  const fromTags = parseServerTags(input.tags)
  if (fromTags.length > 0) return fromTags
  return parsePlanExtraTags(input.extra)
}
