export type MeterTone = "green" | "amber" | "coral" | "empty"

export const METER_TONE_COLOR: Record<MeterTone, string> = {
  green: "#22B573",
  amber: "#F0A632",
  coral: "#FF6B5E",
  empty: "#7A8792",
}

export const PACKET_FILL_GREEN_MIN = 95
export const PACKET_FILL_AMBER_MIN = 80
export const RESOURCE_GREEN_MAX = 70
export const RESOURCE_AMBER_MAX = 90

export function packetFillTone(percent: number): MeterTone {
  if (!Number.isFinite(percent) || percent <= 0) return "empty"
  if (percent >= PACKET_FILL_GREEN_MIN) return "green"
  if (percent >= PACKET_FILL_AMBER_MIN) return "amber"
  return "coral"
}

export function resourceUsageTone(percent: number): MeterTone {
  if (!Number.isFinite(percent) || percent < 0) return "empty"
  if (percent >= RESOURCE_AMBER_MAX) return "coral"
  if (percent >= RESOURCE_GREEN_MAX) return "amber"
  return "green"
}
