import { cn } from "@/lib/utils"
import { LayoutGroup, m } from "framer-motion"
import { Activity, LayoutDashboard } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function TabSwitch({ tabs, currentTab, setCurrentTab }: { tabs: string[]; currentTab: string; setCurrentTab: (tab: string) => void }) {
  const { t } = useTranslation()

  return (
    <LayoutGroup>
      <nav className="flex items-center gap-6 border-b border-[#DDE4E9] dark:border-[#2D3943]" aria-label={t("serverDetail.viewTabs", { defaultValue: "服务器视图" })}>
        {tabs.map((tab) => {
          const Icon = tab === "Network" ? Activity : LayoutDashboard
          const active = currentTab === tab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setCurrentTab(tab)}
              className={cn(
                "relative inline-flex h-10 items-center gap-2 px-0 text-sm font-semibold max-[620px]:flex-1 max-[620px]:justify-center",
                active ? "text-[#202A33] dark:text-[#EDF3F6]" : "text-[#7A8792]",
              )}
            >
              <Icon className="size-[18px]" />
              {t(`tabSwitch.${tab}`)}
              {active && (
                <m.span
                  layoutId="lite-detail-tab-ink"
                  className="absolute bottom-[-1px] left-0 right-0 h-[3px] rounded-t-[3px] bg-[#0E86DD]"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
            </button>
          )
        })}
      </nav>
    </LayoutGroup>
  )
}
