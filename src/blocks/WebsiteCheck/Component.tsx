import React from 'react'

import type { WebsiteCheckBlock as Props } from '@/payload-types'

import { linkHref } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import { LazyWebsiteCheckForm } from '@/components/website-check/LazyWebsiteCheckForm'
import type { Locale } from '@/lib/locales'
import { systemHref, WEBSITE_CHECK_URL_PARAM } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'

/**
 * Banner: one line and an address field; submitting goes to the check page with the
 * typed address prefilled (a plain GET form, no JS needed). Form: the full request form.
 */
export function WebsiteCheckBlock({
  checkPage,
  eyebrow,
  heading,
  intro,
  locale,
  variant,
}: Props & { locale: Locale }) {
  if (variant === 'form') {
    return (
      <section className="section scroll-mt-24" id="websitecheck">
        <div className="container grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} locale={locale} />
          <div className="paper-sheet p-6 md:p-9">
            <LazyWebsiteCheckForm title="" />
          </div>
        </div>
      </section>
    )
  }

  const t = ui(locale).websiteCheckBanner
  const action =
    (checkPage &&
      linkHref({
        locale,
        reference: { relationTo: 'pages', value: checkPage },
        type: 'reference',
      })) ||
    systemHref(locale, 'websiteCheck')

  return (
    <section className="section">
      <div className="container">
        <div className="kraft relative flex flex-col gap-5 rounded-[var(--radius-wobbly)] px-6 py-7 md:flex-row md:items-center md:gap-10 md:px-10">
          <div className="md:flex-1">
            {eyebrow && <p className="eyebrow mb-1 -rotate-1">{eyebrow}</p>}
            {heading && <p className="font-heading text-2xl">{heading}</p>}
            {intro && <p className="mt-1 text-muted-foreground">{intro}</p>}
          </div>
          <form
            action={`${action}#websitecheck`}
            className="flex w-full flex-col gap-3 sm:flex-row md:w-auto"
            method="get"
          >
            <label className="sr-only" htmlFor="wc-banner-url">
              {t.label}
            </label>
            <input
              autoComplete="url"
              className="field-hand sm:w-72"
              id="wc-banner-url"
              inputMode="url"
              name={WEBSITE_CHECK_URL_PARAM}
              placeholder={t.placeholder}
              required
              type="text"
            />
            <button className="btn btn-primary shrink-0" type="submit">
              {t.button}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
