const ASIA = new Set([
  "CN", "TW", "HK", "MO", "JP", "KR", "KP", "MN", "SG", "MY", "TH", "VN", "ID", "PH", "IN", "PK",
  "BD", "KH", "LA", "MM", "BN", "NP", "LK", "BT", "MV", "KZ", "UZ", "KG", "TJ", "TM", "AF", "IR",
  "IQ", "SA", "AE", "QA", "KW", "BH", "OM", "YE", "IL", "JO", "LB", "SY", "TR", "AM", "AZ", "GE",
])

const EUROPE = new Set([
  "GB", "IE", "FR", "DE", "NL", "BE", "LU", "CH", "AT", "IT", "ES", "PT", "SE", "NO", "DK", "FI",
  "IS", "PL", "CZ", "SK", "HU", "RO", "BG", "GR", "HR", "SI", "RS", "BA", "ME", "MK", "AL", "EE",
  "LV", "LT", "UA", "BY", "MD", "RU",
])

const AMERICA = new Set([
  "US", "CA", "MX", "GT", "HN", "SV", "NI", "CR", "PA", "CU", "DO", "PR", "JM", "TT", "BR", "AR",
  "CL", "CO", "PE", "VE", "EC", "BO", "PY", "UY", "GY", "SR",
])

const OCEANIA = new Set(["AU", "NZ", "PG", "FJ", "NC", "PF", "GU", "WS", "TO"])

export type RegionStat = {
  label: RegionKey
  online: number
  total: number
}

export type RegionKey = "asia" | "europe" | "america" | "oceania" | "other"

export function continentLabel(countryCode: string): RegionKey {
  const code = countryCode.trim().toUpperCase()
  if (!code) return "other"
  if (ASIA.has(code)) return "asia"
  if (EUROPE.has(code)) return "europe"
  if (AMERICA.has(code)) return "america"
  if (OCEANIA.has(code)) return "oceania"
  return "other"
}

export function regionStats(servers: Array<{ country_code?: string; online: boolean }>): RegionStat[] {
  const buckets = new Map<string, { online: number; total: number }>()
  for (const server of servers) {
    const label = continentLabel(server.country_code || "")
    const bucket = buckets.get(label) || { online: 0, total: 0 }
    bucket.total += 1
    if (server.online) bucket.online += 1
    buckets.set(label, bucket)
  }
  const order: RegionKey[] = ["asia", "europe", "america", "oceania", "other"]
  return order
    .filter((label) => buckets.has(label))
    .map((label) => ({ label, ...buckets.get(label)! }))
}

export function regionTone(stat: RegionStat): "green" | "amber" | "coral" {
  if (stat.total === 0 || stat.online === stat.total) return "green"
  if (stat.online === 0) return "coral"
  return "amber"
}
