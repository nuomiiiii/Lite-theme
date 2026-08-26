import { ToggleButton, ToggleButtonGroup } from "@mui/material"
import { MouseEvent, useEffect } from "react"
import { useTranslation } from "react-i18next"

const GROUP_RADIUS_PX = 8
const GROUP_PADDING_PX = 3
const GROUP_INNER_RADIUS_PX = GROUP_RADIUS_PX - GROUP_PADDING_PX

export default function GroupSwitch({
  tabs,
  currentTab,
  setCurrentTab,
}: {
  tabs: string[]
  currentTab: string
  setCurrentTab: (tab: string) => void
}) {
  const { t } = useTranslation()

  useEffect(() => {
    const savedGroup = sessionStorage.getItem("selectedGroup")
    if (savedGroup && tabs.includes(savedGroup)) setCurrentTab(savedGroup)
  }, [setCurrentTab, tabs])

  const handleChange = (_event: MouseEvent<HTMLElement>, value: string | null) => {
    if (value) setCurrentTab(value)
  }

  return (
    <div className="scrollbar-hidden overflow-x-auto">
      <ToggleButtonGroup
        exclusive
        size="small"
        value={currentTab}
        onChange={handleChange}
        aria-label={t("serverGroups", { defaultValue: "区域" })}
        sx={{
          minWidth: "max-content",
          gap: "2px",
          borderRadius: `${GROUP_RADIUS_PX}px`,
          bgcolor: "#E9EEF1",
          p: `${GROUP_PADDING_PX}px`,
          ".dark &": { bgcolor: "#202A32" },
          "& .MuiToggleButton-root": {
            minWidth: 58,
            minHeight: 30,
            border: 0,
            borderRadius: `${GROUP_INNER_RADIUS_PX}px !important`,
            px: 1.75,
            py: 0,
            color: "#566571",
            fontSize: 13,
            fontWeight: 600,
            textTransform: "none",
            ".dark &": { color: "#B2C0C9" },
          },
          "& .MuiToggleButton-root.Mui-selected": {
            bgcolor: "#202A33",
            color: "#FFFFFF",
            ".dark &": { bgcolor: "#34414B", color: "#EDF3F6" },
            "&:hover": { bgcolor: "#202A33", ".dark &": { bgcolor: "#34414B" } },
          },
        }}
      >
        {tabs.map((tab) => (
          <ToggleButton key={tab} value={tab}>
            {tab === "All" ? t("all", { defaultValue: "全部" }) : tab}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  )
}
