export type TrafficSample = {
  t: number
  up: number
  down: number
}

const MAX_SAMPLES = 48
const MIN_SAMPLE_GAP_MS = 1000
const samples: TrafficSample[] = []

export function resetHomeTraffic(): void {
  samples.length = 0
}

export function recordHomeTraffic(upSpeed: number, downSpeed: number, now = Date.now()): TrafficSample[] {
  const last = samples.at(-1)
  if (!last) {
    samples.push({ t: now - MIN_SAMPLE_GAP_MS, up: upSpeed, down: downSpeed })
    samples.push({ t: now, up: upSpeed, down: downSpeed })
    return samples.slice()
  }
  if (now - last.t < MIN_SAMPLE_GAP_MS) {
    last.up = upSpeed
    last.down = downSpeed
    last.t = now
    return samples.slice()
  }
  samples.push({ t: now, up: upSpeed, down: downSpeed })
  if (samples.length > MAX_SAMPLES) samples.splice(0, samples.length - MAX_SAMPLES)
  return samples.slice()
}
