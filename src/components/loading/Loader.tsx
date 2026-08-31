import CircularProgress from "@mui/material/CircularProgress"
import { useTranslation } from "react-i18next"

const BRAND = "#0E86DD"

export const Loader = ({ visible }: { visible: boolean }) => {
  const { t } = useTranslation()
  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-3.5 text-center"
    >
      <CircularProgress size={44} thickness={4} sx={{ color: BRAND }} />
      <p className="text-sm leading-none text-[#7A8792] dark:text-[#B2C0C9]">{t("common.loading")}</p>
    </div>
  )
}

export const LoadingSpinner = ({ size = 24 }: { size?: number }) => {
  return <CircularProgress size={size} thickness={4} sx={{ color: BRAND }} />
}
