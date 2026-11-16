import React from 'react'

import type { WebsiteCheckBlock as Props } from '@/payload-types'

import { linkHref } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import { LazyWebsiteCheckForm } from '@/components/website-check/LazyWebsiteCheckForm'
import type { Locale } from '@/lib/locales'
import { systemHref, WEBSITE_CHECK_URL_PARAM } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'

/**
 * Banner: one line and an address field; submitting opens the check page with the
 * address filled in (a plain GET form, no JS needed). Form: the full request form.
 */
export function WebsiteCheckBlock({
  checkPage,
  heading,
  intro,
  locale,
  variant,
}: Props & { locale: Locale }) {
  if (variant === 'form') {
    return (
      <section className="section scroll-mt-[var(--nav-height)]" id="websitecheck">
        <div className="container grid gap-[var(--space-2xl)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-[var(--space-3xl)]">
          <SectionHeading heading={heading} intro={intro} locale={locale} />
          <div className="card p-[var(--space-lg)] md:p-[var(--space-xl)]">
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
        <div className="well grid gap-[var(--space-lg)] p-[var(--space-xl)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-[var(--space-2xl)] md:p-[var(--space-2xl)]">
          <div>
            {heading && <p className="h-title max-w-[36ch]">{heading}</p>}
            {intro && <p className="mt-[var(--space-xs)] text-[var(--color-ink-2)]">{intro}</p>}
          </div>
          <form
            action={`${action}#websitecheck`}
            className="flex w-full flex-col gap-[var(--space-sm)] sm:flex-row md:w-auto"
            method="get"
          >
            <label className="visually-hidden" htmlFor="wc-banner-url">
              {t.label}
            </label>
            <input
              autoComplete="url"
              className="input sm:w-72"
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
