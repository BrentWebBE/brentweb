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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center gap-6 md:h-[4.5rem]">
        <Link aria-label="Brent Schoenmakers, home" className="shrink-0" href={homeHref(locale)}>
          <Wordmark className="h-6 w-auto text-foreground md:h-7" />
        </Link>

        <nav aria-label={t.mainNav} className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.id ?? item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <LanguageSwitcher alternates={alternates} label={t.language} locale={locale} />
          <ThemeToggle labels={{ dark: t.themeDark, light: t.themeLight }} />
          {header?.cta?.label && (
            <CMSLink
              {...header.cta}
              appearance="button"
              className="hidden min-h-10 px-4 py-2 text-sm sm:inline-flex"
              locale={locale}
            />
          )}
          <MobileMenu
            cta={
              header?.cta?.label ? (
                <CMSLink {...header.cta} appearance="button" className="w-full" locale={locale} />
              ) : null
            }
            items={items}
            labels={{ close: t.menuClose, nav: t.mainNav, open: t.menuOpen }}
          />
        </div>
      </div>
    </header>
  )
}
