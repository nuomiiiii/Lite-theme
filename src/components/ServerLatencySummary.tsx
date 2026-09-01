import { HOME_LATENCY_CARD_LIMIT, homeLatencyGridTemplate, hourPacketFillPercent, latencyBarTone, type HomeLatencyTaskSummary } from "@/lib/home-latency"
import { METER_TONE_COLOR, packetFillTone } from "@/lib/meter-tone"
import { THEME } from "@/lib/theme-tokens"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

function TaskProbe({
  summary,
  onSelect,
  onPress,
}: {
  summary: HomeLatencyTaskSummary
  onSelect?: (taskId: string) => void
  onPress?: () => void
}) {
  const latencyTone = latencyBarTone(summary.latency)
  const latency = summary.latency === null ? "--" : `${Math.round(summary.latency)} ms`
  const percent = hourPacketFillPercent(summary)
  const fillTone = packetFillTone(percent)
  const title = `${summary.taskName} · 近1小时成功率 ${percent.toFixed(0)}%`

  return (
    <button
      type="button"
      title={title}
      onPointerDown={() => onPress?.()}
      onClick={(event) => {
        if (!onSelect) return
        event.stopPropagation()
        onSelect(summary.taskId)
      }}
      className="probe min-w-0 text-left"
    >
      <div className="flex min-w-0 items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-[#566571] dark:text-[#B2C0C9]">{summary.taskName}</span>
        <strong className="shrink-0 text-[18px] font-semibold tabular-nums" style={{ color: METER_TONE_COLOR[latencyTone] }}>{latency}</strong>
      </div>
      <div className="mt-1.5 h-[5px] overflow-hidden rounded-[3px] bg-[#E9EEF1] dark:bg-[#2B3740]">
        <span
          className="block h-full rounded-[3px]"
          style={{ width: `${percent}%`, background: fillTone === "empty" ? "transparent" : METER_TONE_COLOR[fillTone] }}
        />
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
      className="mx-[22px] border-t border-[#E9EEF1] py-2.5 dark:border-[#26313A] max-[620px]:mx-4"
      data-testid="server-latency-summary"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-[9px] text-xs font-semibold text-[#566571] dark:text-[#B2C0C9]">
          <svg className="h-2.5 w-[18px]" viewBox="0 0 20 10" aria-hidden="true" fill="none" stroke={THEME.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 6h3l2-4 3 7 3-6 2 3h5" />
          </svg>
          {t("serverCard.networkQuality", { defaultValue: "延迟监测" })}
        </span>
        <span className="text-[10px] text-[#7A8792]">{t("serverCard.recentHour")}</span>
      </div>
      {displayed.length > 0 ? (
        <div
          className="mt-2 grid grid-cols-2 gap-x-5 gap-y-3 max-[620px]:gap-x-3 max-[620px]:[&>.probe:nth-child(odd):last-child]:col-span-2 min-[621px]:[grid-template-columns:var(--home-latency-cols)]"
          style={{ ["--home-latency-cols" as string]: homeLatencyGridTemplate(displayed.length) }}
        >
          {displayed.map((item) => (
            <TaskProbe key={item.taskId} summary={item} onSelect={onSelectTask} onPress={() => onPrefetch?.(true)} />
          ))}
        </div>
      ) : (
        <div className="grid min-h-[48px] place-items-center text-center text-[11px] leading-snug text-[#7A8792]">
          {t("monitor.noData", { defaultValue: "暂无延迟监测数据，请在管理后台添加监测任务" })}
        </div>
      )}
    </section>
  )
}
