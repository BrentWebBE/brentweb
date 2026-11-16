import React from 'react'

import type { ContactBlock as Props } from '@/payload-types'

import { LazyContactForm } from '@/components/contact/LazyContactForm'
import { MapFacade } from '@/components/contact/MapFacade'
import { Note } from '@/components/handmade/Note'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'
import { ui } from '@/lib/ui-strings'
import { runtimeEnv } from '@/utilities/runtimeEnv'
import { getSiteSettings } from '@/utilities/getSiteSettings'

/**
 * The contact section: who you're talking to and how to reach me on the left, the
 * form on a sheet of paper on the right. Always anchored at #contact, so pain-point
 * links and CTAs can jump here.
 */
export async function ContactBlock({
  eyebrow,
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
    <section className="section scroll-mt-24" id="contact">
      <div className="container grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <div>
          <SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} locale={locale} />

          <dl className="grid gap-5">
            {settings?.phone && (
              <div>
                <dt className="hand text-xl text-muted-foreground">{t.phone}</dt>
                <dd>
                  <a className="link-hand text-lg font-semibold" href={`tel:${tel}`}>
                    {settings.phone}
                  </a>
                  {settings.whatsapp && (
                    <>
                      {' · '}
                      <a
                        className="link-hand text-lg"
                        href={settings.whatsapp}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {t.whatsapp}
                      </a>
                    </>
                  )}
                </dd>
              </div>
            )}
            {settings?.email && (
              <div>
                <dt className="hand text-xl text-muted-foreground">{t.email}</dt>
                <dd>
                  <a className="link-hand text-lg" href={`mailto:${settings.email}`}>
                    {settings.email}
                  </a>
                </dd>
              </div>
            )}
            {settings?.availability && (
              <div>
                <dt className="sr-only">Status</dt>
                <dd className="flex items-center gap-2">
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
                </dd>
              </div>
            )}
          </dl>

          {settings?.replyNote && (
            <p className="mt-6 max-w-md text-muted-foreground">{settings.replyNote}</p>
          )}

          {showMap && locations.length > 0 && (
            <div className="mt-8">
              <MapFacade googleMapsKey={runtimeEnv('GOOGLE_MAPS_API_KEY')} locations={locations} />
            </div>
          )}
        </div>

        <div className="relative">
          <Note arrow="down" className="absolute -top-10 right-4 hidden md:inline-flex" tilt={4}>
            {locale === 'nl-BE' ? 'ik lees alles zelf' : 'I read every one myself'}
          </Note>
          <div className="paper-sheet p-6 md:p-9">
            <LazyContactForm
              formNote={formNote ?? undefined}
              messagePlaceholder={messagePlaceholder ?? undefined}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
