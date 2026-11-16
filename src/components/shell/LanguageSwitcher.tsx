import Link from 'next/link'
import React from 'react'

import type { Alternates } from '@/utilities/queries'

import { locales, type Locale } from '@/lib/locales'
import { homeHref } from '@/lib/routing'
import { cn } from '@/utilities/ui'

const SHORT: Record<Locale, string> = { 'nl-BE': 'NL', en: 'EN' }

/**
 * NL / EN. Links to the same page in the other language when it exists, otherwise to
 * that language's homepage. Server-rendered, so the links are right without JS.
 */
export function LanguageSwitcher({
  alternates,
  label,
  locale,
}: {
  alternates: Alternates
  label: string
  locale: Locale
}) {
  return (
    <nav
      aria-label={label}
      className="flex items-center rounded-full border border-border px-1 text-sm"
    >
      {locales.map((l, i) => (
        <React.Fragment key={l}>
          {i > 0 && (
            <span aria-hidden="true" className="text-muted-foreground/60">
              /
            </span>
          )}
          {l === locale ? (
            <span aria-current="true" className="px-2 py-1 font-semibold" lang={l}>
              {SHORT[l]}
            </span>
          ) : (
            <Link
              className={cn('px-2 py-1 text-muted-foreground hover:text-foreground')}
              href={alternates[l] ?? homeHref(l)}
              hrefLang={l}
              lang={l}
            >
              {SHORT[l]}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
