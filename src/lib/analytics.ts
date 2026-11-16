// Custom events go to the self-hosted Umami tracker loaded by
// <Analytics> (components/analytics/Analytics.tsx). They show up under Events in the Umami dashboard.
type UmamiTracker = { track: (name: string, data?: Record<string, unknown>) => void }

declare global {
  interface Window {
    umami?: UmamiTracker
  }
}

export function sendEvent(name: string, params: Record<string, unknown> = {}) {
  try {
    window.umami?.track(name, params)
  } catch {
    // analytics must never break UX
  }
}
