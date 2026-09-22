import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import { Activity, LayoutDashboard } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function TabSwitch({ tabs, currentTab, setCurrentTab }: { tabs: string[]; currentTab: string; setCurrentTab: (tab: string) => void }) {
  const { t } = useTranslation()

  return (
    <Tabs
      value={currentTab}
      onChange={(_event, value: string) => setCurrentTab(value)}
      aria-label={t("serverDetail.viewTabs")}
      variant="scrollable"
      scrollButtons={false}
      sx={{
        minHeight: 44,
        mb: 1,
        borderBottom: "1px solid var(--lite-line)",
        "& .MuiTab-root": {
          minHeight: 44,
          minWidth: { xs: 0, sm: 100 },
          flex: { xs: 1, sm: "none" },
          mr: { xs: 0, sm: 4 },
        },
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab === "Network" ? Activity : LayoutDashboard
        return (
          <Tab
            key={tab}
            value={tab}
            icon={<Icon className="size-[18px]" />}
            iconPosition="start"
            label={t(`tabSwitch.${tab}`)}
          />
        )
      })}
    </Tabs>
  )
}
