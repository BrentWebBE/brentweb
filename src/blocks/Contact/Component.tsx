import React from 'react'

import type { ContactBlock as Props } from '@/payload-types'

import { LazyContactForm } from '@/components/contact/LazyContactForm'
import { MapFacade } from '@/components/contact/MapFacade'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'
import { ui } from '@/lib/ui-strings'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import { runtimeEnv } from '@/utilities/runtimeEnv'

/**
 * Contact: how to reach me on the left (phone first: for many owners a call is easier
 * than a form), the form on the right. Always at #contact.
 */
export async function ContactBlock({
  formNote,
  heading,
  intro,
  locale,
  messagePlaceholder,
  showMap,
}: Props & { locale: Locale }) {
  const settings = await getSiteSettings(locale)
  const t = ui(locale)
  const locations = (settings?.locations ?? []).map(({ lat, lng, name }) => ({ lat, lng, name }))
  const tel = settings?.phone?.replace(/[^\d+]/g, '')

  return (
    <section className="section-l scroll-mt-[var(--nav-height)]" id="contact">
      <div className="container grid gap-[var(--space-2xl)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-[var(--space-3xl)]">
        <div>
          <SectionHeading heading={heading} intro={intro} locale={locale} />
          <dl className="grid gap-[var(--space-lg)] border-t border-[var(--color-rule)] pt-[var(--space-lg)]">
            {settings?.phone && (
              <div>
                <dt className="small">{t.phone}</dt>
                <dd className="mt-[var(--space-3xs)] flex flex-wrap gap-x-[var(--space-lg)]">
                  <a className="link text-[length:var(--text-xl)] font-bold" href={`tel:${tel}`}>
                    {settings.phone}
                  </a>
                  {settings.whatsapp && (
                    <a
                      className="link self-center"
                      href={settings.whatsapp}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {t.whatsapp}
                    </a>
                  )}
                </dd>
              </div>
            )}
            {settings?.email && (
              <div>
                <dt className="small">{t.email}</dt>
                <dd className="mt-[var(--space-3xs)]">
                  <a className="link" href={`mailto:${settings.email}`}>
                    {settings.email}
                  </a>
                </dd>
              </div>
            )}
            {settings?.availability && (
              <div>
                <dt className="small">Status</dt>
                <dd className="mt-[var(--space-3xs)]">{t.availability[settings.availability]}</dd>
              </div>
            )}
          </dl>
          {settings?.replyNote && (
            <p className="mt-[var(--space-lg)] max-w-[52ch] text-[var(--color-ink-2)]">
              {settings.replyNote}
            </p>
          )}
          {showMap && locations.length > 0 && (
            <div className="mt-[var(--space-xl)]">
              <MapFacade googleMapsKey={runtimeEnv('GOOGLE_MAPS_API_KEY')} locations={locations} />
            </div>
          )}
        </div>

        <div className="card self-start p-[var(--space-lg)] md:p-[var(--space-xl)]">
          <LazyContactForm
            formNote={formNote ?? undefined}
            messagePlaceholder={messagePlaceholder ?? undefined}
          />
        </div>
      </div>
    </section>
  )
}
