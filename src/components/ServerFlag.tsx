import { cn } from "@/lib/utils"
import * as FlagIcons from "country-flag-icons/react/3x2"
import type { ReactElement, SVGProps } from "react"

const ALIASES: Record<string, string> = {
  UK: "GB",
  EN: "GB",
}

type FlagComponent = (props: SVGProps<SVGSVGElement>) => ReactElement

function resolveFlag(countryCode: string) {
  const normalized = ALIASES[countryCode.trim().toUpperCase()] || countryCode.trim().toUpperCase()
  return (FlagIcons as Record<string, FlagComponent | undefined>)[normalized]
}

export default function ServerFlag({
  country_code,
  className,
  size = "md",
}: {
  country_code: string
  className?: string
  size?: "md" | "lg"
}) {
  if (!country_code) return null
  const Flag = resolveFlag(country_code)
  if (!Flag) return null

  return (
    <Flag
      aria-hidden
      className={cn(
        "lite-flag pointer-events-none block shrink-0 overflow-hidden",
        size === "lg" ? "h-[18px] w-[27px]" : "h-[15px] w-[22px]",
        className,
      )}
    />
  )
}
