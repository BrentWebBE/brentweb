/**
 * Client fonts. Each font exposes a CSS variable that src/client/theme.css maps to
 * --font-body / --font-display / --font-code.
 *
 * To use a Google font instead:
 *   import { Inter } from 'next/font/google'
 *   const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
 *   export const fontVariables = [inter.variable].join(' ')
 * and set `--font-body: var(--font-inter), …` in theme.css.
 */
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

export const fontVariables = [GeistSans.variable, GeistMono.variable].join(' ')
