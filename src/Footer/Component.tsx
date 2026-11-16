import { getCachedGlobal } from '@/utilities/getGlobals'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import Link from 'next/link'
import React from 'react'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { OpeningHoursTable } from '@/components/OpeningHoursTable'
import { SOCIAL_PLATFORMS } from '@/SiteSettings/options'

const socialLabel = (platform: string, url: string): string => {
  if (platform !== 'other') {
    return SOCIAL_PLATFORMS.find((p) => p.value === platform)?.label ?? platform
  }
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export async function Footer() {
  const [footerData, settings] = await Promise.all([
    getCachedGlobal('footer', 1)(),
    getSiteSettings(),
  ])

  const navItems = footerData?.navItems || []
  const { address, businessName, email, openingHours, phone, socialLinks, vatNumber } =
    settings || {}
  const hasAddress = Boolean(address?.street || address?.city)
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-footer text-footer-foreground">
      <div className="container grid gap-10 py-12 md:grid-cols-3">
        <div className="flex flex-col gap-4">
          <Link aria-label={businessName || 'Home'} className="flex items-center" href="/">
            <Logo logo={settings?.logo} name={businessName} />
          </Link>
          <address className="not-italic flex flex-col gap-1 text-sm opacity-90">
            {hasAddress && (
              <span>
                {address?.street}
                <br />
                {[address?.postalCode, address?.city].filter(Boolean).join(' ')}
              </span>
            )}
            {phone && (
              <a className="hover:underline" href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
                {phone}
              </a>
            )}
            {email && (
              <a className="hover:underline" href={`mailto:${email}`}>
                {email}
              </a>
            )}
          </address>
        </div>

        {openingHours && openingHours.length > 0 && (
          <div className="text-sm">
            <p className="mb-2 font-medium">Openingsuren</p>
            <OpeningHoursTable openingHours={openingHours} />
          </div>
        )}

        <div className="flex flex-col gap-6 md:items-end">
          {navItems.length > 0 && (
            <nav aria-label="Footer" className="flex flex-col gap-2 md:items-end">
              {navItems.map(({ link }, i) => (
                <CMSLink className="hover:underline" key={i} {...link} />
              ))}
            </nav>
          )}
          {socialLinks && socialLinks.length > 0 && (
            <ul className="flex flex-wrap gap-4 text-sm">
              {socialLinks.map(({ id, platform, url }) => (
                <li key={id ?? url}>
                  <a
                    className="hover:underline"
                    href={url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {socialLabel(platform, url)}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <ThemeSelector />
        </div>
      </div>

      <div className="border-t border-footer-foreground/15">
        <div className="container flex flex-col gap-2 py-4 text-xs opacity-80 md:flex-row md:justify-between">
          <span>
            © {year} {businessName}
          </span>
          {vatNumber && <span>Btw {vatNumber}</span>}
        </div>
      </div>
    </footer>
  )
}
