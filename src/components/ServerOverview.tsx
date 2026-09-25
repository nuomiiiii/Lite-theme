import { useStatus } from "@/hooks/use-status"
import { formatBytes, formatSpeed, splitFormattedMeasure } from "@/lib/format"
import { healthStatusDots } from "@/lib/health-dots"
import { homeTrafficWindowMs, recordHomeTraffic, type TrafficSample } from "@/lib/live-traffic"
import { regionStats, uniqueCountryCount } from "@/lib/region"
import { seriesPath } from "@/lib/sparkline"
import { THEME } from "@/lib/theme-tokens"
import { cn } from "@/lib/utils"
import { Chip, Tooltip } from "@mui/material"
import { ArrowDown, ArrowUp } from "lucide-react"
import { useMemo, type CSSProperties, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

type StatusFilter = "all" | "online" | "offline"

type ServerOverviewProps = {
  online: number
  offline: number
  total: number
  up: number
  down: number
  upSpeed: number
  downSpeed: number
  now?: number
  servers: Array<{ country_code?: string; online: boolean }>
}

function formatClock(value: number) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ""
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

function axisSpeedTicks(peakMbps: number) {
  const unit = splitFormattedMeasure(formatSpeed(Math.max(peakMbps, 0.001))).unit || "M/s"
  const scale = unit === "G/s" ? 1 / 1024 : unit === "K/s" ? 1024 : 1
  const label = (mbps: number) => (mbps <= 0 ? "0" : (mbps * scale).toFixed(2))
  return { unit, labels: [label(peakMbps), label(peakMbps / 2), "0"] }
}

function trafficPeakMbps(samples: TrafficSample[]) {
  return Math.max(0.001, ...samples.map((sample) => sample.up), ...samples.map((sample) => sample.down))
}

function TrafficPlot({ samples, plotHeight, compact, windowLabel }: { samples: TrafficSample[]; plotHeight: number; compact?: boolean; windowLabel?: string | null }) {
  const { t } = useTranslation()
  const width = 800
  const upPath = seriesPath(samples.map((sample) => sample.up), width, plotHeight, compact ? 2 : 6, 0)
  const downPath = seriesPath(samples.map((sample) => sample.down), width, plotHeight, compact ? 2 : 6, 0)
  const { labels } = compact ? { labels: [] as string[] } : axisSpeedTicks(trafficPeakMbps(samples))
  const first = samples[0]
  const last = samples.at(-1)
  const mid = !compact && first && last && last !== first ? formatClock(first.t + (last.t - first.t) / 2) : compact ? windowLabel : null
  const plot = (
    <svg className="block h-full w-full" viewBox={`0 0 ${width} ${plotHeight}`} preserveAspectRatio="none" role="img" aria-label={t("serverOverview.liveTrafficCurve")}>
      <line x1="0" y1="0.5" x2={width} y2="0.5" stroke="currentColor" strokeOpacity="0.55" />
      <line x1="0" y1={plotHeight / 2} x2={width} y2={plotHeight / 2} stroke="currentColor" strokeOpacity="0.55" />
      <line x1="0" y1={plotHeight - 0.5} x2={width} y2={plotHeight - 0.5} stroke="currentColor" strokeOpacity="0.55" />
      {downPath.area && <path d={downPath.area} fill="rgba(7,141,238,.08)" />}
      {downPath.line && <path d={downPath.line} fill="none" stroke={THEME.blue} strokeWidth={compact ? 1.6 : 2.2} strokeLinecap="round" strokeLinejoin="round" />}
      {upPath.line && <path d={upPath.line} fill="none" stroke={THEME.green} strokeWidth={compact ? 1.4 : 2} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
  const times = (
    <div className="flex w-full justify-between gap-2">
      <span className="tabular-nums">{first ? formatClock(first.t) : ""}</span>
      {mid ? <span className="min-w-0 truncate text-center">{mid}</span> : null}
      <span className="tabular-nums">{last ? formatClock(last.t) : ""}</span>
    </div>
  )

  if (compact) {
    return (
      <div className="min-w-0 text-[#919EAB]">
        <div className="min-w-0" style={{ height: plotHeight }}>{plot}</div>
        <div className="pt-1 text-[8px]">{times}</div>
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-0 min-w-0 text-[#919EAB]">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-9 text-right text-[8px] leading-none tabular-nums" aria-hidden="true">
        {labels.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="absolute right-1 whitespace-nowrap"
            style={{
              top: index === 0 ? 0 : index === labels.length - 1 ? "100%" : "50%",
              transform: index === 0 ? undefined : index === labels.length - 1 ? "translateY(-100%)" : "translateY(-50%)",
            }}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="h-full min-w-0 pl-9">{plot}</div>
    </div>
  )
}

function OverviewPane({
  className,
  style,
  header,
  footer,
  children,
}: {
  className?: string
  style?: CSSProperties
  header: ReactNode
  footer: ReactNode
  children: ReactNode
}) {
  return (
    <div className={cn("flex h-full min-h-0 min-w-0 flex-col px-[22px] py-4 max-[1919px]:px-5", className)} style={style}>
      <div className="flex h-5 w-full shrink-0 items-center text-[11px] leading-none">{header}</div>
      <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
      <div className="flex h-4 w-full shrink-0 items-center text-[10px] leading-none">{footer}</div>
    </div>
  )
}

function SpeedBlock({
  label,
  speed,
  total,
  tone,
  compact,
  className,
}: {
  label: string
  speed: number
  total: number
  tone: "green" | "blue"
  compact?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const formatted = splitFormattedMeasure(formatSpeed(speed))
  const color = tone === "green" ? "text-[#118D57] dark:text-[#61C8A5]" : "text-[#078DEE] dark:text-[#68B0F5]"
  const Icon = tone === "green" ? ArrowUp : ArrowDown
  const cumulative = (
    <>
      {tone === "green" ? t("serverOverview.cumulativeUpload") : t("serverOverview.cumulativeDownload")}
      <b className="ml-1 font-medium text-[#637381]">{formatBytes(total)}</b>
    </>
  )
  const unitClass = "shrink-0 whitespace-nowrap text-[11px] font-normal not-italic leading-none tracking-normal text-[#919EAB] max-[967px]:text-[8px]"
  const valueSize = {
    fontSize: `min(40px, calc((100cqw - 1.5rem) / ${Math.max(formatted.value.length, 4) * 0.62}))`,
  } as const
  if (compact) {
    return (
      <div className="min-w-0">
        <p className={`flex items-center gap-1 text-[9px] ${color}`}>
          <Icon className="size-3" />
          {label}
        </p>
        <div className="mt-1.5 flex items-end justify-between gap-1.5">
          <strong className="grid min-w-0 shrink grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-1 text-[22px] font-semibold leading-none tracking-tight tabular-nums text-[#1C252E] dark:text-white">
            <span className="min-w-0 overflow-hidden whitespace-nowrap">{formatted.value}</span>
            <em className={unitClass}>{formatted.unit}</em>
          </strong>
          <small className="min-w-0 truncate text-right text-[8px] leading-none text-[#919EAB]">{cumulative}</small>
        </div>
      </div>
    )
  }

  return (
    <OverviewPane
      className={className}
      header={
        <span className={`inline-flex items-center gap-1 ${color}`}>
          <Icon className="size-3" />
          {label}
        </span>
      }
      footer={cumulative}
    >
      <div className="flex min-h-0 w-full flex-1 items-center" style={{ containerType: "inline-size" }}>
        <strong className="flex min-w-0 items-baseline gap-x-1.5 text-[#1C252E] dark:text-white">
          <span className="whitespace-nowrap font-semibold leading-none tracking-tight tabular-nums" style={valueSize}>
            {formatted.value}
          </span>
          <em className={unitClass}>{formatted.unit}</em>
        </strong>
      </div>
    </OverviewPane>
  )
}

export default function ServerOverview({
  online,
  offline,
  total,
  up,
  down,
  upSpeed,
  downSpeed,
  now,
  servers,
}: ServerOverviewProps) {
  const { t } = useTranslation()
  const { status, setStatus } = useStatus()
  const availability = total > 0 ? Math.round((online / total) * 1000) / 10 : 0
  const regions = regionStats(servers)
  const countryCount = uniqueCountryCount(servers)
  const trafficSamples = useMemo(() => recordHomeTraffic(upSpeed, downSpeed, now), [downSpeed, now, upSpeed])
  const trafficUnit = axisSpeedTicks(trafficPeakMbps(trafficSamples)).unit
  const windowMs = homeTrafficWindowMs(trafficSamples)
  const windowLabel = windowMs >= 15_000
    ? windowMs < 90_000
      ? t("serverOverview.windowSeconds", { count: Math.max(1, Math.round(windowMs / 1000)) })
      : t("serverOverview.windowMinutes", { count: Math.max(1, Math.round(windowMs / 60_000)) })
    : null
  const regionDetail = regions.map((region) => `${t(`region.${region.label}`)} ${region.online}/${region.total}`).join(" · ")

  return (
    <section aria-label={t("overview")}>
      <div className="hidden overflow-hidden rounded-lg border border-[var(--lite-line)] bg-[var(--lite-paper)] min-[968px]:grid min-[968px]:grid-cols-3 min-[1440px]:h-[170px] min-[1440px]:grid-cols-[minmax(260px,380px)_minmax(184px,212px)_minmax(184px,212px)_minmax(0,1fr)]">
        <HealthColumn
          online={online}
          total={total}
          offline={offline}
          availability={availability}
          countryCount={countryCount}
          regionDetail={regionDetail}
          servers={servers}
          status={status}
          onSelect={setStatus}
        />
        <SpeedBlock
          className="border-[var(--lite-line)] border-r px-3.5 max-[1919px]:px-3.5"
          label={t("serverOverview.liveUpload")}
          speed={upSpeed}
          total={up}
          tone="green"
        />
        <SpeedBlock
          className="border-[var(--lite-line)] px-3.5 max-[1919px]:px-3.5 min-[1440px]:border-r"
          label={t("serverOverview.liveDownload")}
          speed={downSpeed}
          total={down}
          tone="blue"
        />
        <OverviewPane
          className="max-[1439px]:col-span-3 max-[1439px]:border-t max-[1439px]:border-[var(--lite-line)]"
          header={
            <div className="flex w-full items-center justify-between gap-3 text-[#637381]">
              <span>
                {t("serverOverview.liveTraffic")}{" "}
                <small className="text-[10px] font-normal text-[#919EAB]">{trafficUnit}</small>
              </span>
              <div className="flex items-center gap-4 text-[10px] leading-none">
                <span className="inline-flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#22C55E]" />{t("serverCard.upload")}</span>
                <span className="inline-flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#078DEE]" />{t("serverCard.download")}</span>
                {windowLabel ? <small className="text-[#919EAB] max-[1439px]:hidden">{windowLabel}</small> : null}
              </div>
            </div>
          }
          footer={
            <div className="flex w-full justify-between gap-2 pl-9 text-[#919EAB]">
              <span className="tabular-nums">{trafficSamples[0] ? formatClock(trafficSamples[0].t) : ""}</span>
              {trafficSamples[0] && trafficSamples.at(-1) && trafficSamples.at(-1) !== trafficSamples[0]
                ? <span className="min-w-0 truncate text-center">{formatClock(trafficSamples[0].t + (trafficSamples.at(-1)!.t - trafficSamples[0].t) / 2)}</span>
                : null}
              <span className="tabular-nums">{trafficSamples.at(-1) ? formatClock(trafficSamples.at(-1)!.t) : ""}</span>
            </div>
          }
        >
          <div className="min-h-0 flex-1 py-2">
            <TrafficPlot samples={trafficSamples} plotHeight={88} />
          </div>
        </OverviewPane>
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-[var(--lite-line)] bg-[var(--lite-paper)] max-[967px]:block">
        <div
          className="flex items-center justify-between gap-2 border-b border-[var(--lite-line)] px-3.5 py-3"
          style={{ background: "linear-gradient(105deg, rgba(7,141,238,.10) 0%, rgba(7,141,238,.035) 58%, var(--lite-paper) 100%)" }}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <i className="size-1.5 shrink-0 rounded-full bg-[#22C55E]" />
            <button type="button" onClick={() => setStatus("online")} aria-pressed={status === "online"} className="text-left">
              <strong className="text-[23px] font-semibold leading-none tracking-tight text-[#1C252E] dark:text-white">
                {online}
                <em className="ml-1 text-[15px] font-normal not-italic text-[#919EAB]">/ {total}</em>
              </strong>
            </button>
            <button type="button" onClick={() => setStatus("all")} aria-pressed={status === "all"} className="text-[9px] text-[#637381]">
              {t("online")}
            </button>
            <Chip
              size="small"
              clickable
              onClick={() => setStatus("offline")}
              aria-pressed={status === "offline"}
              label={t("serverOverview.offlineCount", { count: offline })}
              sx={{
                height: 19,
                ml: 0.5,
                fontSize: 8,
                bgcolor: status === "offline" ? "rgba(255,86,48,0.16)" : "rgba(255,86,48,0.10)",
                color: "#B71D18",
                ".dark &": { color: "#F18C84" },
              }}
            />
          </div>
          <Tooltip title={regionDetail || t("serverOverview.coverage", { count: countryCount })}>
            <div className="shrink-0 text-right text-[8px] leading-[1.35] text-[#637381]">
              <span>{t("serverOverview.onlineRate")} <b className="font-medium">{availability}%</b></span>
              <small className="mt-0.5 block text-[8px] text-[#919EAB]">{t("serverOverview.coverage", { count: countryCount })}</small>
            </div>
          </Tooltip>
        </div>
        <div className="grid grid-cols-2 gap-3.5 px-3.5 py-2.5">
          <SpeedBlock compact label={t("serverCard.upload")} speed={upSpeed} total={up} tone="green" />
          <div className="border-l border-[var(--lite-line)] pl-3.5">
            <SpeedBlock compact label={t("serverCard.download")} speed={downSpeed} total={down} tone="blue" />
          </div>
        </div>
        <div className="px-3.5 pb-2.5">
          <TrafficPlot samples={trafficSamples} plotHeight={48} compact windowLabel={windowLabel} />
        </div>
      </div>
    </section>
  )
}

function HealthColumn({
  online,
  total,
  offline,
  availability,
  countryCount,
  regionDetail,
  servers,
  status,
  onSelect,
}: {
  online: number
  total: number
  offline: number
  availability: number
  countryCount: number
  regionDetail: string
  servers: Array<{ online: boolean }>
  status: StatusFilter
  onSelect: (value: StatusFilter) => void
}) {
  const { t } = useTranslation()
  return (
    <OverviewPane
      className="border-[var(--lite-line)] min-[1440px]:border-r max-[1439px]:border-r"
      style={{ background: "linear-gradient(115deg, rgba(7,141,238,.10) 0%, rgba(7,141,238,.035) 58%, var(--lite-paper) 100%)" }}
      header={<span className="text-[#919EAB]">{t("serverOverview.runningStatus")}</span>}
      footer={
        <div className="flex w-full items-center justify-between text-[#919EAB]">
          <span>{t("serverOverview.onlineRate")} <b className="font-medium text-[#637381]">{availability}%</b></span>
          <Tooltip title={regionDetail || t("serverOverview.coverage", { count: countryCount })}>
            <button type="button" className="text-left">
              {t("serverOverview.coverage", { count: countryCount })}
            </button>
          </Tooltip>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-3">
        <div className="flex items-center gap-5">
          <button type="button" onClick={() => onSelect("online")} aria-pressed={status === "online"} className="text-left">
            <strong className="text-[40px] font-semibold leading-none tracking-tight text-[#1C252E] dark:text-white">
              {online}
              <em className="ml-1.5 text-2xl font-normal not-italic text-[#919EAB]">/ {total}</em>
            </strong>
          </button>
          <div className="text-xs leading-snug text-[#637381]">
            <button type="button" onClick={() => onSelect("all")} aria-pressed={status === "all"} className={`block text-left ${status === "all" ? "font-semibold text-[#1C252E] dark:text-white" : ""}`}>
              {t("serverOverview.serversOnline")}
            </button>
            <Chip
              size="small"
              clickable
              onClick={() => onSelect("offline")}
              aria-pressed={status === "offline"}
              label={t("serverOverview.offlineCount", { count: offline })}
              sx={{
                mt: 0.5,
                height: 22,
                fontSize: 10,
                bgcolor: status === "offline" ? "rgba(255,86,48,0.16)" : "transparent",
                color: "#B71D18",
                ".dark &": { color: "#F18C84" },
              }}
            />
          </div>
        </div>
        {servers.length > 0 ? (
          <div className="flex h-1.5 gap-1" aria-hidden="true">
            {healthStatusDots(servers).map((dotOnline, index) => (
              <i key={index} className={`min-w-[4px] flex-1 rounded-sm ${dotOnline ? "bg-[#22C55E]" : "bg-[#FF5630]"}`} />
            ))}
          </div>
        ) : null}
      </div>
    </OverviewPane>
  )
}
