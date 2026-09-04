export class RpcAuthLossError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = "RpcAuthLossError"
    this.status = status
  }
}

export function isRpcAuthLossError(error: unknown): boolean {
  if (error instanceof RpcAuthLossError) return true
  const message = error instanceof Error ? error.message : String(error ?? "")
  if (/\bHTTP 401\b/.test(message)) return true
  if (/RPC Error -32040\b/.test(message)) return true
  if (/RPC Error -32041:.*Private site enabled/i.test(message)) return true
  return false
}

export function rpcErrorLooksLikeAuthLoss(code?: number, message?: string): boolean {
  if (code === -32040) return true
  if (code === -32041 && /Private site enabled/i.test(message || "")) return true
  return false
}

let authLossHandler: (() => void) | null = null
let authLossNotified = false

export function setRpcAuthLossHandler(handler: (() => void) | null) {
  authLossHandler = handler
  authLossNotified = false
}

export function notifyRpcAuthLoss() {
  if (authLossNotified) return
  authLossNotified = true
  authLossHandler?.()
}
