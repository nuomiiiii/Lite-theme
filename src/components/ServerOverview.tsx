import { useStatus } from "@/hooks/use-status"
import { formatBytes, formatSpeed } from "@/lib/format"
import { recordHomeTraffic } from "@/lib/live-traffic"
import { regionStats, regionTone } from "@/lib/region"
import { seriesPath } from "@/lib/sparkline"
import { THEME } from "@/lib/theme-tokens"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

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
  const availability = total > 0 ? Math.round((online / total) * 100) : 0
  const regions = regionStats(servers)
  const trafficSamples = useMemo(() => recordHomeTraffic(upSpeed, downSpeed, now), [downSpeed, now, upSpeed])
  const upPath = seriesPath(trafficSamples.map((sample) => sample.up), 800, 142)
  const downPath = seriesPath(trafficSamples.map((sample) => sample.down), 800, 142)

  return (
    <section
      aria-label={t("overview")}
      className="grid min-h-[300px] overflow-hidden rounded-lg border border-white/5 text-white shadow-[0_16px_40px_rgba(32,42,51,0.12)] max-[1120px]:min-h-0 max-[1120px]:grid-cols-1 min-[1121px]:grid-cols-[minmax(390px,.78fr)_minmax(0,1.42fr)]"
      style={{
        backgroundColor: THEME.hero,
        backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,.07) 1.2px, transparent 0)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="min-w-0 border-white/10 px-8 py-7 max-[1120px]:border-b max-[1120px]:border-r-0 max-[620px]:px-[18px] max-[620px]:py-[22px] min-[1121px]:border-r">
        <p className="flex items-center gap-2.5 text-[11px] font-bold tracking-wide text-[#AAB5BD]">
          <i className="size-[7px] rounded-full bg-[#22B573]" />
          SYSTEM HEALTH
        </p>
        <h1 className="mb-[22px] mt-[11px] text-2xl font-semibold leading-tight max-[620px]:mb-5 max-[620px]:text-[21px]">
          {t("serverOverview.globalStatus")}
        </h1>
        <div className="grid grid-cols-[118px_minmax(0,1fr)] items-center gap-[22px] max-[620px]:grid-cols-[92px_minmax(0,1fr)] max-[620px]:gap-4">
          <div
            className="relative grid aspect-square w-[112px] place-items-center rounded-full max-[620px]:w-[90px]"
            style={{ background: `conic-gradient(${THEME.green} 0 ${availability}%, #3B4751 ${availability}% 100%)` }}
          >
            <span className="absolute inset-2.5 rounded-full bg-[#202A33] max-[620px]:inset-2" />
            <span className="z-[1] text-center">
              <strong className="block text-[27px] font-semibold leading-none max-[620px]:text-[22px]">{availability}%</strong>
              <span className="mt-[7px] block text-[10px] text-[#9EABB4]">{t("serverOverview.onlineRate")}</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3.5 max-[620px]:gap-2">
            <button type="button" onClick={() => setStatus("all")} className="min-w-0 text-left">
              <span className="block text-[11px] text-[#8F9CA6] max-[620px]:text-[10px]">{t("serverOverview.servers")}</span>
              <strong className={`mt-[7px] block text-[27px] font-semibold leading-none max-[620px]:text-[21px] ${status === "all" ? "text-white" : "text-white/90"}`}>{total}</strong>
            </button>
            <button type="button" onClick={() => setStatus("online")} className="min-w-0 text-left">
              <span className="block text-[11px] text-[#8F9CA6] max-[620px]:text-[10px]">{t("online")}</span>
              <strong className="mt-[7px] block text-[27px] font-semibold leading-none text-[#E4FFF0] max-[620px]:text-[21px]">{online}</strong>
            </button>
            <button type="button" onClick={() => setStatus("offline")} className="min-w-0 text-left">
              <span className="block text-[11px] text-[#8F9CA6] max-[620px]:text-[10px]">{t("offline")}</span>
              <strong className="mt-[7px] block text-[27px] font-semibold leading-none text-[#FFAFA8] max-[620px]:text-[21px]">{offline}</strong>
            </button>
          </div>
        </div>
        {regions.length > 0 && (
          <div className="mt-[22px] flex flex-wrap gap-x-[18px] gap-y-2.5 border-t border-white/10 pt-4 text-[11px] text-[#CBD4DA]">
            {regions.map((region) => {
              const tone = regionTone(region)
              const color = tone === "green" ? THEME.green : tone === "amber" ? "#F0A632" : THEME.coral
              return (
                <span key={region.label} className="inline-flex items-center">
                  {t(`region.${region.label}`)} {region.online}/{region.total}
                  <i className="ml-[7px] inline-block size-[5px] rounded-full align-[1px]" style={{ backgroundColor: color }} />
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="min-w-0 px-8 py-7 max-[620px]:px-[18px] max-[620px]:py-[22px]">
        <p className="flex items-center gap-2.5 text-[11px] font-bold tracking-wide text-[#AAB5BD]">
          <i className="size-[7px] rounded-full bg-[#0E86DD]" />
          LIVE TRAFFIC
        </p>
        <div className="mt-3.5 grid grid-cols-[auto_auto_minmax(170px,1fr)] items-end gap-[26px] max-[620px]:grid-cols-2 max-[620px]:gap-x-2.5 max-[620px]:gap-y-[18px]">
          <div>
            <strong className="text-[30px] font-semibold leading-none tabular-nums max-[620px]:block max-[620px]:text-2xl">{formatBytes(up)}</strong>
            <span className="ml-2 text-[11px] text-[#62D69B] max-[620px]:ml-0 max-[620px]:mt-[5px] max-[620px]:block">{t("serverCard.upload")}</span>
          </div>
          <div>
            <strong className="text-[30px] font-semibold leading-none tabular-nums max-[620px]:block max-[620px]:text-2xl">{formatBytes(down)}</strong>
            <span className="ml-2 text-[11px] text-[#74BEF0] max-[620px]:ml-0 max-[620px]:mt-[5px] max-[620px]:block">{t("serverCard.download")}</span>
          </div>
          <div className="justify-self-end text-right max-[620px]:col-span-2 max-[620px]:justify-self-start max-[620px]:text-left">
            <span className="block text-[10px] text-[#7E8C97]">{t("serverOverview.currentSpeed")}</span>
            <strong className="mt-1 block text-[13px] font-semibold text-[#D9E2E7]">
              {formatSpeed(upSpeed)}&nbsp;&nbsp;·&nbsp;&nbsp;{formatSpeed(downSpeed)}
            </strong>
          </div>
        </div>
        <svg className="mt-2.5 block h-[142px] w-full max-[620px]:h-[122px]" viewBox="0 0 800 142" preserveAspectRatio="none" role="img" aria-label={t("serverOverview.liveTrafficCurve")}>
          <line x1="0" y1="24" x2="800" y2="24" stroke="rgba(255,255,255,.09)" />
          <line x1="0" y1="68" x2="800" y2="68" stroke="rgba(255,255,255,.09)" />
          <line x1="0" y1="112" x2="800" y2="112" stroke="rgba(255,255,255,.09)" />
          {downPath.area && <path d={downPath.area} fill="rgba(14,134,221,.08)" />}
          {downPath.line && <path d={downPath.line} fill="none" stroke={THEME.blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          {upPath.line && <path d={upPath.line} fill="none" stroke={THEME.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
          <text x="0" y="140" fill="#70808C" fontSize="10">LIVE</text>
          <text x="800" y="140" fill="#70808C" fontSize="10" textAnchor="end">NOW</text>
        </svg>
      </div>
    </section>
  )
}
