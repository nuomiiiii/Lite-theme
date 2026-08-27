import ServerFlag from "@/components/ServerFlag"
import { ServerDetailLoading } from "@/components/loading/ServerDetailLoading"
import { useWebSocketContext } from "@/hooks/use-websocket-context"
import { cn, formatLiteInfo, parseLiteWebsocketMessage } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

export default function ServerDetailOverview({ server_id }: { server_id: number }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { lastMessage, connected } = useWebSocketContext()

  if (!connected && !lastMessage) return <ServerDetailLoading />
  const websocketData = parseLiteWebsocketMessage(lastMessage?.data)
  const server = websocketData?.servers.find((item) => item.id === server_id)
  if (!websocketData || !server) return <ServerDetailLoading />

  const info = formatLiteInfo(websocketData.now, server)
  const uptime = info.uptime / 86400 >= 1
    ? `${Math.floor(info.uptime / 86400)} ${t("serverDetail.days")} ${Math.floor((info.uptime % 86400) / 3600)} ${t("serverDetail.hours")}`
    : `${Math.floor(info.uptime / 3600)} ${t("serverDetail.hours")}`

  return (
    <section>
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mb-3.5 inline-flex h-8 items-center gap-2 text-[13px] font-medium text-[#7A8792] transition-colors hover:text-[#0E86DD]"
      >
        <ArrowLeft className="size-[17px]" />
        {t("serverDetail.backToList")}
      </button>
      <div className="flex min-w-0 items-center gap-3">
        <ServerFlag size="lg" country_code={info.country_code} />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="truncate text-[22px] font-semibold leading-none text-[#202A33] dark:text-[#EDF3F6]">{info.name}</h1>
            <span className={cn("inline-flex shrink-0 items-center gap-2 text-xs font-semibold", info.online ? "text-[#22B573]" : "text-red-500")}>
              <i className={cn("size-2 rounded-full", info.online ? "bg-[#22B573] shadow-[0_0_0_4px_#DDF7E8] dark:shadow-[0_0_0_4px_#143C2B]" : "bg-red-500")} />
              {info.online ? t("online") : t("offline")}
            </span>
          </div>
          <p className="mt-1 truncate text-[13px] leading-snug text-[#7A8792] max-[620px]:whitespace-normal max-[620px]:leading-relaxed">
            {info.platform || "--"} {info.platform_version || ""} · {info.arch || "--"}
            {info.online ? ` · ${t("serverDetail.uptime")} ${uptime}` : ""}
          </p>
        </div>
      </div>
    </section>
  )
}
