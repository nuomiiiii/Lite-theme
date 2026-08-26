export function formatBytes(bytes: number, decimals: number = 2) {
  if (!+bytes) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function formatSpeed(megabytesPerSecond: number): string {
  if (megabytesPerSecond >= 1024) return `${(megabytesPerSecond / 1024).toFixed(2)} G/s`
  if (megabytesPerSecond >= 1) return `${megabytesPerSecond.toFixed(2)} M/s`
  return `${(megabytesPerSecond * 1024).toFixed(2)} K/s`
}
