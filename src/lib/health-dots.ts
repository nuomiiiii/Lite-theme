export const HOME_HEALTH_DOT_LIMIT = 24

export function healthStatusDots(servers: Array<{ online: boolean }>, limit = HOME_HEALTH_DOT_LIMIT): boolean[] {
  const total = servers.length
  if (total === 0) return []
  if (total <= limit) return servers.map((server) => server.online)

  const online = servers.reduce((count, server) => count + (server.online ? 1 : 0), 0)
  const offline = total - online
  let onlineDots = Math.round((online / total) * limit)
  if (online === 0) onlineDots = 0
  else if (offline === 0) onlineDots = limit
  else onlineDots = Math.min(limit - 1, Math.max(1, onlineDots))

  return [...Array(onlineDots).fill(true), ...Array(limit - onlineDots).fill(false)]
}
