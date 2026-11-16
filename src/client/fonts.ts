/**
 * BrentWeb fonts, self-hosted by next/font. Each exposes a CSS variable that
 * src/client/theme.css maps to --font-body / --font-display / --font-hand.
 *
 *  - Fraunces: a soft, slightly wonky serif for headings. The SOFT and WONK axes are
 *    what make it feel drawn rather than set.
 *  - Instrument Sans: warm, readable body text.
 *  - Caveat: the handwritten notes in the margins. Not preloaded; it is never the LCP.
 */
import { Caveat, Fraunces, Instrument_Sans } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument',
})

const caveat = Caveat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-caveat',
  preload: false,
})

export const fontVariables = [fraunces.variable, instrumentSans.variable, caveat.variable].join(' ')
