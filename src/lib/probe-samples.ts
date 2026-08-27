export function selectedTaskSampleCount(samples: number[]): number | null {
  let max = 0
  for (const sample of samples) {
    if (!Number.isFinite(sample) || sample <= 0) continue
    if (sample > max) max = sample
  }
  return max > 0 ? max : null
}
