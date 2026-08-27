import { useQuery } from "@tanstack/react-query"
import React, { useEffect, useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"
import { Route, BrowserRouter as Router, Routes } from "react-router-dom"

import ErrorBoundary from "./components/ErrorBoundary"
import Footer from "./components/Footer"
import Header, { RefreshToast } from "./components/Header"
import PrivateAccessGate from "./components/PrivateAccessGate"
import { Loader } from "./components/loading/Loader"
import { useBackground } from "./hooks/use-background"
import { useTheme } from "./hooks/use-theme"
import { InjectContext } from "./lib/inject"
import { fetchSetting } from "./lib/lite-api"
import { cn } from "./lib/utils"
import ErrorPage from "./pages/ErrorPage"
import NotFound from "./pages/NotFound"
import Server from "./pages/Server"
import ServerDetail from "./pages/ServerDetail"

const MainApp: React.FC = () => {
  const { data: settingData, error } = useQuery({
    queryKey: ["setting"],
    queryFn: () => fetchSetting(),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  })
  const { i18n } = useTranslation()
  const { setTheme } = useTheme()
  const { backgroundImage: customBackgroundImage } = useBackground()
  const configuredLanguage = settingData?.data?.config?.language

  useLayoutEffect(() => {
    if (settingData?.data?.config?.custom_code) {
      void InjectContext(settingData.data.config.custom_code)
    }
  }, [settingData?.data?.config?.custom_code])

  // 检测是否强制指定了主题颜色
  const forceTheme =
    // @ts-expect-error ForceTheme is a global variable
    (window.ForceTheme as string) !== "" ? window.ForceTheme : undefined

  useEffect(() => {
    if (forceTheme === "dark" || forceTheme === "light") {
      setTheme(forceTheme)
    }
  }, [forceTheme, setTheme])

  useEffect(() => {
    if (configuredLanguage && !localStorage.getItem("language")) {
      void i18n.changeLanguage(configuredLanguage)
    }
  }, [configuredLanguage, i18n])

  if (error) {
    return <ErrorPage code={500} message={error.message} />
  }

  if (!settingData) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader visible />
      </div>
    )
  }

  if (settingData.data.private_site) {
    return <PrivateAccessGate siteName={settingData.data.config.site_name} siteDesc={settingData.data.config.site_desc} />
  }

  const customMobileBackgroundImage = window.CustomMobileBackgroundImage !== "" ? window.CustomMobileBackgroundImage : undefined

  return (
    <ErrorBoundary>
      {/* 固定定位的背景层 */}
      {customBackgroundImage && (
        <div
          className={cn("fixed inset-0 z-0 bg-cover min-h-lvh bg-no-repeat bg-center dark:brightness-75", {
            "hidden sm:block": customMobileBackgroundImage,
          })}
          style={{ backgroundImage: `url(${customBackgroundImage})` }}
        />
      )}
      {customMobileBackgroundImage && (
        <div
          className={cn("fixed inset-0 z-0 bg-cover min-h-lvh bg-no-repeat bg-center sm:hidden dark:brightness-75")}
          style={{ backgroundImage: `url(${customMobileBackgroundImage})` }}
        />
      )}
      <div
        className={cn("flex min-h-screen w-full flex-col", {
          "bg-background": !customBackgroundImage,
        })}
      >
        <RefreshToast />
        <Header />
        <main className="lite-page-shell z-20 pt-5 pb-2 md:pt-6 max-[620px]:pt-3 max-[620px]:pb-2">
          <Routes>
            <Route path="/" element={<Server />} />
            <Route path="/server/:id" element={<ServerDetail />} />
            <Route path="/instance/:id" element={<ServerDetail />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </main>
      </div>
    </ErrorBoundary>
  )
}

const App: React.FC = () => {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <MainApp />
    </Router>
  )
}

export default App
