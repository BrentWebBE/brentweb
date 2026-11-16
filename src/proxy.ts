import { NextResponse, type NextRequest } from 'next/server'

import { locales, type Locale } from '@/lib/locales'
import { isLocale, negotiateLocale, splitLocalePath } from '@/lib/locale'
import { LOCALE_HEADER, PATH_HEADER } from '@/lib/localeHeaders'

/**
 * Locale routing for the public site.
 *
 *  - `/nl-BE/...` and `/en/...` are served as-is. The locale and the path are passed to
 *    the root layout as request headers, since the layout sits above the [locale] segment
 *    (it also wraps the feature-module routes) and needs both for <html lang> and hreflang.
 *  - `/nl-be/...`, `/EN/...`: one permanent hop to the canonical case.
 *  - `/nl/...`: the common short form, permanently to `/nl-BE/...`.
 *  - Anything else without a locale: the visitor's language (cookie, then
 *    Accept-Language), with a temporary redirect because the target depends on the visitor.
 *
 * The admin, the API, Next internals, files and the /next/* routes never get here (matcher).
 */
const LOCALE_COOKIE = 'bw-locale'

const ONE_YEAR = 60 * 60 * 24 * 365

function miscasedLocale(first: string | undefined): Locale | null {
  if (!first) return null
  const lower = first.toLowerCase()
  if (lower === 'nl') return 'nl-BE'
  return locales.find((l) => l.toLowerCase() === lower) ?? null
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { locale, rest } = splitLocalePath(pathname)

  if (locale) {
    const headers = new Headers(request.headers)
    headers.set(LOCALE_HEADER, locale)
    headers.set(PATH_HEADER, pathname)
    const response = NextResponse.next({ request: { headers } })
    if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
      response.cookies.set(LOCALE_COOKIE, locale, {
        path: '/',
        maxAge: ONE_YEAR,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    }
    return response
  }

  const [first, ...others] = pathname.split('/').filter(Boolean)
  const recased = miscasedLocale(first)
  const target = request.nextUrl.clone()

  if (recased) {
    target.pathname = `/${recased}${others.length ? `/${others.join('/')}` : ''}`
    return NextResponse.redirect(target, 308)
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value
  const preferred = isLocale(cookieLocale)
    ? cookieLocale
    : negotiateLocale(request.headers.get('accept-language'))
  target.pathname = `/${preferred}${rest}`
  return NextResponse.redirect(target, 307)
}

export const config = {
  // Skips Payload (admin, api), Next internals, /next/* (preview, health, estimator
  // endpoints), the feature-module routes and anything with a file extension
  // (robots.txt, sitemap.xml, llms.txt, images).
  matcher: ['/((?!admin|api|next|_next|posts|search|shop|og|.*\\..*).*)'],
}
