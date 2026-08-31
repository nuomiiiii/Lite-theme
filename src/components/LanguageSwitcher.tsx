import { changePublicLanguage, preloadPublicLocales } from "@/i18n"
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material"
import { Check, Languages } from "lucide-react"
import { MouseEvent, useState } from "react"
import { useTranslation } from "react-i18next"

export const PUBLIC_LOCALES = [
  { name: "简体中文", code: "zh-CN" },
  { name: "繁體中文", code: "zh-TW" },
  { name: "English", code: "en-US" },
  { name: "日本語", code: "ja-JP" },
] as const

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const locale = i18n.resolvedLanguage || i18n.language

  const openMenu = (event: MouseEvent<HTMLElement>) => {
    void preloadPublicLocales()
    setAnchor(event.currentTarget)
  }
  const selectLocale = (code: string) => {
    void changePublicLanguage(code)
    setAnchor(null)
  }

  return (
    <>
      <Tooltip title={t("changeLanguage", { defaultValue: "切换语言" })}>
        <IconButton
          size="small"
          onClick={openMenu}
          aria-label={t("changeLanguage", { defaultValue: "切换语言" })}
          sx={{ width: 36, height: 36, borderRadius: "6px", color: "text.secondary" }}
        >
          <Languages className="size-[18px]" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { borderRadius: "8px", padding: "4px" } } }}
      >
        {PUBLIC_LOCALES.map((item) => (
          <MenuItem key={item.code} selected={locale === item.code} onClick={() => selectLocale(item.code)} sx={{ borderRadius: "4px" }}>
            <ListItemText>{item.name}</ListItemText>
            {locale === item.code && (
              <ListItemIcon sx={{ minWidth: 0, ml: 2 }}>
                <Check className="size-4" />
              </ListItemIcon>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
