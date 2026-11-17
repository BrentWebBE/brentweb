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
    <nav aria-label={label} className="flex items-center text-[length:var(--text-sm)]">
      {locales.map((l, i) => (
        <React.Fragment key={l}>
          {i > 0 && (
            <span aria-hidden="true" className="text-[var(--color-rule)]">
              /
            </span>
          )}
          {l === locale ? (
            <span
              aria-current="true"
              className="inline-flex min-h-[44px] items-center px-[var(--space-xs)] font-medium text-[var(--color-ink)]"
              lang={l}
            >
              {SHORT[l]}
            </span>
          ) : (
            <Link
              className={cn(
                'inline-flex min-h-[44px] items-center px-[var(--space-xs)] text-[var(--color-muted)] hover:text-[var(--color-ink)]',
              )}
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
