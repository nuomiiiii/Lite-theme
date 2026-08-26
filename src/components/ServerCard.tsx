import ServerFlag from "@/components/ServerFlag"
import ServerLatencySummary from "@/components/ServerLatencySummary"
import TrafficBar from "@/components/TrafficBar"
import { formatBytes, formatSpeed } from "@/lib/format"
import type { HomeLatencyTaskSummary } from "@/lib/home-latency"
import { METER_TONE_COLOR, resourceUsageTone } from "@/lib/meter-tone"
import { GetOsName } from "@/lib/logo-class"
import { calcTrafficUsed, cn, formatLiteInfo, parsePublicNote } from "@/lib/utils"
import { LiteServer } from "@/types/lite-api"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import PlanInfo from "./PlanInfo"
import BillingInfo from "./billingInfo"

function ResourceMetric({ label, value, percent }: { label: string; value: string; percent: number }) {
  const color = METER_TONE_COLOR[resourceUsageTone(percent)]
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-baseline justify-between gap-2">
        <span className="truncate text-xs text-[#566571] dark:text-[#B2C0C9]">{label}</span>
        <strong className="shrink-0 text-[18px] font-semibold tabular-nums" style={{ color }}>{value}</strong>
      </div>
      <div className="mt-1.5 h-[5px] overflow-hidden rounded-[3px] bg-[#E9EEF1] dark:bg-[#2B3740]">
        <span className="block h-full rounded-[3px]" style={{ width: `${Math.min(100, Math.max(0, percent))}%`, background: color }} />
      </div>
    </div>
  )
}

export default function ServerCard({
  now,
  serverInfo,
  latencySummaries,
}: {
  now: number
  serverInfo: LiteServer
  latencySummaries?: HomeLatencyTaskSummary[]
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const info = formatLiteInfo(now, serverInfo)
  const parsedData = parsePublicNote(info.public_note)
  const systemName = info.platform.includes("Windows") ? "Windows" : GetOsName(info.platform)
  const uptime = info.uptime / 86400 >= 1
    ? `${Math.floor(info.uptime / 86400)} ${t("serverCard.days")}`
    : `${Math.floor(info.uptime / 3600)} ${t("serverCard.hours")}`
  const trafficUsed = calcTrafficUsed(info.net_out_transfer, info.net_in_transfer, info.traffic_limit_type)
  const cores = info.cpu_info.filter(Boolean).length || 1
  const loadPercent = Math.min(100, (Number(info.load_1) / cores) * 100)
  const openDetail = () => {
    navigate(`/server/${serverInfo.id}`)
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") openDetail()
      }}
      className="flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-[#DDE4E9] bg-white shadow-[0_7px_22px_rgba(32,42,51,0.045)] transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#B9CBD7] hover:shadow-[0_10px_28px_rgba(32,42,51,0.08)] dark:border-[#2D3943] dark:bg-[#1A2229] dark:shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
    >
      <header className="flex items-center justify-between gap-4 border-b border-[#E9EEF1] px-[22px] py-3 dark:border-[#26313A] max-[620px]:items-start max-[620px]:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <ServerFlag country_code={info.country_code} />
          <span className="min-w-0">
            <strong className="block truncate text-[17px] font-semibold leading-[1.15] text-[#202A33] dark:text-[#EDF3F6]">{info.name}</strong>
            <span className="mt-1 block text-[11px] text-[#7A8792] max-[620px]:max-w-[210px] max-[620px]:whitespace-normal max-[620px]:leading-snug">
              {systemName} · {info.arch || "--"} · {info.online ? `${t("serverCard.uptime")} ${uptime}` : t("offline")}
            </span>
          </span>
        </div>
        <span className={cn("inline-flex shrink-0 items-center gap-[9px] text-xs font-semibold", info.online ? "text-[#22B573]" : "text-[#FF6B5E]")}>
          <i className={cn("size-[7px] rounded-full", info.online ? "bg-[#22B573] shadow-[0_0_0_3px_#DDF7E8] dark:shadow-[0_0_0_3px_#143C2B]" : "bg-[#FF6B5E]")} />
          {info.online ? t("online") : t("offline")}
        </span>
      </header>

      <section className="grid grid-cols-4 gap-x-5 gap-y-3 px-[22px] py-3.5 max-[620px]:grid-cols-2 max-[620px]:gap-x-[18px] max-[620px]:gap-y-4 max-[620px]:px-4">
        <ResourceMetric label="CPU" value={`${info.cpu.toFixed(1)}%`} percent={info.cpu} />
        <ResourceMetric label={t("serverCard.mem")} value={`${info.mem.toFixed(1)}%`} percent={info.mem} />
        <ResourceMetric label={t("serverCard.stg")} value={`${info.stg.toFixed(1)}%`} percent={info.stg} />
        <ResourceMetric label={t("serverCard.load", { defaultValue: "负载" })} value={String(info.load_1)} percent={loadPercent} />
      </section>

      <section className="mx-[22px] grid grid-cols-2 border-t border-[#E9EEF1] py-3 dark:border-[#26313A] max-[620px]:mx-4">
        <div className="min-w-0 pr-[22px] max-[620px]:pr-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-[7px] text-xs text-[#22B573]"><span className="text-[19px] leading-none">↑</span>{t("serverCard.upload")}</span>
            <span className="text-[10px] tabular-nums text-[#7A8792]">{t("serverCard.cumulative")} {formatBytes(info.net_out_transfer)}</span>
          </div>
          <strong className="mt-1 block truncate text-[19px] font-semibold tabular-nums max-[620px]:text-[18px]">{formatSpeed(info.up)}</strong>
        </div>
        <div className="min-w-0 border-l border-[#E9EEF1] pl-[22px] dark:border-[#26313A] max-[620px]:pl-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-[7px] text-xs text-[#0E86DD]"><span className="text-[19px] leading-none">↓</span>{t("serverCard.download")}</span>
            <span className="text-[10px] tabular-nums text-[#7A8792]">{t("serverCard.cumulative")} {formatBytes(info.net_in_transfer)}</span>
          </div>
          <strong className="mt-1 block truncate text-[19px] font-semibold tabular-nums max-[620px]:text-[18px]">{formatSpeed(info.down)}</strong>
        </div>
      </section>

      <ServerLatencySummary
        summaries={latencySummaries}
        onSelectTask={(taskId) => {
          navigate(`/server/${serverInfo.uuid || serverInfo.id}?view=network&ping_task=${encodeURIComponent(taskId)}`)
        }}
      />

      {info.traffic_limit > 0 && (
        <TrafficBar used={trafficUsed} limit={info.traffic_limit} resetDay={info.traffic_reset_day} limitType={info.traffic_limit_type} />
      )}

      {(parsedData?.billingDataMod || parsedData?.planDataMod) && (
        <footer className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 bg-[#FBFCFD] px-[22px] py-2 dark:bg-[#171E24] max-[620px]:px-4">
          {parsedData?.billingDataMod ? <BillingInfo parsedData={parsedData} compact showProgress={false} /> : <span />}
          {parsedData?.planDataMod && <PlanInfo parsedData={parsedData} />}
        </footer>
      )}
    </article>
  )
}
