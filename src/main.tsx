import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import ReactDOM from "react-dom/client"

import App from "./App"
import MuiThemeBridge from "./components/MuiThemeBridge"
import { ThemeColorManager } from "./components/ThemeColorManager"
import { ThemeProvider } from "./components/ThemeProvider"
import { MotionProvider } from "./components/motion/motion-provider"
import { StatusProvider } from "./context/status-provider"
import { WebSocketProvider } from "./context/websocket-provider"
import { RPC2Provider } from "./hooks/use-rpc2"
import { i18nReady } from "./i18n"
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

void i18nReady.then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <RPC2Provider>
      <MotionProvider>
        <ThemeProvider storageKey="vite-ui-theme">
          <MuiThemeBridge>
            <ThemeColorManager />
            <QueryClientProvider client={queryClient}>
              <WebSocketProvider>
                <StatusProvider>
                  <App />
                  {import.meta.env.DEV && <ReactQueryDevtools />}
                </StatusProvider>
              </WebSocketProvider>
            </QueryClientProvider>
          </MuiThemeBridge>
        </ThemeProvider>
      </MotionProvider>
    </RPC2Provider>,
  )
})
