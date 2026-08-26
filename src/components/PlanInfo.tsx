import { PublicNoteData } from "@/lib/utils"

export default function PlanInfo({ parsedData }: { parsedData: PublicNoteData }) {
  if (!parsedData || !parsedData.planDataMod) return null

  const extraList = parsedData.planDataMod.extra
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  if (extraList.length === 0) return null

  return (
    <section className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
      {extraList.map((extra) => (
        <span key={extra} className="whitespace-nowrap rounded px-[7px] py-1 text-[10px] text-[#566571] bg-[#EDF2F5] dark:bg-[#2A353E] dark:text-[#B6C3CB]">
          {extra}
        </span>
      ))}
    </section>
  )
}
