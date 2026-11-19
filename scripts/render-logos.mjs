/**
 * Renders the static logo files from the Wordmark component, so every logo outside the
 * React tree (admin login, emails, social cards, structured data) matches the site.
 *
 *   node scripts/render-logos.mjs [chromium-path]
 *
 * Needs Playwright and a Chromium binary. Writes:
 *   src/client/branding/logo.svg   admin login (follows the OS light/dark preference)
 *   public/email-logo.png          600x115, transparent, for light email backgrounds
 *   public/logo-social.png         1024x1024 social card on the dark field
 *
 * Colours are the site tokens as hex (src/client/tokens.css): ink #191211, accent
 * #BE111E; dark field #181110 with field-ink #F3EFEE and field-accent #EF6663.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(resolve(root, 'src/components/Logo/Wordmark.tsx'), 'utf8')

const VIEW_BOX = source.match(/export const VIEW_BOX = '([^']+)'/)[1]
const STROKE = source.match(/export const STROKE = ([\d.]+)/)[1]
const paths = [...source.matchAll(/tone: '(mark|accent)',\s*d: '([^']+)'/g)].map(([, tone, d]) => ({
  tone,
  d,
}))
if (paths.length !== 8) throw new Error(`expected 8 glyphs, found ${paths.length}`)

const [, , vbW, vbH] = VIEW_BOX.split(' ').map(Number)

/** The wordmark as a standalone SVG; `mark` / `accent` are CSS colours or class hooks. */
function svg({ width, height, mark, accent, style = '' }) {
  const glyphs = paths
    .map(({ tone, d }) => {
      const colour = tone === 'mark' ? mark : accent
      return `  <path class="${tone}" d="${d}" fill="${colour}" stroke="${colour}" stroke-width="${STROKE}" stroke-linejoin="round"/>`
    })
    .join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW_BOX}" width="${width}" height="${height}" role="img" aria-label="BrentWeb">
${style}${glyphs}
</svg>
`
}

// Admin login: an <img>, so it can't read page CSS; it follows the OS theme instead.
writeFileSync(
  resolve(root, 'src/client/branding/logo.svg'),
  svg({
    width: 240,
    height: Math.round((240 * vbH) / vbW),
    mark: '#191211',
    accent: '#BE111E',
    style: `  <style>@media (prefers-color-scheme: dark){.mark{fill:#F2EDED;stroke:#F2EDED}.accent{fill:#EC5B59;stroke:#EC5B59}}</style>\n`,
  }),
)

const browser = await chromium.launch({
  executablePath: process.argv[2] || undefined,
  args: ['--no-sandbox'],
})
const page = await browser.newPage({ deviceScaleFactor: 1 })

async function png(file, { width, height, background, logoWidth, mark, accent }) {
  const logoHeight = (logoWidth * vbH) / vbW
  await page.setViewportSize({ width, height })
  await page.setContent(
    `<html><body style="margin:0;width:${width}px;height:${height}px;display:grid;place-items:center;background:${background}">${svg({ width: logoWidth, height: logoHeight, mark, accent })}</body></html>`,
  )
  await page.screenshot({
    path: resolve(root, file),
    omitBackground: background === 'transparent',
    clip: { x: 0, y: 0, width, height },
  })
}

// Same canvas sizes as the files they replace, so email templates and social cards keep
// their layout.
await png('public/email-logo.png', {
  width: 600,
  height: 115,
  background: 'transparent',
  logoWidth: 596,
  mark: '#191211',
  accent: '#BE111E',
})
await png('public/logo-social.png', {
  width: 1024,
  height: 1024,
  background: '#181110',
  logoWidth: 760,
  mark: '#F3EFEE',
  accent: '#EF6663',
})

await browser.close()
console.log('wrote src/client/branding/logo.svg, public/email-logo.png, public/logo-social.png')
