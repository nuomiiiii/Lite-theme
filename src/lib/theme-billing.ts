import dayjs from "dayjs"

export function resolveThemeBillingStartDate(
  server?: { expired_at?: string; billing_cycle?: number; created_at?: string } | null,
  existingStartDate?: string | null,
): string | null {
  if (existingStartDate) return existingStartDate
  const expiredRaw = server?.expired_at || ""
  const bc = Number(server?.billing_cycle || 0)
  if (!expiredRaw || !bc) return null
  const start = dayjs(expiredRaw).subtract(bc, "day")
  if (!start.isValid() || start.year() < 2) return null
  return start.toISOString()
}
