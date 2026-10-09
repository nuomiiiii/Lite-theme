import {
  HOME_LATENCY_CARD_LIMIT,
  type HomeLatencyTaskSummary,
  formatProbePacketLoss,
  hourPacketFillPercent,
  latencyBarTone,
} from "@/lib/home-latency"
import { packetLossTone } from "@/lib/meter-tone"
import { readShowHomePacketLoss } from "@/lib/theme-config"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

function toneClass(tone: string) {
  if (tone === "green") return "lite-server-card__tone--green"
  if (tone === "amber") return "lite-server-card__tone--amber"
  if (tone === "coral") return "lite-server-card__tone--danger"
  if (tone === "empty") return "lite-server-card__tone--muted"
  return ""
}

function TaskProbe({
  summary,
  showPacketLoss,
  onSelect,
  onPress,
}: {
  summary: HomeLatencyTaskSummary
  showPacketLoss: boolean
  onSelect?: (taskId: string) => void
  onPress?: () => void
}) {
  const { t } = useTranslation()
  const latencyTone = latencyBarTone(summary.latency)
  const lossTone = packetLossTone(summary.packetLoss)
  const hasLatency = summary.latency !== null && Number.isFinite(summary.latency)
  const packetLoss = formatProbePacketLoss(summary.packetLoss)
  const percent = hourPacketFillPercent(summary)
  const lossLabel = t("serverCard.packetLoss")
  const latencyLabel = hasLatency ? `${summary.latency!.toFixed(2)} ms` : "--"
  const title = showPacketLoss
    ? `${summary.taskName} · ${latencyLabel} · ${lossLabel} ${packetLoss} · ${t("serverCard.sampleFill", { percent: percent.toFixed(0) })}`
    : `${summary.taskName} · ${latencyLabel} · ${t("serverCard.sampleFill", { percent: percent.toFixed(0) })}`

  return (
    <button
      type="button"
      title={title}
      onPointerDown={() => onPress?.()}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return
        event.stopPropagation()
        if (event.key === " ") event.preventDefault()
      }}
      onClick={(event) => {
        if (!onSelect) return
        event.stopPropagation()
        onSelect(summary.taskId)
      }}
      className="lite-server-card__probe"
    >
      <div className={cn("lite-server-card__probe-row", !showPacketLoss && "lite-server-card__probe-row--no-loss")}>
        <span className="lite-server-card__probe-name">{summary.taskName}</span>
        <strong className={cn("lite-server-card__delay tabular-nums", toneClass(latencyTone))}>
          {hasLatency ? summary.latency!.toFixed(2) : "--"}
          {hasLatency ? <small>ms</small> : null}
        </strong>
        {showPacketLoss ? (
          <span className={cn("lite-server-card__loss tabular-nums", lossTone === "green" ? "" : toneClass(lossTone))}>{packetLoss}</span>
        ) : null}
      </div>
    </button>
  )
}

export default function ServerLatencySummary({
  summaries,
  onSelectTask,
  onPrefetch,
}: {
  summaries?: HomeLatencyTaskSummary[]
  onSelectTask?: (taskId: string) => void
  onPrefetch?: (priority: boolean) => void
}) {
  const { t } = useTranslation()
  const showPacketLoss = readShowHomePacketLoss()
  const displayed = (summaries || []).slice(0, HOME_LATENCY_CARD_LIMIT)
  const sectionRef = useRef<HTMLElement>(null)
  const prefetchRef = useRef(onPrefetch)
  prefetchRef.current = onPrefetch

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return

    let dwell: number | undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.5) {
          dwell = window.setTimeout(() => prefetchRef.current?.(false), 300)
          return
        }
        if (dwell !== undefined) {
          window.clearTimeout(dwell)
          dwell = undefined
        }
      },
      { threshold: [0.5] },
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      if (dwell !== undefined) window.clearTimeout(dwell)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      onPointerEnter={() => onPrefetch?.(true)}
      className="lite-server-card__quality"
      data-testid="server-latency-summary"
    >
      <div className="lite-server-card__quality-title">
        <h3>{t("serverCard.networkQuality")}</h3>
        <span>{t("serverCard.recentHour")}</span>
      </div>
      {displayed.length > 0 ? (
        <>
          <div className={cn("lite-server-card__probe-row lite-server-card__probe-head", !showPacketLoss && "lite-server-card__probe-row--no-loss")} aria-hidden="true">
            <span>{t("serverCard.route")}</span>
            <span>{t("serverCard.latency")}</span>
            {showPacketLoss ? <span>{t("serverCard.packetLoss")}</span> : null}
          </div>
          {displayed.map((item) => (
            <TaskProbe key={item.taskId} summary={item} showPacketLoss={showPacketLoss} onSelect={onSelectTask} onPress={() => onPrefetch?.(true)} />
          ))}
        </>
      ) : (
        <div className="grid place-items-center py-3 text-center text-[11px] leading-snug text-[var(--card-muted)]">
          {t("monitor.noData")}
        </div>
      )}
    </section>
  )
}
