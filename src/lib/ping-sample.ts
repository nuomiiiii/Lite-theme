/**
 * Latency for one bucket. The API average is already the mean of successful samples;
 * a negative value is a failed probe. The whole bucket is empty only when every sample failed.
 */
export function successLatency(value: unknown, count: number, lossRatio?: number): number | null {
  const average = Number(value)
  if (!Number.isFinite(average) || average < 0) return null
  if (lossRatio !== undefined && Number.isFinite(lossRatio)) {
    const ratio = Math.min(1, Math.max(0, lossRatio))
    const samples = Number.isFinite(count) && count > 0 ? count : 1
    if (samples * (1 - ratio) <= 0) return null
  }
  return average
}

/** Window average weighted by successful samples, not by one vote per bucket. */
export function weightedSuccessDelay(
  points: Array<{ delay: number | null; count?: number | null; lossPercent?: number | null }>,
): number | null {
  let weight = 0
  let sum = 0
  for (const point of points) {
    if (point.delay === null || !Number.isFinite(point.delay)) continue
    const count = typeof point.count === "number" && Number.isFinite(point.count) && point.count > 0 ? point.count : 1
    const loss = typeof point.lossPercent === "number" && Number.isFinite(point.lossPercent) ? Math.min(100, Math.max(0, point.lossPercent)) : 0
    const valid = count * (1 - loss / 100)
    if (valid <= 0) continue
    sum += point.delay * valid
    weight += valid
  }
  return weight > 0 ? sum / weight : null
}
