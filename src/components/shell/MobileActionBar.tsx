import React from 'react'

import type { Locale } from '@/lib/locales'

import { ui } from '@/lib/ui-strings'
import { getSiteSettings } from '@/utilities/getSiteSettings'

/**
 * Call / WhatsApp, always within thumb reach on a phone. Most visitors arrive on mobile,
 * and for a small business owner a call is often easier than a form.
 */
export async function MobileActionBar({ locale }: { locale: Locale }) {
  const settings = await getSiteSettings(locale)
  const t = ui(locale)
  if (!settings?.phone && !settings?.whatsapp) return null

  return (
    <>
      {/* Keeps the footer's last line clear of the bar. */}
      <div aria-hidden="true" className="h-16 bg-footer md:hidden" />
      <nav
        aria-label={t.contactTitle}
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-2 gap-2 md:hidden"
      >
        {settings.phone && (
          <a
            className="btn btn-primary min-h-12 text-base"
            href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
          >
            {t.call}
          </a>
        )}
        {settings.whatsapp && (
          <a
            className="btn btn-ghost min-h-12 bg-card text-base"
            href={settings.whatsapp}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t.whatsapp}
          </a>
        )}
      </nav>
    </>
  )
}
