import Link from 'next/link'
import React from 'react'

import type { Locale } from '@/lib/locales'

import { Wordmark } from '@/components/Logo/Wordmark'
import { linkHref } from '@/components/Link'
import { homeHref, systemHref } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'
import { SOCIAL_PLATFORMS } from '@/SiteSettings/options'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getSiteSettings } from '@/utilities/getSiteSettings'

const socialLabel = (platform: string, url: string): string => {
  if (platform !== 'other')
    return SOCIAL_PLATFORMS.find((p) => p.value === platform)?.label ?? platform
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host === 'github.com' ? 'GitHub' : host
  } catch {
    return url
  }
}

/** The dark field again: who, the pages, how to reach me, and the legal line. */
export async function Footer({ locale }: { locale: Locale }) {
  const [footer, settings] = await Promise.all([
    getCachedGlobal('footer', 1, locale)(),
    getSiteSettings(locale),
  ])
  const t = ui(locale)
  const year = new Date().getFullYear()
  const links = (footer?.navItems ?? [])
    .map(({ id, link }) => ({ id, href: linkHref({ locale, ...link }), label: link.label }))
    .filter((l): l is { id: string | null | undefined; href: string; label: string } =>
      Boolean(l.href && l.label),
    )
  const tel = settings?.phone?.replace(/[^\d+]/g, '')

  return (
    <footer className="field mt-auto">
      <div className="container grid gap-[var(--space-2xl)] py-[var(--space-3xl)] md:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-[var(--space-lg)]">
          <Link aria-label="BrentWeb, home" className="w-fit" href={homeHref(locale)}>
            <Wordmark className="h-6 w-auto text-[var(--color-field-ink)]" />
          </Link>
          {footer?.blurb && (
            <p className="max-w-[40ch] text-[var(--color-ink-2)]">{footer.blurb}</p>
          )}
          {settings?.availability && (
            <p className="text-[length:var(--text-sm)]">{t.availability[settings.availability]}</p>
          )}
        </div>

        {links.length > 0 && (
          <nav aria-labelledby="footer-pages">
            <p className="eyebrow mb-[var(--space-md)]" id="footer-pages">
              {t.pagesTitle}
            </p>
            <ul className="grid gap-[var(--space-xs)]">
              {links.map((l) => (
                <li key={l.id ?? l.href}>
                  <Link className="hover:underline" href={l.href}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div>
          <p className="eyebrow mb-[var(--space-md)]">{t.contactTitle}</p>
          <ul className="grid gap-[var(--space-xs)]">
            {settings?.phone && (
              <li>
                <a className="hover:underline" href={`tel:${tel}`}>
                  {settings.phone}
                </a>
              </li>
            )}
            {settings?.whatsapp && (
              <li>
                <a
                  className="hover:underline"
                  href={settings.whatsapp}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t.whatsapp}
                </a>
              </li>
            )}
            {settings?.email && (
              <li>
                <a className="hover:underline" href={`mailto:${settings.email}`}>
                  {settings.email}
                </a>
              </li>
            )}
          </ul>
          {settings?.socialLinks && settings.socialLinks.length > 0 && (
            <ul className="mt-[var(--space-lg)] flex flex-wrap gap-x-[var(--space-lg)] gap-y-[var(--space-xs)] text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
              {settings.socialLinks.map(({ id, platform, url }) => (
                <li key={id ?? url}>
                  <a
                    className="inline-flex min-h-11 items-center hover:underline"
                    href={url}
                    rel="noopener noreferrer me"
                    target="_blank"
                  >
                    {socialLabel(platform, url)}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--color-field-rule)]">
        <div className="container flex flex-col gap-[var(--space-xs)] py-[var(--space-lg)] text-[length:var(--text-sm)] text-[var(--color-ink-2)] md:flex-row md:flex-wrap md:items-center md:gap-x-[var(--space-xl)]">
          <span>
            © {year} {settings?.personName || settings?.businessName}
          </span>
          {settings?.kboNumber && (
            <span>
              {t.kbo} {settings.kboNumber}
            </span>
          )}
          {settings?.vatExempt ? (
            <span>{t.vatExempt}</span>
          ) : (
            settings?.vatNumber && (
              <span>
                {t.vat} {settings.vatNumber}
              </span>
            )
          )}
          <Link className="hover:underline md:ml-auto" href={systemHref(locale, 'privacy')}>
            {t.privacy}
          </Link>
          <a className="hover:underline" href="#top">
            {t.backToTop}
          </a>
        </div>
      </div>
    </footer>
  )
}
