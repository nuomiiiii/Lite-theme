import { getBillingRemainingTone } from "@/lib/billing-status"
import { PublicNoteData, cn, formatBillingAmount, getDaysBetweenDatesWithAutoRenewal } from "@/lib/utils"
import { useTranslation } from "react-i18next"

import RemainPercentBar from "./RemainPercentBar"

type BillingInfoProps = {
  parsedData: PublicNoteData
  showProgress?: boolean
  compact?: boolean
  stacked?: boolean
  capsuleDensity?: "default" | "dense"
}

export default function BillingInfo(props: BillingInfoProps) {
  const { parsedData, showProgress = true, compact = false } = props
  const { t } = useTranslation()
  const billingData = parsedData?.billingDataMod
  if (!billingData) return null

  const hasPrice = Boolean(billingData.amount && billingData.amount !== "0" && billingData.amount !== "-1")
  const price = hasPrice
    ? `${formatBillingAmount(billingData.amount, billingData.currency)}/${billingData.cycle}`
    : billingData.amount === "-1"
      ? t("billingInfo.free")
      : "--"
  let indefinite = false
  let days = 0
  let remainingPercentage = 0

  if (billingData.endDate?.startsWith("0000-00-00")) {
    indefinite = true
  } else if (billingData.endDate) {
    try {
      const remaining = getDaysBetweenDatesWithAutoRenewal(billingData)
      days = remaining.days
      remainingPercentage = remaining.remainingPercentage
    } catch {
      return <span className="text-[11px] text-red-500">{t("billingInfo.error")}</span>
    }
  }

  const remainingTone = getBillingRemainingTone(days, indefinite)
  const remainingLabel = days < 0 ? t("billingInfo.expired") : t("billingInfo.remainingShort", { defaultValue: "剩余" })
  const remainingValue = indefinite ? t("billingInfo.indefinite") : `${Math.abs(days)} ${t("billingInfo.days")}`
  const remainingColor = remainingTone === "danger" ? "text-[#FF6B5E]" : "text-[#22B573]"

  if (compact) {
    return (
      <div className="inline-flex max-w-full items-center gap-1.5 whitespace-nowrap text-[11px] leading-5">
        <span className="text-[#7A8792]">{t("billingInfo.price")}</span>
        <strong className="truncate text-[13px] font-semibold text-[#202A33] dark:text-[#EDF3F6]">{price}</strong>
        <span className="text-[#7A8792]">· {remainingLabel}</span>
        <strong className={cn("text-[13px] font-semibold", remainingColor)}>{remainingValue}</strong>
      </div>
    )
  }

  return (
    <div className="min-w-0 text-[11px]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-muted-foreground">
          {t("billingInfo.price")}: <strong className="font-medium text-foreground">{price}</strong>
        </span>
        <span className={remainingColor}>
          {remainingLabel}: {remainingValue}
        </span>
      </div>
      {showProgress && !indefinite && days >= 0 && <RemainPercentBar className="mt-1" value={remainingPercentage * 100} />}
    </div>
  )
}
