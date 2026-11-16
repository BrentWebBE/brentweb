import Link from 'next/link'
import React from 'react'

import type { Locale } from '@/lib/locales'

import { Wordmark } from '@/components/Logo/Wordmark'
import { linkHref } from '@/components/Link'
import { Note } from '@/components/handmade/Note'
import { systemHref } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'
import { SOCIAL_PLATFORMS } from '@/SiteSettings/options'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getSiteSettings } from '@/utilities/getSiteSettings'

const socialLabel = (platform: string, url: string): string => {
  if (platform !== 'other')
    return SOCIAL_PLATFORMS.find((p) => p.value === platform)?.label ?? platform
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

export async function Footer({ locale }: { locale: Locale }) {
  const [footer, settings] = await Promise.all([
    getCachedGlobal('footer', 1, locale)(),
    getSiteSettings(locale),
  ])
  const t = ui(locale)
  const year = new Date().getFullYear()
  const links = (footer?.navItems ?? [])
    .map(({ id, link }) => ({ id, href: linkHref({ locale, ...link }), label: link.label }))
    .filter((l) => l.href && l.label)

  return (
    <footer className="relative mt-auto bg-footer text-footer-foreground">
      {/* A torn-paper edge instead of a straight line. */}
      <svg
        aria-hidden="true"
        className="absolute inset-x-0 -top-3 h-4 w-full text-footer"
        preserveAspectRatio="none"
        viewBox="0 0 1200 16"
      >
        <path
          d="M0 16V9l40-3 38 4 52-6 41 5 47-4 36 3 61-5 44 6 39-4 58 3 33-5 49 6 42-5 51 4 37-3 60 5 41-6 46 4 52-3 39 5 44-4 50 3 46-5 39 4 55-2L1200 8V16Z"
          fill="currentColor"
        />
      </svg>

      <div className="container grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-5">
          <Link aria-label="Brent Schoenmakers, home" className="w-fit" href={`/${locale}`}>
            <Wordmark className="h-8 w-auto" />
          </Link>
          {footer?.blurb && <p className="max-w-sm text-footer-foreground/80">{footer.blurb}</p>}
          {settings?.availability && (
            <p className="flex items-center gap-2 text-sm">
              <span
                aria-hidden="true"
                className={
                  settings.availability === 'open'
                    ? 'size-2.5 rounded-full bg-success'
                    : settings.availability === 'limited'
                      ? 'size-2.5 rounded-full bg-warning'
                      : 'size-2.5 rounded-full bg-error'
                }
              />
              {t.availability[settings.availability]}
            </p>
          )}
          {footer?.note && (
            <Note arrow="none" className="mt-2 text-[oklch(78%_0.13_40deg)]" tilt={-4}>
              {footer.note}
            </Note>
          )}
        </div>

        {links.length > 0 && (
          <nav aria-label={t.pagesTitle}>
            <h2 className="hand mb-3 text-2xl text-footer-foreground/70">{t.pagesTitle}</h2>
            <ul className="flex flex-col gap-2">
              {links.map((l) => (
                <li key={l.id ?? l.href}>
                  <Link className="hover:underline hover:decoration-wavy" href={l.href!}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div>
          <h2 className="hand mb-3 text-2xl text-footer-foreground/70">{t.contactTitle}</h2>
          <ul className="flex flex-col gap-2">
            {settings?.phone && (
              <li>
                <a className="hover:underline hover:decoration-wavy" href={telHref(settings.phone)}>
                  {settings.phone}
                </a>
              </li>
            )}
            {settings?.whatsapp && (
              <li>
                <a
                  className="hover:underline hover:decoration-wavy"
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
                <a
                  className="hover:underline hover:decoration-wavy"
                  href={`mailto:${settings.email}`}
                >
                  {settings.email}
                </a>
              </li>
            )}
          </ul>
          {settings?.socialLinks && settings.socialLinks.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-footer-foreground/80">
              {settings.socialLinks.map(({ id, platform, url }) => (
                <li key={id ?? url}>
                  <a
                    className="hover:underline"
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

      <div className="border-t border-footer-foreground/15">
        <div className="container flex flex-col gap-2 py-5 text-xs text-footer-foreground/70 md:flex-row md:flex-wrap md:items-center md:gap-x-6">
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
            {t.backToTop} ↑
          </a>
        </div>
      </div>
    </footer>
  )
}
