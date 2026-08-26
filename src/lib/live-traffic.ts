export type TrafficSample = {
  t: number
  up: number
  down: number
}

const MAX_SAMPLES = 48
const samples: TrafficSample[] = []

export function recordHomeTraffic(upSpeed: number, downSpeed: number, now = Date.now()): TrafficSample[] {
  const last = samples.at(-1)
  if (last && now - last.t < 3500) {
    last.up = upSpeed
    last.down = downSpeed
    last.t = now
    return samples.slice()
  }
  samples.push({ t: now, up: upSpeed, down: downSpeed })
  if (samples.length > MAX_SAMPLES) samples.splice(0, samples.length - MAX_SAMPLES)
  return samples.slice()
}
