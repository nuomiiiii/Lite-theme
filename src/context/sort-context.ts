export type SortType = "default" | "name" | "uptime" | "system" | "cpu" | "mem" | "disk" | "up" | "down" | "up total" | "down total"

export const SORT_TYPES: SortType[] = ["default", "name", "uptime", "system", "cpu", "mem", "disk", "up", "down", "up total", "down total"]

export type SortOrder = "asc" | "desc"

export const SORT_ORDERS: SortOrder[] = ["desc", "asc"]
