// Pure helpers that tell apart two different reasons a latency line is broken:
//   - packet loss: the probe ran but got no reply (the backend stores value = -1), and
//   - a missing record: nothing was stored for that moment at all (the probe command never
//     reached the agent, or the result never came back).
// Timestamps are milliseconds, intervals are seconds (as returned by the ping task API).

/** A record counts as missing once the spacing exceeds this many task intervals. */
export const GAP_INTERVAL_FACTOR = 1.5

/** Y value (on the hidden 0..1 marker axis) of the invisible rows that carry the band hover text. */
export const GAP_ROW_Y = 0.04

const LOSS_LANE_BASE = 0.03
const LOSS_LANE_STEP = 0.045
const LOSS_LANE_MAX_HEIGHT = 0.2

/** Name of the row field holding a task's packet-loss lane position. */
export function lossLaneKey(key: string): string {
  return `loss__${key}`
}

/**
 * Y position (0..1 hidden axis) of a task's packet-loss lane. Every displayed task owns a lane,
 * the first task is the lowest, and the lanes share at most a fifth of the plot height.
 */
export function lossLaneY(index: number, count: number): number {
  const step = Math.min(LOSS_LANE_STEP, LOSS_LANE_MAX_HEIGHT / Math.max(1, count))
  return LOSS_LANE_BASE + index * step
}

export type PingGapPoint = { time: number; lost?: boolean }

export type PingGapSeries = {
  key: string
  /** Task interval in seconds. Missing or invalid values fall back to the observed spacing. */
  intervalSec?: number | null
  /** Downsampled bucket width in milliseconds. A coarser bucket must not be judged by a smaller guess. */
  bucketMs?: number | null
  points: PingGapPoint[]
}

export type TimeBand = { start: number; end: number }
export type LossMarker = { key: string; time: number }

type Span = [number, number]

function validTimes(points: PingGapPoint[]): number[] {
  return points
    .map((point) => point.time)
    .filter((time) => typeof time === "number" && Number.isFinite(time))
    .sort((a, b) => a - b)
}

function medianSpacing(times: number[]): number | null {
  const spacings: number[] = []
  for (let i = 1; i < times.length; i++) {
    const spacing = times[i] - times[i - 1]
    if (spacing > 0) spacings.push(spacing)
  }
  if (spacings.length === 0) return null
  spacings.sort((a, b) => a - b)
  const mid = Math.floor(spacings.length / 2)
  return spacings.length % 2 ? spacings[mid] : (spacings[mid - 1] + spacings[mid]) / 2
}

function expectedStepMs(series: PingGapSeries, times: number[], minStepMs: number): number | null {
  const fromInterval =
    typeof series.intervalSec === "number" && Number.isFinite(series.intervalSec) && series.intervalSec > 0
      ? series.intervalSec * 1000
      : null
  const observed = fromInterval ?? medianSpacing(times)
  const bucket = typeof series.bucketMs === "number" && Number.isFinite(series.bucketMs) && series.bucketMs > 0 ? series.bucketMs : 0
  const floor = Math.max(minStepMs > 0 ? minStepMs : 0, bucket)
  if (observed === null) return floor > 0 ? floor : null
  return Math.max(observed, floor)
}

function missingSpans(series: PingGapSeries, now: number, minStepMs: number): Span[] | null {
  const times = validTimes(series.points)
  if (times.length === 0) return null
  const step = expectedStepMs(series, times, minStepMs)
  const spans: Span[] = []
  if (step === null) return spans
  const limit = step * GAP_INTERVAL_FACTOR
  for (let i = 1; i < times.length; i++) {
    if (times[i] - times[i - 1] > limit) spans.push([times[i - 1], times[i]])
  }
  const last = times[times.length - 1]
  if (Number.isFinite(now) && now - last > limit) spans.push([last, now])
  return spans
}

function firstTime(series: PingGapSeries): number | null {
  const times = validTimes(series.points)
  return times.length > 0 ? times[0] : null
}

function spansContain(spans: Span[], time: number): boolean {
  return spans.some(([start, end]) => time > start && time < end)
}

function mergeSpans(spans: Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a[0] - b[0])
  const out: Span[] = []
  for (const span of sorted) {
    const last = out[out.length - 1]
    if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1])
    else out.push([span[0], span[1]])
  }
  return out
}

/**
 * Time ranges in which every task that has already started has no record.
 * A task counts only from its own earliest record: time before it appears is not evidence that
 * other tasks were fine, and a task with no records is ignored. A hole in only some of the
 * started tasks is not a band; that task's own line breaks there instead.
 *
 * `minStepMs` is an extra floor on the step. Prefer each series' `bucketMs` when the API
 * reported the real bucket width.
 */
export function computeMissingBands(
  series: PingGapSeries[],
  options: { now: number; minStepMs?: number },
): TimeBand[] {
  const minStepMs = Number.isFinite(options.minStepMs) && (options.minStepMs as number) > 0 ? (options.minStepMs as number) : 0
  const observed = series.flatMap((item) => {
    const spans = missingSpans(item, options.now, minStepMs)
    const start = firstTime(item)
    return spans === null || start === null ? [] : [{ spans, start }]
  })
  if (observed.length === 0) return []

  const cuts = new Set<number>()
  for (const row of observed) {
    cuts.add(row.start)
    for (const [start, end] of row.spans) {
      cuts.add(start)
      cuts.add(end)
    }
  }
  const points = [...cuts].filter((time) => Number.isFinite(time)).sort((a, b) => a - b)
  const pieces: Span[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]
    const end = points[i + 1]
    if (!(end > start)) continue
    const mid = (start + end) / 2
    const started = observed.filter((row) => row.start <= mid)
    if (started.length === 0) continue
    if (started.every((row) => spansContain(row.spans, mid))) pieces.push([start, end])
  }
  return mergeSpans(pieces).map(([start, end]) => ({ start, end }))
}

/** Missing ranges of one task, including a tail up to now. These break that task's line only. */
export function taskMissingBands(series: PingGapSeries, options: { now: number; minStepMs?: number }): TimeBand[] {
  const minStepMs = Number.isFinite(options.minStepMs) && (options.minStepMs as number) > 0 ? (options.minStepMs as number) : 0
  const spans = missingSpans(series, options.now, minStepMs)
  return (spans ?? []).map(([start, end]) => ({ start, end }))
}

/** Every record that is a packet loss (the probe ran, nothing came back), oldest first. */
export function lossMarkers(series: PingGapSeries[]): LossMarker[] {
  const markers: LossMarker[] = []
  for (const item of series) {
    for (const point of item.points) {
      if (point.lost && Number.isFinite(point.time)) markers.push({ key: item.key, time: point.time })
    }
  }
  return markers.sort((a, b) => a.time - b.time)
}

/**
 * Records received divided by records expected, between 0 and 1, or null when it cannot be told.
 * Expected counts the first record and every later slot that falls on or before windowEnd.
 * A downsampled point's time is the bucket start, so this is short by at most one task interval.
 */
export function sampleCompleteness(input: {
  records: number
  firstTime: number | null | undefined
  windowEnd: number
  intervalSec: number | null | undefined
}): number | null {
  const { records, firstTime, windowEnd, intervalSec } = input
  if (typeof intervalSec !== "number" || !Number.isFinite(intervalSec) || intervalSec <= 0) return null
  if (typeof firstTime !== "number" || !Number.isFinite(firstTime) || !Number.isFinite(windowEnd)) return null
  if (!Number.isFinite(records) || records < 0) return null
  if (windowEnd < firstTime) return records > 0 ? 1 : 0
  const expected = Math.floor((windowEnd - firstTime) / (intervalSec * 1000)) + 1
  return Math.min(1, records / Math.max(1, expected))
}

/** Keys of the tasks that have a packet-loss record exactly at `time`. Tasks without a record then are not listed. */
export function tasksLostAt(series: PingGapSeries[], time: number): string[] {
  if (!Number.isFinite(time)) return []
  return series.filter((item) => item.points.some((point) => point.time === time && point.lost)).map((item) => item.key)
}

export type PingTooltipLine = { kind: "no-record" } | { kind: "loss"; keys: string[] }

/**
 * What the hover tooltip shows at `time`: always the time label; inside a missing band only the
 * no-record line (no task values); outside, the tasks that lost a probe then (no line if none did).
 */
export function pingTooltipModel(input: {
  time: number
  bands: TimeBand[]
  series: PingGapSeries[]
  formatTime: (time: number) => string
}): { label: string; lines: PingTooltipLine[]; showValues: boolean } {
  const { time, bands, series, formatTime } = input
  const label = formatTime(time)
  if (bands.some((band) => time > band.start && time < band.end)) {
    return { label, lines: [{ kind: "no-record" }], showValues: false }
  }
  const keys = tasksLostAt(series, time)
  return { label, lines: keys.length > 0 ? [{ kind: "loss", keys }] : [], showValues: true }
}

export type NetworkHoverView = {
  label: string
  noRecord: boolean
  lossKeys: string[]
  values: { key: string; value: number }[]
}

/** Hover text for one chart time. Empty delay values still keep the time and the lost task names. */
export function networkHoverView(input: {
  time: number
  bands: TimeBand[]
  series: PingGapSeries[]
  values: { key: string; value: number | null | undefined }[]
  formatTime: (time: number) => string
}): NetworkHoverView {
  const model = pingTooltipModel(input)
  if (!model.showValues) return { label: model.label, noRecord: true, lossKeys: [], values: [] }
  const loss = model.lines.find((line): line is { kind: "loss"; keys: string[] } => line.kind === "loss")
  return {
    label: model.label,
    noRecord: false,
    lossKeys: loss?.keys ?? [],
    values: input.values.filter((item): item is { key: string; value: number } => typeof item.value === "number" && Number.isFinite(item.value)),
  }
}

const PEAK_WINDOW = 11
const PEAK_ALPHA = 0.3

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function peakCutValue(values: number[]): number | null {
  if (values.length === 0) return null
  const mid = median(values)
  const deviations = values.map((value) => Math.abs(value - mid))
  const medianDeviation = median(deviations) * 1.4826
  const valid = values.filter((value) => Math.abs(value - mid) <= 3 * medianDeviation && value <= mid * 3)
  if (valid.length === 0) return mid
  let ewma = valid[0]
  for (let i = 1; i < valid.length; i++) ewma = PEAK_ALPHA * valid[i] + (1 - PEAK_ALPHA) * ewma
  return ewma
}

/** Peak-cut a delay series. A null is a hard break: later values are not blended with earlier ones. */
export function peakCutDelayValues(values: Array<number | null>): Array<number | null> {
  const out = values.slice()
  let history: number | undefined
  for (let index = PEAK_WINDOW - 1; index < out.length; index++) {
    if (out[index] === null) {
      history = undefined
      continue
    }
    const window = out.slice(index - PEAK_WINDOW + 1, index + 1)
    if (window.some((value) => value === null)) {
      history = undefined
      continue
    }
    const processed = peakCutValue(window as number[])
    if (processed === null) continue
    history = history === undefined ? processed : PEAK_ALPHA * processed + (1 - PEAK_ALPHA) * history
    out[index] = history
  }
  return out
}

/**
 * One task's line points. A null is inserted inside each of that task's own missing ranges so the
 * line breaks there, without adding a point for any other task.
 */
export function taskLinePoints(
  points: Array<{ created_at: number; value: number | null }>,
  bands: TimeBand[],
  options?: { peak?: boolean },
): Array<{ created_at: number; value: number | null }> {
  const ordered = [...points]
    .filter((point) => Number.isFinite(point.created_at))
    .sort((a, b) => a.created_at - b.created_at)
  const groups: Array<Array<{ created_at: number; value: number | null }>> = []
  for (const point of ordered) {
    const current = groups[groups.length - 1]
    const previous = current?.[current.length - 1]
    const crosses = previous
      ? bands.some((band) => previous.created_at <= band.start && point.created_at >= band.end)
      : false
    if (!current || crosses) groups.push([point])
    else current.push(point)
  }
  const out: Array<{ created_at: number; value: number | null }> = []
  groups.forEach((group, index) => {
    if (index > 0) {
      const prev = groups[index - 1]
      const mid = Math.round((prev[prev.length - 1].created_at + group[0].created_at) / 2)
      out.push({ created_at: mid, value: null })
    }
    const values = options?.peak ? peakCutDelayValues(group.map((point) => point.value)) : group.map((point) => point.value)
    group.forEach((point, pointIndex) => out.push({ created_at: point.created_at, value: values[pointIndex] }))
  })
  return out
}

export const HOVER_ANCHOR_KEY = "hover_anchor"

export type ChartRow = { created_at: number; [key: string]: number | null | undefined }

/**
 * Adds what the chart needs on top of the plain latency rows (the input is not modified):
 *  - a per-task `loss__<key>` value on rows where that task lost a probe, so each task draws its
 *    losses on its own lane (`keys` is the displayed tasks, in legend order);
 *  - a few empty `gap_band` rows inside every missing band, so hovering the grey band has a row;
 *  - `hover_anchor` on every row so a time with no successful delay still has a tooltip target.
 */
export function decorateChartRows(
  rows: ChartRow[],
  options: { keys: string[]; markers: LossMarker[]; bands: TimeBand[] },
): ChartRow[] {
  const lanes = new Map(options.keys.map((key, index) => [key, lossLaneY(index, options.keys.length)]))
  const lossByTime = new Map<number, Array<[string, number]>>()
  for (const marker of options.markers) {
    const lane = lanes.get(marker.key)
    if (lane === undefined) continue
    const list = lossByTime.get(marker.time) || []
    list.push([lossLaneKey(marker.key), lane])
    lossByTime.set(marker.time, list)
  }
  const out: ChartRow[] = rows.map((row) => {
    const losses = lossByTime.get(row.created_at)
    return { ...(losses ? { ...row, ...Object.fromEntries(losses) } : row), [HOVER_ANCHOR_KEY]: 0 }
  })
  for (const band of options.bands) {
    for (let k = 1; k <= 3; k++) {
      const time = Math.round(band.start + ((band.end - band.start) * k) / 4)
      if (time > band.start && time < band.end) out.push({ created_at: time, gap_band: GAP_ROW_Y, [HOVER_ANCHOR_KEY]: 0 })
    }
  }
  return out.sort((a, b) => a.created_at - b.created_at)
}
