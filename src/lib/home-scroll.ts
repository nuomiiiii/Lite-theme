const HOME_SCROLL_KEY = "lite-home-scroll-y"

export function saveHomeScroll() {
  try {
    sessionStorage.setItem(HOME_SCROLL_KEY, String(Math.max(0, Math.round(window.scrollY))))
  } catch {
    // Private mode can block storage.
  }
}

export function clearHomeScroll() {
  try {
    sessionStorage.setItem(HOME_SCROLL_KEY, "0")
  } catch {
    // Private mode can block storage.
  }
}

export function restoreHomeScroll() {
  try {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual"
    const y = Number(sessionStorage.getItem(HOME_SCROLL_KEY) || "0")
    if (!Number.isFinite(y) || y <= 0) return
    window.scrollTo({ top: y, left: 0, behavior: "instant" })
  } catch {
    // Ignore missing sessionStorage / scroll APIs.
  }
}
