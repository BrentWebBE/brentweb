/**
 * One family for the whole site: Rethink Sans, a clear grotesk with a little warmth in
 * its curves. Professional without the default look; the BrentWeb wordmark (an SVG) is
 * the only other letterform. Four weights: 400 body, 500 labels, 600 h3/h4, 700 h1/h2.
 */
import { Rethink_Sans } from 'next/font/google'

const rethinkSans = Rethink_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-rethink',
})

export const fontVariables = rethinkSans.variable
