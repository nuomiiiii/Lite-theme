import { SharedClient } from "@/hooks/use-rpc2"
import { getLiteNodes, normalizeLiteServerStatus } from "@/lib/utils"
import React, { useCallback, useEffect, useRef, useState } from "react"

import { WebSocketContext, WebSocketContextType } from "./websocket-context"

const STATUS_POLL_MS = 5000
const HISTORY_LIMIT = 12

export const WebSocketProvider: React.FC<{ url?: string; children: React.ReactNode }> = ({ children }) => {
  const [lastMessage, setLastMessage] = useState<{ data: string } | null>(null)
  const [messageHistory, setMessageHistory] = useState<{ data: string }[]>([])
  const [connected, setConnected] = useState(false)
  const [needReconnect, setNeedReconnect] = useState(false)
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
      setLastMessage(message)
      setMessageHistory((previous) => [message, ...previous].slice(0, HISTORY_LIMIT))
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

  const reconnect = useCallback(() => {
    void updateData()
  }, [updateData])

  const contextValue: WebSocketContextType = {
    lastMessage,
    connected,
    messageHistory,
    reconnect,
    needReconnect,
    setNeedReconnect,
  }

  return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>
}
