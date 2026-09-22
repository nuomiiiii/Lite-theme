import GroupSwitch from "@/components/GroupSwitch"
import ServerCard from "@/components/ServerCard"
import ServerOverview from "@/components/ServerOverview"
import { Loader } from "@/components/loading/Loader"
import type { SortType } from "@/context/sort-context"
import { useStatus } from "@/hooks/use-status"
import { useWebSocketContext } from "@/hooks/use-websocket-context"
import { HOME_LATENCY_CARD_LIMIT, homeCardColumnCount, homeProbeShouldStack, readHomeLatencyCache, writeHomeLatencyCache } from "@/lib/home-latency"
import { restoreHomeScroll, saveHomeScroll } from "@/lib/home-scroll"
import { fetchHomeLatency, fetchServerGroup } from "@/lib/lite-api"
import { readThemeHomeSort } from "@/lib/theme-home-sort"
import { cn, formatLiteInfo, parseLiteWebsocketMessage } from "@/lib/utils"
import { ServerGroup } from "@/types/lite-api"
import { MenuItem, Select } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

function homeLatencyStorage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

const SORT_OPTION_KEYS: Array<{ value: SortType; labelKey: string }> = [
  { value: "default", labelKey: "home.sortDefault" },
  { value: "name", labelKey: "home.sortName" },
  { value: "cpu", labelKey: "home.sortLoad" },
  { value: "up", labelKey: "home.sortUpload" },
  { value: "down", labelKey: "home.sortDownload" },
]

function useHomeCardColumns() {
  const [columns, setColumns] = useState(() => (typeof window === "undefined" ? 1 : homeCardColumnCount(window.innerWidth)))
  useLayoutEffect(() => {
    const update = () => setColumns(homeCardColumnCount(window.innerWidth))
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  return columns
}

function formatClock(value: number) {
  const date = new Date(value > 1e12 ? value : value * 1000)
  if (!Number.isFinite(date.getTime())) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${year}.${month}.${day} · ${hours}:${minutes}:${seconds}`
}

export default function Servers() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const { lastMessage, connected } = useWebSocketContext()
  const cardColumns = useHomeCardColumns()
  const [currentGroup, setCurrentGroup] = useState("All")
  const themeSort = readThemeHomeSort()
  const [sortType, setSortType] = useState<SortType>(themeSort.sortType)
  const sortOrder = themeSort.sortOrder
  const { data: groupData } = useQuery({
    queryKey: ["server-group"],
    queryFn: () => fetchServerGroup(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
  const websocketData = parseLiteWebsocketMessage(lastMessage?.data)
  const latencyEntityKey = useMemo(
    () =>
      (websocketData?.servers || [])
        .map((server) => server.uuid)
        .filter((uuid): uuid is string => Boolean(uuid))
        .sort()
        .join(","),
    [websocketData?.servers],
  )
  const latencyEntityIds = latencyEntityKey ? latencyEntityKey.split(",") : []
  const { data: homeLatency = {} } = useQuery({
    queryKey: ["home-latency", latencyEntityKey],
    queryFn: async () => {
      const data = await fetchHomeLatency(latencyEntityIds)
      writeHomeLatencyCache(homeLatencyStorage(), data)
      return data
    },
    placeholderData: () => readHomeLatencyCache(homeLatencyStorage(), latencyEntityIds),
    enabled: latencyEntityIds.length > 0,
    staleTime: 5_000,
    refetchInterval: 5_000,
    refetchOnWindowFocus: false,
  })

  useLayoutEffect(() => {
    restoreHomeScroll()
    const timers = [50, 120, 250].map((ms) => window.setTimeout(() => restoreHomeScroll(), ms))
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [])

  useEffect(() => {
    setCurrentGroup(sessionStorage.getItem("selectedGroup") || "All")
  }, [])

  useEffect(() => {
    let ticking = false
    let armed = false
    const armTimer = window.setTimeout(() => {
      armed = true
    }, 300)
    const persist = () => {
      ticking = false
      if (!armed) return
      saveHomeScroll()
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(persist)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      armed = false
      window.clearTimeout(armTimer)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  const handleGroupChange = (group: string) => {
    setCurrentGroup(group)
    sessionStorage.setItem("selectedGroup", group)
  }

  if (!connected && !lastMessage) {
    return <Loader visible />
  }

  if (!websocketData) {
    return <p className="py-20 text-center text-sm text-muted-foreground">{t("info.processing")}</p>
  }

  const groupTabs = [
    "All",
    ...(groupData?.data
      ?.filter((item: ServerGroup) => item.servers?.some((serverId) => websocketData.servers.some((server) => server.id === serverId)))
      .map((item: ServerGroup) => item.group.name) || []),
  ]
  const groupedServers = websocketData.servers.filter((server) => {
    if (currentGroup === "All") return true
    return groupData?.data?.some((group: ServerGroup) => group.group.name === currentGroup && group.servers?.includes(server.id))
  })
  const totalServers = groupedServers.length
  const onlineServers = groupedServers.filter((server) => formatLiteInfo(websocketData.now, server).online).length
  const offlineServers = totalServers - onlineServers
  const onlineOnly = groupedServers.filter((server) => formatLiteInfo(websocketData.now, server).online)
  const up = onlineOnly.reduce((total, server) => total + (server.state?.net_out_transfer || 0), 0)
  const down = onlineOnly.reduce((total, server) => total + (server.state?.net_in_transfer || 0), 0)
  const upSpeed = onlineOnly.reduce((total, server) => total + ((server.state?.net_out_speed || 0) / 1000 / 1000), 0)
  const downSpeed = onlineOnly.reduce((total, server) => total + ((server.state?.net_in_speed || 0) / 1000 / 1000), 0)
  const regionServers = groupedServers.map((server) => {
    const info = formatLiteInfo(websocketData.now, server)
    return { country_code: info.country_code, online: info.online }
  })
  const statusFiltered =
    status === "all"
      ? groupedServers
      : groupedServers.filter((server) => (formatLiteInfo(websocketData.now, server).online ? "online" : "offline") === status)
  const filteredServers = [...statusFiltered].sort((a, b) => {
    const aInfo = formatLiteInfo(websocketData.now, a)
    const bInfo = formatLiteInfo(websocketData.now, b)
    if (sortType !== "name" && aInfo.online !== bInfo.online) return aInfo.online ? -1 : 1

    let comparison = 0
    switch (sortType) {
      case "name": comparison = a.name.localeCompare(b.name); break
      case "uptime": comparison = (a.state?.uptime || 0) - (b.state?.uptime || 0); break
      case "system": comparison = a.host.platform.localeCompare(b.host.platform); break
      case "cpu": comparison = (a.state?.cpu || 0) - (b.state?.cpu || 0); break
      case "mem": comparison = aInfo.mem - bInfo.mem; break
      case "disk": comparison = aInfo.disk - bInfo.disk; break
      case "up": comparison = (a.state?.net_out_speed || 0) - (b.state?.net_out_speed || 0); break
      case "down": comparison = (a.state?.net_in_speed || 0) - (b.state?.net_in_speed || 0); break
      default: comparison = (a.display_index || 0) - (b.display_index || 0)
    }
    return sortOrder === "asc" ? comparison : -comparison
  })
  const probeCounts = filteredServers.map((server) => Math.min(HOME_LATENCY_CARD_LIMIT, (server.uuid ? homeLatency[server.uuid] || [] : []).length))
  const stackLatencyProbes = probeCounts.map((_, index) => homeProbeShouldStack(probeCounts, index, cardColumns))

  return (
    <div className="mx-auto w-full">
      <div className="mb-6 flex items-end justify-between gap-3 max-[967px]:mb-4">
        <div>
          <span className="text-[9px] font-medium tracking-[1.6px] text-[#919EAB]">{t("home.eyebrow")}</span>
          <h1 className="mt-1.5 text-[27px] font-semibold leading-tight tracking-tight text-[#1C252E] dark:text-white max-[967px]:text-[23px]">{t("home.title")}</h1>
        </div>
        <span className="flex items-center gap-1.5 pb-1 text-[11px] text-[#637381] max-[967px]:text-[9px]">
          <i className={`size-1.5 rounded-full ${connected ? "bg-[#22C55E]" : "bg-[#FF5630]"}`} />
          {connected ? t("home.liveUpdate") : t("serverOverview.disconnected")}
          {websocketData.now ? <span className="ml-4 text-[#919EAB] max-[1439px]:hidden">{formatClock(websocketData.now)}</span> : null}
        </span>
      </div>
      <ServerOverview
        total={totalServers}
        online={onlineServers}
        offline={offlineServers}
        up={up}
        down={down}
        upSpeed={upSpeed}
        downSpeed={downSpeed}
        now={websocketData.now}
        servers={regionServers}
      />
      <section className="mb-4 mt-6 flex items-center justify-between gap-3 max-[967px]:mt-4 max-[967px]:grid max-[967px]:grid-cols-[minmax(0,1fr)_auto] max-[967px]:items-center max-[967px]:gap-x-2.5 max-[967px]:gap-y-2.5" aria-label={t("home.filter")}>
        <div className="flex min-w-0 items-center gap-3 max-[967px]:contents">
          <div className="flex items-end gap-2.5 max-[967px]:col-start-1 max-[967px]:row-start-1">
            <h2 className="m-0 text-lg font-semibold leading-none text-[#1C252E] dark:text-white">{t("home.allServers")}</h2>
            <span className="text-[11px] leading-none text-[#919EAB]">{t("home.serverCount", { count: filteredServers.length })}</span>
          </div>
          <div className="min-w-0 max-[967px]:col-span-2 max-[967px]:row-start-2">
            <GroupSwitch tabs={groupTabs} currentTab={currentGroup} setCurrentTab={handleGroupChange} />
          </div>
        </div>
        <Select
          size="small"
          value={sortType}
          onChange={(event) => setSortType(event.target.value as SortType)}
          aria-label={t("home.sort")}
          sx={{ minWidth: 112, height: 32, fontSize: 11, flexShrink: 0, ".MuiSelect-select": { py: 0.75 } }}
        >
          {SORT_OPTION_KEYS.map((option) => (
            <MenuItem key={option.value} value={option.value}>{t(option.labelKey)}</MenuItem>
          ))}
        </Select>
      </section>
      <section
        className={cn(
          "grid items-stretch gap-4",
          cardColumns === 4 ? "grid-cols-4" : cardColumns === 3 ? "grid-cols-3" : cardColumns === 2 ? "grid-cols-2" : "grid-cols-1",
        )}
        aria-label="Server list"
      >
        {filteredServers.map((serverInfo, index) => (
          <ServerCard
            now={websocketData.now}
            key={serverInfo.id}
            serverInfo={serverInfo}
            latencySummaries={serverInfo.uuid ? homeLatency[serverInfo.uuid] || [] : []}
            stackLatencyProbes={stackLatencyProbes[index]}
          />
        ))}
      </section>
    </div>
  )
}
