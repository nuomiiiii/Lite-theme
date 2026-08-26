import { formatBytes } from "@/lib/format"
import { daysUntilTrafficReset } from "@/lib/trafficReset"
import { useTranslation } from "react-i18next"

interface TrafficBarProps {
  used: number
  limit: number
  resetDay?: number
  limitType: string
}

export default function TrafficBar({ used, limit, resetDay }: TrafficBarProps) {
  const { t } = useTranslation()
  if (limit <= 0) return null

  const percent = Math.min(100, Math.max(0, (used / limit) * 100))
  const resetInDays = daysUntilTrafficReset(resetDay)
  const resetLabel = resetInDays === undefined
    ? ""
    : resetInDays === 0
      ? t("traffic.resetToday")
      : t("traffic.resetInDays", { count: resetInDays })

  return (
    <div className="mx-[22px] border-t border-[#E9EEF1] py-3 dark:border-[#26313A] max-[620px]:mx-4">
      <div className="flex justify-between gap-4 text-[11px] text-[#566571] dark:text-[#B2C0C9]">
        <span>
          <strong className="text-xs text-[#202A33] dark:text-[#EDF3F6]">{formatBytes(used)}</strong> / {formatBytes(limit)}
        </span>
        <span className="text-right text-[#7A8792] max-[620px]:text-left">
          {percent.toFixed(2)}%{resetLabel ? ` · ${resetLabel}` : ""}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-[3px] bg-[#E9EEF1] dark:bg-[#2B3740]">
        <span className="block h-full rounded-[3px] bg-[#0E86DD] transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
