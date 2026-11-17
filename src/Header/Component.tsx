import Link from 'next/link'
import React from 'react'

import type { Locale } from '@/lib/locales'
import type { Alternates } from '@/utilities/queries'

import { Wordmark } from '@/components/Logo/Wordmark'
import { CMSLink, linkHref } from '@/components/Link'
import { LanguageSwitcher } from '@/components/shell/LanguageSwitcher'
import { MobileMenu } from '@/components/shell/MobileMenu'
import { NavLink } from '@/components/shell/NavLink'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { homeHref } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'
import { getCachedGlobal } from '@/utilities/getGlobals'

export async function Header({ alternates, locale }: { alternates: Alternates; locale: Locale }) {
  const header = await getCachedGlobal('header', 1, locale)()
  const t = ui(locale)

  const items = (header?.navItems ?? [])
    .map(({ id, link }) => ({ id, href: linkHref({ locale, ...link }), label: link.label }))
    .filter((item): item is { id: string; href: string; label: string } =>
      Boolean(item.href && item.label),
    )

  return (
    <header className="sticky top-0 z-[var(--z-sticky-nav)] border-b border-[var(--color-rule)] bg-[var(--color-paper)]">
      {/* Desktop: three columns, so the links sit in the middle of the page whatever the
          widths of the wordmark and the actions. Smaller screens: wordmark left, the rest right. */}
      <div className="container relative flex h-[var(--nav-height)] items-center gap-[var(--space-md)] xl:grid xl:grid-cols-[1fr_auto_1fr]">
        <Link
          aria-label="BrentWeb, home"
          className="shrink-0 xl:justify-self-start"
          href={homeHref(locale)}
        >
          <Wordmark className="h-5 w-auto text-[var(--color-ink)] sm:h-6 md:h-7" />
        </Link>

        <nav aria-label={t.mainNav} className="hidden xl:block">
          <ul className="flex items-center gap-[var(--space-2xs)]">
            {items.map((item) => (
              <li key={item.id ?? item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-[var(--space-2xs)] sm:gap-[var(--space-xs)] xl:ml-0 xl:justify-self-end">
          <LanguageSwitcher alternates={alternates} label={t.language} locale={locale} />
          <div className="hidden sm:block">
            <ThemeToggle labels={{ dark: t.themeDark, light: t.themeLight }} />
          </div>
          {header?.cta?.label && (
            <CMSLink
              {...header.cta}
              appearance="button"
              className="btn-sm hidden sm:inline-flex"
              locale={locale}
            />
          )}
          <MobileMenu
            cta={
              header?.cta?.label ? (
                <CMSLink {...header.cta} appearance="button" className="w-full" locale={locale} />
              ) : null
            }
            extras={<ThemeToggle labels={{ dark: t.themeDark, light: t.themeLight }} />}
            items={items}
            labels={{ close: t.menuClose, nav: t.mainNav, open: t.menuOpen }}
          />
        </div>
      </div>
    </header>
  )
}
