import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useWebSocketContext } from "@/hooks/use-websocket-context"
import { formatBytes } from "@/lib/format"
import { HISTORY_TIME_OPTIONS, historyRefetchMs } from "@/lib/history-range"
import { fetchResourceHistory, type ResourceHistoryPoint } from "@/lib/lite-api"
import { clampPercent } from "@/lib/resource-history"
import { METER_TONE_COLOR, cpuCoreCount, resourceUsageTone } from "@/lib/meter-tone"
import { RESOURCE_COLORS, THEME } from "@/lib/theme-tokens"
import { calcTrafficUsed, cn, formatLiteInfo, parseLiteWebsocketMessage } from "@/lib/utils"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { MenuItem, Select } from "@mui/material"
import { ArrowDown, ArrowUp, BarChart3, CircleCheck, Cpu, HardDrive, MemoryStick } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"

import { ServerDetailChartLoading } from "./loading/ServerDetailLoading"

type ResourceKey = "cpu" | "memory" | "storage"

function formatChartTick(value: number, hours: number): string {
  const date = new Date(value)
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const time = `${date.getHours()}:${minutes}`
  if (hours <= 24) return time
  return `${date.getMonth() + 1}/${date.getDate()} ${time}`
}

function InfoCell({ label, value, accent, wrap }: { label: string; value: string; accent?: string; wrap?: boolean }) {
  return (
    <div className="min-w-0 border-b border-[#E9EEF1] py-[13px] dark:border-[#26313A] sm:[&:nth-last-child(-n+2)]:border-b-0">
      <p className="text-[11px] text-[#7A8792]">{label}</p>
      <strong className={cn("mt-[7px] block text-base font-semibold tabular-nums text-[#202A33] dark:text-[#EDF3F6]", wrap ? "whitespace-normal break-all leading-snug" : "truncate", accent)}>{value}</strong>
    </div>
  )
}

function ResourceRealtimeCard({
  icon: Icon,
  label,
  value,
  detail,
  percent,
  dataKey,
}: {
  icon: typeof Cpu
  label: string
  value: string
  detail: string
  percent: number
  dataKey: ResourceKey
}) {
  const barColor = METER_TONE_COLOR[resourceUsageTone(percent)]
  return (
    <article data-testid={`resource-realtime-${dataKey}`} className="min-w-0 overflow-hidden rounded-lg border border-[#DDE4E9] bg-white px-[22px] py-5 shadow-[0_6px_18px_rgba(32,42,51,0.035)] dark:border-[#2D3943] dark:bg-[#1A2229]">
      <p className="text-xs text-[#7A8792]">{label}</p>
      <div className="mt-2.5 flex min-w-0 items-center gap-3.5">
        <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-[#E8F4FC] text-[#0E86DD] dark:bg-[#12334A]">
          <Icon className="size-[21px]" />
        </span>
        <strong className="min-w-0 truncate text-[27px] font-semibold leading-none tabular-nums text-[#202A33] dark:text-[#EDF3F6]">{value}</strong>
        <p className="ml-auto min-w-0 max-w-[58%] truncate text-right text-[10px] leading-none text-[#7A8792]">{detail}</p>
      </div>
      <div className="mt-[15px] h-1.5 overflow-hidden rounded-[3px] bg-[#E8EDF0] dark:bg-[#2B3740]">
        <span className="block h-full rounded-[3px] transition-[width] duration-500" style={{ width: `${clampPercent(percent)}%`, background: barColor }} />
      </div>
    </article>
  )
}

function ResourceHistoryCard({
  label,
  dataKey,
  hours,
  chartData,
  isLoading,
}: {
  label: string
  dataKey: ResourceKey
  hours: number
  chartData: Array<Record<string, number | null>>
  isLoading: boolean
}) {
  const { t } = useTranslation()
  const color = RESOURCE_COLORS[dataKey]
  const hasChartData = chartData.some((point) => Number.isFinite(point[dataKey]))
  const chartConfig = { [dataKey]: { label, color } } satisfies ChartConfig

  return (
    <section data-testid={`resource-history-${dataKey}`} className="min-w-0 overflow-hidden rounded-lg border border-[#DDE4E9] bg-white shadow-[0_6px_18px_rgba(32,42,51,0.035)] dark:border-[#2D3943] dark:bg-[#1A2229]">
      <header className="flex min-h-[46px] items-center border-b border-[#E9EEF1] px-[18px] dark:border-[#26313A]">
        <h3 className="m-0 flex items-center gap-[9px] text-[15px] font-semibold text-[#202A33] dark:text-[#EDF3F6]">
          <span className="size-2 rounded-[2px]" style={{ backgroundColor: color }} />
          {label}
        </h3>
      </header>
      <div className="relative px-4 pb-4 pt-3">
        <div className="h-[278px] max-[620px]:h-[230px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ComposedChart data={chartData} margin={{ left: 4, right: 12, top: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={THEME.lineSoft} />
              <XAxis
                dataKey="timeStamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={64}
                tickFormatter={(tick) => formatChartTick(Number(tick), hours)}
              />
              <YAxis width={42} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
              <ChartTooltip
                isAnimationActive={false}
                defaultIndex={undefined}
                trigger="hover"
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(_, payload) => formatChartTick(Number(payload[0]?.payload?.timeStamp || 0), hours)}
                    formatter={(tooltipValue) => (
                      <div className="flex min-w-[110px] items-center justify-between gap-4">
                        <span className="text-[#7A8792]">{label}</span>
                        <strong className="font-medium tabular-nums">{Number(tooltipValue).toFixed(1)}%</strong>
                      </div>
                    )}
                  />
                }
              />
              <Area type="monotone" dataKey={dataKey} stroke="none" fill={color} fillOpacity={0.12} isAnimationActive={false} />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            </ComposedChart>
          </ChartContainer>
        </div>
        {!hasChartData && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[#7A8792]">
            {isLoading ? t("common.loading", { defaultValue: "加载中" }) : t("serverDetail.noHistory", { defaultValue: "暂无历史数据" })}
          </div>
        )}
      </div>
    </section>
  )
}

function TrafficStatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CircleCheck
  label: string
  value: string
  tone: "green" | "blue"
}) {
  const palette = tone === "green"
    ? "bg-[#E8F8EF] text-[#22B573] dark:bg-[#143C2B]"
    : "bg-[#E8F4FC] text-[#0E86DD] dark:bg-[#12334A]"
  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-[#E9EEF1] bg-white px-3.5 py-3 shadow-[0_4px_12px_rgba(32,42,51,0.04)] dark:border-[#26313A] dark:bg-[#171E24]">
      <div className="flex items-center gap-2">
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", palette)}>
          <Icon className="size-3.5" />
        </span>
        <span className="truncate text-[11px] text-[#7A8792]">{label}</span>
      </div>
      <strong className="mt-2 block truncate text-[18px] font-semibold tabular-nums text-[#202A33] dark:text-[#EDF3F6]">{value}</strong>
    </article>
  )
}

export default function ServerDetailChart({ server_id, show = true }: { server_id: number; show?: boolean }) {
  const { t } = useTranslation()
  const { lastMessage, connected } = useWebSocketContext()
  const [hours, setHours] = useState(1)

  const websocketData = parseLiteWebsocketMessage(lastMessage?.data)
  const server = websocketData?.servers.find((item) => item.id === server_id)
  const totals = {
    memTotal: server?.host.mem_total || 0,
    diskTotal: server?.host.disk_total || 0,
  }

  const { data: history = [], isPending } = useQuery({
    queryKey: ["resource-history", server_id, hours, totals.memTotal, totals.diskTotal],
    queryFn: () => fetchResourceHistory(server_id, hours, totals),
    enabled: show && !!server,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    refetchInterval: show ? historyRefetchMs(hours) : false,
    staleTime: 20_000,
  })

  const chartData = useMemo(() => {
    const points: ResourceHistoryPoint[] = [...history]
    if (server && websocketData) {
      const info = formatLiteInfo(websocketData.now, server)
      const latest = points.at(-1)
      if (!latest || latest.timeStamp !== websocketData.now) {
        points.push({ timeStamp: websocketData.now, cpu: info.cpu, memory: info.mem, storage: info.disk })
      }
    }
    return points
  }, [history, server, websocketData])

  if ((!connected && !lastMessage) || !websocketData || !server) return <ServerDetailChartLoading />

  const info = formatLiteInfo(websocketData.now, server)
  const trafficUsed = calcTrafficUsed(info.net_out_transfer, info.net_in_transfer, info.traffic_limit_type)
  const trafficRemaining = info.traffic_limit > 0 ? Math.max(0, info.traffic_limit - trafficUsed) : null
  const trafficPercent = info.traffic_limit > 0 ? clampPercent((trafficUsed / info.traffic_limit) * 100) : 0
  const uptime = info.uptime >= 86400
    ? `${Math.floor(info.uptime / 86400)} ${t("serverDetail.days")} ${Math.floor((info.uptime % 86400) / 3600)} ${t("serverDetail.hours")}`
    : `${Math.floor(info.uptime / 3600)} ${t("serverDetail.hours")}`
  const coreCount = cpuCoreCount(info.cpu_cores)

  return (
    <div className="space-y-4">
      <section aria-labelledby="resource-usage-title">
        <div className="mb-3 mt-1">
          <h2 id="resource-usage-title" className="m-0 flex items-center gap-[9px] text-[17px] font-semibold text-[#202A33] dark:text-[#EDF3F6]">
            <span className="size-[7px] rounded-full bg-[#22B573]" style={{ boxShadow: "0 0 0 3px #DDF7E8" }} />
            {t("serverDetail.usageStatistics", { defaultValue: "用量统计" })}
          </h2>
        </div>
        <div className="grid gap-4 min-[861px]:grid-cols-3">
          <ResourceRealtimeCard icon={Cpu} label="CPU" value={`${info.cpu.toFixed(1)}%`} detail={`${coreCount} ${t("serverDetail.cores", { defaultValue: "核心" })}`} percent={info.cpu} dataKey="cpu" />
          <ResourceRealtimeCard
            icon={MemoryStick}
            label={t("serverDetail.mem")}
            value={`${info.mem.toFixed(1)}%`}
            detail={`${formatBytes(server.state.mem_used)} / ${formatBytes(server.host.mem_total)}`}
            percent={info.mem}
            dataKey="memory"
          />
          <ResourceRealtimeCard
            icon={HardDrive}
            label={t("serverDetail.disk")}
            value={`${info.disk.toFixed(1)}%`}
            detail={`${formatBytes(server.state.disk_used)} / ${formatBytes(server.host.disk_total)}`}
            percent={info.disk}
            dataKey="storage"
          />
        </div>
      </section>

      <div className="grid items-stretch gap-4 min-[861px]:grid-cols-[.98fr_1.12fr]">
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#DDE4E9] bg-white shadow-[0_6px_18px_rgba(32,42,51,0.035)] dark:border-[#2D3943] dark:bg-[#1A2229]">
          <header className="flex min-h-[54px] items-center border-b border-[#E9EEF1] px-[18px] dark:border-[#26313A]">
            <h3 className="m-0 text-[15px] font-semibold">{t("serverDetail.trafficUsage", { defaultValue: "流量使用" })}</h3>
          </header>
          <div className="flex flex-1 flex-col justify-between gap-3 px-[18px] pb-[18px] pt-[18px]">
            <div className="grid grid-cols-2 gap-3">
              <TrafficStatCard
                icon={CircleCheck}
                tone="green"
                label={t("serverDetail.remaining", { defaultValue: "剩余" })}
                value={trafficRemaining === null ? "--" : formatBytes(trafficRemaining)}
              />
              <TrafficStatCard
                icon={BarChart3}
                tone="blue"
                label={t("serverDetail.used", { defaultValue: "已用" })}
                value={formatBytes(trafficUsed)}
              />
              <TrafficStatCard
                icon={ArrowUp}
                tone="green"
                label={t("serverDetail.outbound", { defaultValue: "出站" })}
                value={formatBytes(info.net_out_transfer)}
              />
              <TrafficStatCard
                icon={ArrowDown}
                tone="blue"
                label={t("serverDetail.inbound", { defaultValue: "入站" })}
                value={formatBytes(info.net_in_transfer)}
              />
            </div>
            <div data-testid="traffic-usage-progress" className="relative min-h-[72px] overflow-hidden rounded-lg border border-[#E9EEF1] bg-[#FBFCFD] dark:border-[#26313A] dark:bg-[#26313C]">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,rgba(7,141,238,0.08)_0%,rgba(7,141,238,0.16)_100%)] transition-[width] duration-300"
                style={{ width: info.traffic_limit > 0 ? `${trafficPercent}%` : 0 }}
              />
              <div className="relative z-[1] flex min-h-[72px] items-center justify-between gap-4 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-medium leading-snug text-[#919EAB]">{t("serverDetail.trafficUsageRate", { defaultValue: "流量使用率" })}</p>
                  <p className="mt-1 text-xs leading-snug text-[#637381]">
                    {info.traffic_limit > 0
                      ? `${formatBytes(trafficUsed)} / ${formatBytes(info.traffic_limit)}`
                      : t("serverDetail.unlimited", { defaultValue: "未设置限额" })}
                  </p>
                </div>
                <strong className="shrink-0 text-lg font-bold tabular-nums text-[#0E86DD]">
                  {info.traffic_limit > 0 ? `${trafficPercent.toFixed(2)}%` : "--"}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#DDE4E9] bg-white shadow-[0_6px_18px_rgba(32,42,51,0.035)] dark:border-[#2D3943] dark:bg-[#1A2229]">
          <header className="flex min-h-[54px] items-center border-b border-[#E9EEF1] px-[18px] dark:border-[#26313A]">
            <h3 className="m-0 text-[15px] font-semibold">{t("serverDetail.runtimeInfo", { defaultValue: "运行信息" })}</h3>
          </header>
          <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-x-6 px-[18px] pb-[18px] pt-[18px]">
            <InfoCell label={t("serverDetail.uptime")} value={uptime} />
            <InfoCell label={t("serverDetailChart.process")} value={String(info.process)} />
            <InfoCell label="TCP" value={String(info.tcp)} />
            <InfoCell label="UDP" value={String(info.udp)} />
            <InfoCell label={t("serverDetail.load", { defaultValue: "系统负载" })} value={`${info.load_1} / ${info.load_5} / ${info.load_15}`} />
            <InfoCell label={t("serverDetail.lastActive")} value={info.last_active_time_string || "--"} wrap />
          </div>
        </section>
      </div>

      <section aria-labelledby="resource-history-title">
        <header className="mb-3.5 flex min-h-8 items-center justify-between gap-4">
          <h2 id="resource-history-title" className="m-0 text-[17px] font-semibold text-[#202A33] dark:text-[#EDF3F6]">{t("serverDetail.resourceTrend", { defaultValue: "资源趋势" })}</h2>
          <Select
            size="small"
            value={String(hours)}
            onChange={(event) => setHours(Number(event.target.value))}
            aria-label={t("monitor.timeRange", { defaultValue: "时间范围" })}
            sx={{ width: 78, height: 32, fontSize: 12, borderRadius: "6px" }}
          >
            {HISTORY_TIME_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={String(option.value)}>{option.label}</MenuItem>
            ))}
          </Select>
        </header>
        <div className="grid grid-cols-1 gap-4 min-[861px]:grid-cols-3">
          <ResourceHistoryCard label="CPU" dataKey="cpu" hours={hours} chartData={chartData} isLoading={isPending} />
          <ResourceHistoryCard label={t("serverDetail.mem")} dataKey="memory" hours={hours} chartData={chartData} isLoading={isPending} />
          <ResourceHistoryCard label={t("serverDetail.disk")} dataKey="storage" hours={hours} chartData={chartData} isLoading={isPending} />
        </div>
      </section>
    </div>
  )
}
