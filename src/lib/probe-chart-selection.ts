export function nextActiveCharts(input: {
  chartDataKey: string[]
  initialChart?: string
  initializedSignature: string
  appliedInitial?: string
  previous: string[]
}): { charts: string[]; signature: string; appliedInitial?: string; skip: boolean } {
  const signature = input.chartDataKey.join("\u0000")
  if (!signature) {
    return { charts: input.previous, signature: input.initializedSignature, appliedInitial: input.appliedInitial, skip: true }
  }

  if (input.initialChart && input.chartDataKey.includes(input.initialChart) && input.appliedInitial !== input.initialChart) {
    return { charts: [input.initialChart], signature, appliedInitial: input.initialChart, skip: false }
  }

  if (input.initializedSignature === signature) {
    return { charts: input.previous, signature, appliedInitial: input.appliedInitial, skip: true }
  }

  if (!input.initializedSignature) {
    return { charts: [...input.chartDataKey], signature, appliedInitial: input.appliedInitial, skip: false }
  }

  const retained = input.previous.filter((chart) => input.chartDataKey.includes(chart))
  const additions = input.chartDataKey.filter((chart) => !input.previous.includes(chart))
  return {
    charts: retained.length > 0 ? [...retained, ...additions] : [...input.chartDataKey],
    signature,
    appliedInitial: input.appliedInitial,
    skip: false,
  }
}

export function monitorNameForId(records: Array<{ monitor_id: number; monitor_name: string }>, initialMonitorId?: number) {
  if (initialMonitorId === undefined) return undefined
  return records.find((monitor) => Number(monitor.monitor_id) === Number(initialMonitorId))?.monitor_name
}
