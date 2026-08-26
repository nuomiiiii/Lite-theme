import { NetworkChart } from "@/components/NetworkChart"
import ServerDetailChart from "@/components/ServerDetailChart"
import ServerDetailOverview from "@/components/ServerDetailOverview"
import TabSwitch from "@/components/TabSwitch"
import { isNetworkView, parsePingTaskId, resolveServerRouteId } from "@/lib/server-route"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Navigate, useParams, useSearchParams } from "react-router-dom"

const tabs = ["Detail", "Network"]

export default function ServerDetail() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [])

  const { id: routeId } = useParams()
  const [searchParams] = useSearchParams()
  const pingTaskId = parsePingTaskId(searchParams.get("ping_task"))
  const openNetworkView = isNetworkView(searchParams.get("view")) || pingTaskId !== undefined
  const serverId = routeId ? resolveServerRouteId(routeId) : null
  const [currentTab, setCurrentTab] = useState(openNetworkView ? tabs[1] : tabs[0])

  useEffect(() => {
    setCurrentTab(openNetworkView ? tabs[1] : tabs[0])
  }, [openNetworkView, routeId])

  if (serverId === null) return <Navigate to="/404" replace />

  return (
    <div className="mx-auto flex w-full flex-col gap-3 px-0 server-info">
      <ServerDetailOverview server_id={serverId} />
      <TabSwitch tabs={tabs} currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <div className="relative w-full overflow-hidden">
        <div
          aria-hidden={currentTab !== tabs[0]}
          data-testid="server-detail-panel"
          className={cn("w-full", currentTab === tabs[0] ? "relative" : "pointer-events-none invisible absolute inset-x-0 top-0 overflow-hidden")}
        >
          <ServerDetailChart server_id={serverId} show={currentTab === tabs[0]} />
        </div>
        <div
          aria-hidden={currentTab !== tabs[1]}
          data-testid="server-network-panel"
          className={cn("w-full", currentTab === tabs[1] ? "relative" : "pointer-events-none invisible absolute inset-x-0 top-0 overflow-hidden")}
        >
          <NetworkChart server_id={serverId} show={currentTab === tabs[1]} initialMonitorId={pingTaskId} />
        </div>
      </div>
    </div>
  )
}
