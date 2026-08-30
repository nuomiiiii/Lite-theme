import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useSiteLogo } from "@/hooks/use-site-logo"
import { useTranslation } from "react-i18next"

export default function PrivateAccessGate({ siteName, siteDesc }: { siteName: string; siteDesc?: string }) {
  const { t } = useTranslation()
  const customLogo = useSiteLogo()

  return (
    <div className="flex min-h-[var(--app-viewport-height,100svh)] items-center justify-center p-4 pt-[max(1rem,var(--safe-area-top))] pb-[max(1rem,var(--safe-area-bottom))]">
      <Card className="w-full max-w-sm space-y-5 rounded-3xl border-neutral-200/70 bg-white/85 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-950/80">
        <section className="flex items-center gap-3">
          <img src={customLogo} alt="site logo" className="h-10 w-10 rounded-xl object-cover" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">{siteName || "Lite"}</h1>
            <p className="truncate text-xs text-muted-foreground">{siteDesc || "Private monitor"}</p>
          </div>
        </section>
        <section className="space-y-2">
          <p className="text-sm font-medium">{t("privateSite.title")}</p>
          <p className="text-xs leading-5 text-muted-foreground">{t("privateSite.hint")}</p>
        </section>
        <div className="space-y-2">
          <Button asChild className="w-full rounded-full">
            <a href="/admin">{t("privateSite.adminLogin")}</a>
          </Button>
          <Button variant="outline" className="w-full rounded-full" onClick={() => window.location.reload()}>
            {t("privateSite.refresh")}
          </Button>
        </div>
      </Card>
    </div>
  )
}
