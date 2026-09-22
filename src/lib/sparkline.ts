export function seriesPath(values: number[], width: number, height: number, padY = 18, padBottom = 24): { line: string; area: string } {
  if (values.length === 0) return { line: "", area: "" }
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const range = Math.max(1e-6, max - min)
  const plotBottom = height - padBottom
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width : (index / (values.length - 1)) * width
    const y = padY + (1 - (value - min) / range) * (plotBottom - padY)
    return { x, y }
  })
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")
  const last = points.at(-1)!
  const area = `${line} L${last.x.toFixed(1)} ${plotBottom} L0 ${plotBottom} Z`
  return { line, area }
}
