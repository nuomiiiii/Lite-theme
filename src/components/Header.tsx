import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { ModeToggle } from "@/components/ThemeSwitcher"
import { Skeleton } from "@/components/ui/skeleton"
import { useSiteLogo } from "@/hooks/use-site-logo"
import { fetchSetting } from "@/lib/lite-api"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@mui/material"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

const BRAND = "#0E86DD"

function Header() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const customLogo = useSiteLogo()
  const { data: settingData, isLoading } = useQuery({
    queryKey: ["setting"],
    queryFn: () => fetchSetting(),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  })

  return (
    <header className="lite-page-header sticky top-0 z-30 border-b border-[#DDE4E9] bg-white/96 pt-[var(--safe-area-top)] h-[calc(82px+var(--safe-area-top))] backdrop-blur-sm dark:border-[#2D3943] dark:bg-[#141B21]/97 max-[620px]:h-[calc(4rem+var(--safe-area-top))]">
      <div className="lite-page-shell flex h-full items-center justify-between gap-6 max-[620px]:gap-2">
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem("selectedGroup")
            navigate("/")
          }}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <img className="size-[38px] shrink-0 rounded-lg object-cover max-[620px]:size-[30px]" alt="site logo" src={customLogo} width={38} height={38} />
          <span className="flex min-w-0 items-center gap-2 sm:gap-3.5">
            {isLoading ? (
              <Skeleton className="h-5 w-40 rounded-md" />
            ) : (
              <>
                <span className="max-w-[42%] shrink-0 truncate text-[19px] font-semibold leading-none text-[#202A33] dark:text-[#EDF3F6] max-[620px]:text-base sm:max-w-none">
                  {settingData?.data?.config?.site_name || "Lite"}
                </span>
                {settingData?.data?.config?.site_desc ? (
                  <>
                    <span className="h-4 w-px shrink-0 self-center bg-[#7A8792]/70 sm:h-5" aria-hidden="true" />
                    <span className="min-w-0 flex-1 text-[11px] leading-snug text-[#7A8792] line-clamp-2 sm:truncate sm:text-base sm:leading-none sm:line-clamp-1">
                      {settingData.data.config.site_desc}
                    </span>
                  </>
                ) : null}
              </>
            )}
          </span>
        </button>
        <nav className="flex shrink-0 items-center gap-2.5" aria-label="Public dashboard actions">
          <LanguageSwitcher />
          <ModeToggle />
          <Button
            component="a"
            href="/admin"
            size="small"
            variant="contained"
            sx={{
              height: 36,
              px: 1.8,
              borderRadius: "6px",
              bgcolor: BRAND,
              "&:hover": { bgcolor: "#0C76C4" },
            }}
          >
            {t("login")}
          </Button>
        </nav>
      </div>
    </header>
  )
}

export default Header
