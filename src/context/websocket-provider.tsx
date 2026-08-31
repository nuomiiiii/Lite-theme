import { SharedClient } from "@/hooks/use-rpc2"
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

  const updateData = useCallback(async () => {
    if (requestRunningRef.current) return
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
      console.warn("加载服务器状态失败，等待下一轮：", error instanceof Error ? error.message : error)
    } finally {
      requestRunningRef.current = false
    }
  }, [])

  useEffect(() => {
    activeRef.current = true
    void updateData()

    const intervalId = window.setInterval(() => {
      void updateData()
    }, STATUS_POLL_MS)

    return () => {
      activeRef.current = false
      window.clearInterval(intervalId)
    }
  }, [updateData])

  const contextValue: WebSocketContextType = {
    lastMessage,
    connected,
  }

  return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>
}
