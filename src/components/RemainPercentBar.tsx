import { cn } from "@/lib/utils"

export default function RemainPercentBar({ value, className }: { value: number; className?: string }) {
  const percent = Math.min(100, Math.max(0, value))
  const fill = percent < 30 ? "bg-red-500" : percent < 70 ? "bg-orange-400" : "bg-green-500"

  return (
    <div
      aria-label="Server Usage Bar"
      className={cn("h-[3px] w-[70px] overflow-hidden rounded-sm bg-[#E9EEF1] dark:bg-[#2B3740]", className)}
    >
      <span className={cn("block h-full rounded-sm", fill)} style={{ width: `${percent}%` }} />
    </div>
  )
}
