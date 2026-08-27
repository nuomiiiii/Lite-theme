export type ProbeTaskRank = {
  name: string
  currentDelay: number | null
  averageDelay?: number | null
  packetLoss: number | null
  availability: number | null
  healthy: boolean
}

function lossRank(value: number | null): number {
  return value === null || !Number.isFinite(value) ? Number.POSITIVE_INFINITY : value
}

function delayRank(value: number | null | undefined): number {
  return value === null || value === undefined || !Number.isFinite(value) ? Number.POSITIVE_INFINITY : value
}

export function pickBestProbeTask<T extends ProbeTaskRank>(summaries: T[]): T | undefined {
  return [...summaries]
    .filter((summary) => summary.healthy && summary.currentDelay !== null)
    .sort((left, right) => {
      const lossDelta = lossRank(left.packetLoss) - lossRank(right.packetLoss)
      if (lossDelta !== 0) return lossDelta
      return delayRank(left.currentDelay) - delayRank(right.currentDelay)
    })[0]
}
