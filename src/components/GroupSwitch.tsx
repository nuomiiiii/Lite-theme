import { ToggleButton, ToggleButtonGroup } from "@mui/material"
import { FocusEvent, MouseEvent, useEffect } from "react"
import { useTranslation } from "react-i18next"

const GROUP_RADIUS_PX = 8
const GROUP_PADDING_PX = 0
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

  const keepScroll = (event: FocusEvent<HTMLElement>) => {
    const scroller = event.currentTarget.closest("[data-group-scroller]")
    if (!(scroller instanceof HTMLElement)) return
    const left = scroller.scrollLeft
    requestAnimationFrame(() => {
      scroller.scrollLeft = left
    })
  }

  return (
    <div className="scrollbar-hidden flex min-w-0 items-center overflow-x-auto [overflow-anchor:none]" data-group-scroller>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={currentTab}
        onChange={handleChange}
        aria-label={t("serverGroups")}
        sx={{
          minWidth: "max-content",
          gap: "2px",
          borderRadius: `${GROUP_RADIUS_PX}px`,
          bgcolor: "transparent",
          p: 0,
          ".dark &": { bgcolor: "transparent" },
          "& .MuiToggleButton-root": {
            minWidth: 58,
            minHeight: 32,
            border: 0,
            borderRadius: `${GROUP_INNER_RADIUS_PX}px !important`,
            px: 1.5,
            py: 0,
            color: "#637381",
            fontSize: 13,
            fontWeight: 500,
            textTransform: "none",
            scrollMargin: 0,
            ".dark &": { color: "#C4CDD5" },
          },
          "& .MuiToggleButton-root.Mui-selected": {
            bgcolor: "rgba(7,141,238,0.10)",
            color: "#078DEE",
            ".dark &": { bgcolor: "rgba(7,141,238,0.16)", color: "#68B0F5" },
            "&:hover": { bgcolor: "rgba(7,141,238,0.16)", ".dark &": { bgcolor: "rgba(7,141,238,0.22)" } },
          },
        }}
      >
        {tabs.map((tab) => (
          <ToggleButton key={tab} value={tab} onFocus={keepScroll}>
            {tab === "All" ? t("all") : tab}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  )
}
