'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { sendEvent } from '@/lib/analytics'

/** Self-hosted Umami. */
const UMAMI_SCRIPT = 'https://analytics.brentweb.be/script.js'

/**
 * Self-hosted, cookieless Umami (analytics.brentweb.be). Nothing is stored in the
 * browser, so no consent banner is needed. The tracker follows Next's client-side
 * navigations itself (it hooks history.pushState). data-domains keeps
 * localhost/dev visits out of the stats; data-do-not-track honours the browser's DNT
 * signal.
 *
 * `websiteId` comes from the server (runtimeEnv('UMAMI_WEBSITE_ID')): the image is
 * built without env, so it can't be a NEXT_PUBLIC_ variable. Renders nothing
 * without an id.
 */
export function Analytics({ websiteId }: { websiteId: string | undefined | null }) {
  // One delegated listener instead of an attribute on every contact link, so new
  // links are counted without anyone remembering to tag them. Only the kind of
  // link and the page are sent, never the address or number.
  useEffect(() => {
    if (!websiteId) return
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href]')
      const href = link?.getAttribute('href') ?? ''
      const event = href.startsWith('mailto:')
        ? 'email_click'
        : href.startsWith('tel:')
          ? 'phone_click'
          : href.startsWith('https://wa.me/')
            ? 'whatsapp_click'
            : null
      if (event) sendEvent(event, { page: window.location.pathname })
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [websiteId])

  if (!websiteId) return null

  return (
    <Script
      src={UMAMI_SCRIPT}
      data-website-id={websiteId}
      data-domains="brentweb.be"
      data-do-not-track="true"
      strategy="afterInteractive"
    />
  )
}
