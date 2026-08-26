import { SORT_ORDERS, SORT_TYPES, type SortOrder, type SortType } from "@/context/sort-context"

export const THEME_HOME_SORT_TYPES: SortType[] = ["default", "name", "uptime", "system", "cpu", "mem", "disk", "up", "down"]

function readWindowSetting(key: string): unknown {
  if (typeof window === "undefined") return undefined
  return (window as unknown as Record<string, unknown>)[key]
}

export function readThemeHomeSort(): { sortType: SortType; sortOrder: SortOrder } {
  const rawType = String(readWindowSetting("HomeSortType") || "").trim()
  const rawOrder = String(readWindowSetting("HomeSortOrder") || "").trim().toLowerCase()
  const sortType = THEME_HOME_SORT_TYPES.includes(rawType as SortType) && SORT_TYPES.includes(rawType as SortType)
    ? (rawType as SortType)
    : "default"
  const sortOrder = SORT_ORDERS.includes(rawOrder as SortOrder) ? (rawOrder as SortOrder) : "desc"
  return { sortType, sortOrder }
}
