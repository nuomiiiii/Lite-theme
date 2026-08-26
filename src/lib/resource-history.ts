export type ResourceTotals = {
  memTotal: number
  diskTotal: number
}

export type ResourceSample = {
  time: number
  value: number
}

export type ResourceHistoryPoint = {
  timeStamp: number
  cpu: number | null
  memory: number | null
  storage: number | null
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))
}

export function usagePercent(used: number, total: number): number | null {
  if (!Number.isFinite(used) || used < 0) return null
  if (!Number.isFinite(total) || total <= 0) {
    return used <= 100 ? clampPercent(used) : null
  }
  return clampPercent((used / total) * 100)
}

function sampleMap(samples: ResourceSample[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const sample of samples) {
    if (!Number.isFinite(sample.time) || !Number.isFinite(sample.value)) continue
    map.set(sample.time, sample.value)
  }
  return map
}

export function mergeResourceSeries(
  cpu: ResourceSample[],
  memoryUsed: ResourceSample[],
  diskUsed: ResourceSample[],
  totals: ResourceTotals,
): ResourceHistoryPoint[] {
  const cpuMap = sampleMap(cpu)
  const memoryMap = sampleMap(memoryUsed)
  const diskMap = sampleMap(diskUsed)
  const times = [...new Set([...cpuMap.keys(), ...memoryMap.keys(), ...diskMap.keys()])].sort((a, b) => a - b)

  return times.map((timeStamp) => {
    const cpuValue = cpuMap.get(timeStamp)
    const memoryValue = memoryMap.get(timeStamp)
    const diskValue = diskMap.get(timeStamp)
    return {
      timeStamp,
      cpu: cpuValue === undefined ? null : clampPercent(cpuValue),
      memory: memoryValue === undefined ? null : usagePercent(memoryValue, totals.memTotal),
      storage: diskValue === undefined ? null : usagePercent(diskValue, totals.diskTotal),
    }
  })
}
