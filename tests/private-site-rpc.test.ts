import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { isRpcAuthLossError, rpcErrorLooksLikeAuthLoss } from "../src/lib/rpc-auth.ts"

const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8")
const bootstrap = readFileSync(new URL("../src/components/PrivateSiteBootstrap.tsx", import.meta.url), "utf8")
const hook = readFileSync(new URL("../src/hooks/use-rpc2.tsx", import.meta.url), "utf8")
const rpc2 = readFileSync(new URL("../src/lib/rpc2.ts", import.meta.url), "utf8")
const websocket = readFileSync(new URL("../src/context/websocket-provider.tsx", import.meta.url), "utf8")
const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
const liteApi = readFileSync(new URL("../src/lib/lite-api.ts", import.meta.url), "utf8")

test("private site waits for public access before creating RPC", () => {
  assert.match(main, /<QueryClientProvider client=\{queryClient\}>/)
  assert.match(main, /<PrivateSiteBootstrap>/)
  assert.match(bootstrap, /queryFn: \(\) => fetchSetting\(\)/)
  assert.match(bootstrap, /<RPC2Provider>/)
  assert.match(bootstrap, /<WebSocketProvider>/)
  assert.match(bootstrap, /<StatusProvider>/)
  assert.match(bootstrap, /<PrivateAccessGate/)
  assert.doesNotMatch(app, /PrivateAccessGate/)
  assert.match(liteApi, /fetch\("\/api\/public"/)
  assert.match(liteApi, /fetch\("\/api\/me"/)
})

test("RPC2 client is not created until the provider mounts", () => {
  assert.match(hook, /function ensureSharedClient\(\)/)
  assert.match(hook, /autoConnect: true/)
  assert.match(hook, /throw new Error\("RPC2 client is not initialized"\)/)
  assert.doesNotMatch(hook, /let __rpc2_singleton__: RPC2Client \| null = new/)
  assert.match(hook, /__rpc2_singleton__ = null/)
  assert.match(rpc2, /pause\(\): void/)
  assert.match(rpc2, /credentials: "include"/)
  assert.match(rpc2, /cache: "no-store"/)
})

test("auth loss stops polling and does not retry", () => {
  assert.equal(isRpcAuthLossError(new Error("HTTP 401")), true)
  assert.equal(rpcErrorLooksLikeAuthLoss(-32040, "Unauthenticated"), true)
  assert.equal(rpcErrorLooksLikeAuthLoss(-32041, "Private site enabled, please login first"), true)
  assert.equal(rpcErrorLooksLikeAuthLoss(-32041, "Permission denied"), false)
  assert.match(main, /!isRpcAuthLossError\(error\) && failureCount < 1/)
  assert.match(websocket, /isRpcAuthLossError\(error\)/)
  assert.match(websocket, /stopPolling\(\)/)
  assert.match(websocket, /SharedClient\(\)\.pause\(\)/)
})
