import GroupSwitch from "@/components/GroupSwitch"
import ServerCard from "@/components/ServerCard"
import ServerOverview from "@/components/ServerOverview"
import { Loader } from "@/components/loading/Loader"
import type { SortType } from "@/context/sort-context"
import { useStatus } from "@/hooks/use-status"
import { useWebSocketContext } from "@/hooks/use-websocket-context"
import { readHomeLatencyCache, writeHomeLatencyCache } from "@/lib/home-latency"
import { restoreHomeScroll, saveHomeScroll } from "@/lib/home-scroll"
import { fetchHomeLatency, fetchServerGroup } from "@/lib/lite-api"
import { readThemeHomeSort } from "@/lib/theme-home-sort"
import { formatLiteInfo, parseLiteWebsocketMessage } from "@/lib/utils"
import { ServerGroup } from "@/types/lite-api"
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

export default function Servers() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const { lastMessage, connected } = useWebSocketContext()
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
  const upSpeed = onlineOnly.reduce((total, server) => total + ((server.state?.net_out_speed || 0) / 1024 / 1024), 0)
  const downSpeed = onlineOnly.reduce((total, server) => total + ((server.state?.net_in_speed || 0) / 1024 / 1024), 0)
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

  return (
    <div className="mx-auto w-full">
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
      <section className="mb-4 mt-8 flex items-end justify-between gap-3 max-[620px]:mt-6" aria-label={t("home.filter")}>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2.5 max-[620px]:mb-2.5">
            <h2 className="m-0 text-[22px] font-semibold leading-none text-[#202A33] dark:text-[#EDF3F6] max-[620px]:text-xl">{t("home.allServers")}</h2>
            <span className="text-xs text-[#7A8792]">{t("home.serverCount", { count: filteredServers.length })}</span>
          </div>
          <GroupSwitch tabs={groupTabs} currentTab={currentGroup} setCurrentTab={handleGroupChange} />
        </div>
        <label className="relative inline-flex h-9 shrink-0 items-center">
          <select
            aria-label={t("home.sort")}
            value={sortType}
            onChange={(event) => setSortType(event.target.value as SortType)}
            className="h-9 appearance-none rounded-md border border-[#DDE4E9] bg-white py-0 pl-3.5 pr-9 text-sm leading-9 text-[#566571] dark:border-[#2D3943] dark:bg-[#1A2229] dark:text-[#B2C0C9]"
          >
            {SORT_OPTION_KEYS.map((option) => (
              <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm leading-none text-[#7A8792]" aria-hidden="true">⌄</span>
        </label>
      </section>
      <section className="grid grid-cols-1 items-start gap-3.5 min-[1121px]:grid-cols-2" aria-label="Server list">
        {filteredServers.map((serverInfo) => (
          <ServerCard
            now={websocketData.now}
            key={serverInfo.id}
            serverInfo={serverInfo}
            latencySummaries={serverInfo.uuid ? homeLatency[serverInfo.uuid] || [] : []}
          />
        ))}
      </section>
    </div>
  )
}
