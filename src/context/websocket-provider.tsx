import { SharedClient } from "@/hooks/use-rpc2"
import { isRpcAuthLossError } from "@/lib/rpc-auth"
import { readLiveStatusCache, writeLiveStatusCache } from "@/lib/live-status-cache"
import { getLiteNodes, normalizeLiteServerStatus } from "@/lib/utils"
import React, { useCallback, useEffect, useRef, useState } from "react"

import { WebSocketContext, WebSocketContextType } from "./websocket-context"

const STATUS_POLL_MS = 5000

function liveStatusStorage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastMessage, setLastMessage] = useState<{ data: string } | null>(() => readLiveStatusCache(liveStatusStorage()))
  const [connected, setConnected] = useState(false)
  const activeRef = useRef(false)
  const requestRunningRef = useRef(false)
  const intervalIdRef = useRef<number | null>(null)

  const stopPolling = useCallback(() => {
    activeRef.current = false
    if (intervalIdRef.current != null) {
      window.clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }
  }, [])

  const updateData = useCallback(async () => {
    if (!activeRef.current || requestRunningRef.current) return
    requestRunningRef.current = true

    try {
      const rpc2 = SharedClient()
      const [nodes, status] = await Promise.all([getLiteNodes(false), rpc2.call("common:getNodesLatestStatus")])
      if (!activeRef.current) return

      const message = { data: JSON.stringify(normalizeLiteServerStatus(status, nodes)) }
      writeLiveStatusCache(liveStatusStorage(), message.data)
      setLastMessage(message)
      setConnected(true)
    } catch (error) {
      if (isRpcAuthLossError(error)) {
        stopPolling()
        try {
          SharedClient().pause()
        } catch {
          // Provider already tore down the client.
        }
        return
      }
      console.warn("加载服务器状态失败，等待下一轮：", error instanceof Error ? error.message : error)
    } finally {
      requestRunningRef.current = false
    }
  }, [stopPolling])

  useEffect(() => {
    activeRef.current = true
    void updateData()

    intervalIdRef.current = window.setInterval(() => {
      void updateData()
    }, STATUS_POLL_MS)

    return () => {
      stopPolling()
    }
  }, [stopPolling, updateData])

  const contextValue: WebSocketContextType = {
    lastMessage,
    connected,
  }

  return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>
}
