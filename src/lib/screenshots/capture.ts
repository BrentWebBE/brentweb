import sharp from 'sharp'

import { runtimeEnv } from '@/utilities/runtimeEnv'

import { assertPublicHttpsUrl, isPrivateAddress } from './safeUrl'

/**
 * Full-page screenshots of a live site with headless Chrome, for the self-scrolling
 * project previews. Chrome comes from CHROME_PATH (the Docker image installs Chromium;
 * locally, point it at Google Chrome). Without it, capture is switched off.
 */
export const chromePath = (): string | undefined => runtimeEnv('CHROME_PATH')

export type Capture = { data: Buffer; width: number; height: number }

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, maxHeight: 12000 },
  // 1.5x keeps a tall phone page inside WebP's 16383 px limit.
  mobile: { width: 390, height: 844, deviceScaleFactor: 1.5, isMobile: true, maxHeight: 6000 },
} as const

export type Device = keyof typeof VIEWPORTS

const SETTLE_CSS = `*, *::before, *::after {
  animation-duration: 0s !important; animation-delay: 0s !important;
  transition-duration: 0s !important; transition-delay: 0s !important;
  scroll-behavior: auto !important; caret-color: transparent !important;
}`

/**
 * Content still faded out after the walk (a reveal tied to scroll position that resets
 * off-screen, or one whose script never fired) is shown: in-flow elements at opacity 0
 * with a transform, a transition or a reveal class. Templates often hide those with
 * `visibility: hidden` too (e.g. `.site-animate`); that counts only together with opacity
 * 0 and a reveal marker. Fixed layers (menus, modals) are left alone.
 */
function forceVisible() {
  const REVEAL = /reveal|fade|animate|aos|appear|wow|scroll-?in|in-?view/i
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
    const style = getComputedStyle(el)
    if (style.position === 'fixed' || style.display === 'none') continue
    if (Number(style.opacity) > 0.05) continue
    const marked =
      REVEAL.test(el.className.toString()) ||
      el.hasAttribute('data-aos') ||
      Array.from(el.attributes).some((a) => /^data-(animate|reveal|sal|scroll)/.test(a.name))
    if (style.visibility === 'hidden' && !marked) continue
    const animated = style.transform !== 'none' || style.transitionProperty !== 'all'
    if (!animated && !marked) continue
    el.style.setProperty('opacity', '1', 'important')
    el.style.setProperty('transform', 'none', 'important')
    el.style.setProperty('visibility', 'visible', 'important')
  }
}

/**
 * Hides what covers the site rather than being part of it: cookie and consent banners,
 * chat widgets, announcement popups and modals (e.g. a "we're closed" notice), and any
 * fixed layer that covers most of the screen. A site's own header or nav is never hidden.
 */
function hideOverlays() {
  const pattern =
    /cookie|consent|gdpr|cmp|privacy-banner|onetrust|cookiebot|didomi|tarteaucitron|chat|intercom|crisp|tawk|messenger|popup|modal|overlay|lightbox|newsletter|announcement|backdrop/i
  const viewport = window.innerWidth * window.innerHeight
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
    if (el.matches('header, nav') || el.closest('header, nav') || el.querySelector('nav')) continue
    const style = getComputedStyle(el)
    const floating = style.position === 'fixed' || style.position === 'sticky'
    const dialog = el.getAttribute('role') === 'dialog' || el.getAttribute('aria-modal') === 'true'
    const label = `${el.id} ${typeof el.className === 'string' ? el.className : ''} ${el.getAttribute('aria-label') ?? ''}`
    const rect = el.getBoundingClientRect()
    const z = Number.parseInt(style.zIndex, 10)
    // Above the page (not a fixed background image) and covering most of the screen.
    const coversScreen = floating && z >= 10 && (rect.width * rect.height) / viewport > 0.4
    if (dialog || coversScreen || (floating && pattern.test(label))) {
      el.style.setProperty('display', 'none', 'important')
    }
  }
  document.documentElement.style.setProperty('overflow', 'visible', 'important')
  document.body.style.setProperty('overflow', 'visible', 'important')
  // Popup libraries lock scrolling while open (e.g. popup-js snaps the page back from
  // window.onscroll). With the popup hidden, that lock would keep the page mid-way.
  window.onscroll = null
}

export async function captureSite(rawUrl: string): Promise<Record<Device, Capture>> {
  const executablePath = chromePath()
  if (!executablePath) throw new Error('CHROME_PATH is not set; screenshots are disabled')
  const url = await assertPublicHttpsUrl(rawUrl)

  const { default: puppeteer } = await import('puppeteer-core')
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio'],
  })

  try {
    const result = {} as Record<Device, Capture>
    for (const device of Object.keys(VIEWPORTS) as Device[]) {
      const { maxHeight, ...viewport } = VIEWPORTS[device]
      const page = await browser.newPage()
      await page.setViewport(viewport)
      await page.emulateMediaFeatures([
        { name: 'prefers-reduced-motion', value: 'reduce' },
        { name: 'prefers-color-scheme', value: 'light' },
      ])
      // Stay on the public web: block any request (redirects, subresources) aimed at an
      // internal address literal.
      await page.setRequestInterception(true)
      page.on('request', (request) => {
        try {
          const { hostname, protocol } = new URL(request.url())
          const host = hostname.replace(/^\[|\]$/g, '')
          if (
            !/^(https?|data|blob):$/.test(protocol) ||
            host === 'localhost' ||
            isPrivateAddress(host)
          ) {
            return void request.abort()
          }
        } catch {
          return void request.abort()
        }
        void request.continue()
      })

      // Every IntersectionObserver reports its targets as visible straight away, so
      // scroll-triggered reveals and lazy images resolve without scrolling. The viewport
      // stays at its real height: a viewport as tall as the page would stretch every
      // section sized in vh.
      await page.evaluateOnNewDocument(() => {
        class AlwaysVisibleObserver {
          private callback: IntersectionObserverCallback
          constructor(callback: IntersectionObserverCallback) {
            this.callback = callback
          }
          observe(target: Element) {
            const rect = target.getBoundingClientRect()
            const entry = {
              target,
              isIntersecting: true,
              intersectionRatio: 1,
              boundingClientRect: rect,
              intersectionRect: rect,
              rootBounds: null,
              time: performance.now(),
            } as unknown as IntersectionObserverEntry
            setTimeout(() => this.callback([entry], this as unknown as IntersectionObserver), 0)
          }
          unobserve() {}
          disconnect() {}
          takeRecords() {
            return []
          }
        }
        // @ts-expect-error replacing the browser's observer for the capture
        window.IntersectionObserver = AlwaysVisibleObserver
      })

      await page.goto(url.href, { waitUntil: 'networkidle2', timeout: 45_000 })
      await page.addStyleTag({ content: SETTLE_CSS })
      await page.evaluate(hideOverlays)

      // Scroll-listener reveals and lazy loaders still get a walk down the page.
      await page.evaluate(async () => {
        document
          .querySelectorAll('img[loading="lazy"]')
          .forEach((img) => img.setAttribute('loading', 'eager'))
        for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 90))
        }
      })
      await page.evaluate(forceVisible)
      await page.evaluate(hideOverlays)
      await new Promise((r) => setTimeout(r, 1200))
      // Back to the top, and stay there: some sites scroll on their own (smooth-scroll
      // or scrollspy scripts) and their sticky nav would land mid-page in the shot.
      const scrollY = await page.evaluate(async () => {
        let still = 0
        for (let i = 0; i < 20 && still < 3; i++) {
          window.scrollTo(0, 0)
          document.documentElement.scrollTop = 0
          document.body.scrollTop = 0
          await new Promise((r) => setTimeout(r, 150))
          still = window.scrollY === 0 ? still + 1 : 0
        }
        return window.scrollY
      })
      if (scrollY !== 0) console.warn(`[capture] ${url.hostname} stayed at scrollY ${scrollY}`)
      await page.evaluate(forceVisible)
      // Popups that open after a delay: one last pass right before the shot.
      await page.evaluate(hideOverlays)
      await new Promise((r) => setTimeout(r, 300))

      const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight)
      const height = Math.min(fullHeight, maxHeight)
      const png = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: viewport.width, height },
        captureBeyondViewport: true,
      })
      const data = await sharp(png).webp({ quality: 78 }).toBuffer()
      const meta = await sharp(data).metadata()
      result[device] = { data, width: meta.width ?? 0, height: meta.height ?? 0 }
      await page.close()
    }
    return result
  } finally {
    await browser.close()
  }
}
