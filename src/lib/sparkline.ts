export function sparklinePoints(values: Array<number | null>, width = 100, height = 24): string {
  const numeric = values.filter((value): value is number => value !== null && Number.isFinite(value))
  if (numeric.length === 0) return ""
  const low = Math.min(...numeric) - 3
  const high = Math.max(...numeric) + 3
  const range = Math.max(1, high - low)
  return values
    .map((value, index) => {
      const x = values.length <= 1 ? width : (index / (values.length - 1)) * width
      const y = value === null || !Number.isFinite(value) ? height - 3 : height - 3 - ((value - low) / range) * (height - 6)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
}

export function seriesPath(values: number[], width: number, height: number, padY = 18): { line: string; area: string } {
  if (values.length === 0) return { line: "", area: "" }
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const range = Math.max(1e-6, max - min)
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width : (index / (values.length - 1)) * width
    const y = padY + (1 - (value - min) / range) * (height - padY - 24)
    return { x, y }
  })
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")
  const last = points.at(-1)!
  const area = `${line} L${last.x.toFixed(1)} ${height - 24} L0 ${height - 24} Z`
  return { line, area }
}
