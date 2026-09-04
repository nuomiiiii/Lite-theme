import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import ReactDOM from "react-dom/client"

import App from "./App"
import MuiThemeBridge from "./components/MuiThemeBridge"
import PrivateSiteBootstrap from "./components/PrivateSiteBootstrap"
import { ThemeColorManager } from "./components/ThemeColorManager"
import { ThemeProvider } from "./components/ThemeProvider"
import { MotionProvider } from "./components/motion/motion-provider"
import { i18nReady } from "./i18n"
import { isRpcAuthLossError } from "./lib/rpc-auth"
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => !isRpcAuthLossError(error) && failureCount < 1,
    },
  },
})

void i18nReady.then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <MotionProvider>
      <ThemeProvider storageKey="vite-ui-theme">
        <MuiThemeBridge>
          <ThemeColorManager />
          <QueryClientProvider client={queryClient}>
            <PrivateSiteBootstrap>
              <App />
              {import.meta.env.DEV && <ReactQueryDevtools />}
            </PrivateSiteBootstrap>
          </QueryClientProvider>
        </MuiThemeBridge>
      </ThemeProvider>
    </MotionProvider>,
  )
})
