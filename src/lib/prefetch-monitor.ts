import { fetchMonitor } from "@/lib/lite-api"
import type { QueryClient } from "@tanstack/react-query"

export const DEFAULT_MONITOR_HOURS = 1
export const MONITOR_STALE_TIME_MS = 20_000
const MAX_IDLE_PREFETCH = 1

let idleInflight = 0
const idleQueued = new Set<number>()
const idleQueue: number[] = []

export function monitorQueryKey(serverId: number, hours = DEFAULT_MONITOR_HOURS) {
  return ["monitor", serverId, hours] as const
}

function isFresh(queryClient: QueryClient, serverId: number, hours: number) {
  const state = queryClient.getQueryState(monitorQueryKey(serverId, hours))
  if (state?.fetchStatus === "fetching") return true
  if (state?.status !== "success") return false
  return Date.now() - (state.dataUpdatedAt || 0) < MONITOR_STALE_TIME_MS
}

function pumpIdleQueue(queryClient: QueryClient) {
  const hours = DEFAULT_MONITOR_HOURS
  while (idleInflight < MAX_IDLE_PREFETCH && idleQueue.length > 0) {
    const serverId = idleQueue.shift()
    if (serverId === undefined) return
    idleQueued.delete(serverId)
    if (isFresh(queryClient, serverId, hours)) continue
    idleInflight++
    void queryClient
      .prefetchQuery({
        queryKey: monitorQueryKey(serverId, hours),
        queryFn: () => fetchMonitor(serverId, hours),
        staleTime: MONITOR_STALE_TIME_MS,
      })
      .finally(() => {
        idleInflight = Math.max(0, idleInflight - 1)
        pumpIdleQueue(queryClient)
      })
  }
}

export function prefetchServerMonitor(
  queryClient: QueryClient,
  serverId: number,
  options?: { hours?: number; priority?: boolean },
) {
  if (!Number.isSafeInteger(serverId) || serverId < 0) return

  const hours = options?.hours ?? DEFAULT_MONITOR_HOURS
  const priority = options?.priority === true
  if (isFresh(queryClient, serverId, hours)) return

  if (priority) {
    void queryClient.prefetchQuery({
      queryKey: monitorQueryKey(serverId, hours),
      queryFn: () => fetchMonitor(serverId, hours),
      staleTime: MONITOR_STALE_TIME_MS,
    })
    return
  }

  if (idleQueued.has(serverId)) return
  idleQueued.add(serverId)
  idleQueue.push(serverId)
  pumpIdleQueue(queryClient)
}
