import Link from 'next/link'
import React from 'react'

import { requestLocale } from '@/lib/requestLocale'
import { homeHref, projectsHref, systemHref } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'

/** The 404, in the visitor's language, inside the normal site shell. */
export default async function NotFound() {
  const { locale } = await requestLocale()
  const t = ui(locale)

  return (
    <section className="container py-[var(--section-gap)]">
      <p className="small mb-[var(--space-md)]">404</p>
      <h1 className="display-s mb-[var(--space-lg)]">{t.notFound.title}</h1>
      <p className="lede mb-[var(--space-xl)]">{t.notFound.body}</p>
      <ul className="flex flex-wrap gap-[var(--space-md)]">
        <li>
          <Link className="btn btn-primary" href={homeHref(locale)}>
            {t.notFound.home}
          </Link>
        </li>
        <li>
          <Link className="btn btn-ghost" href={projectsHref(locale)}>
            {t.projects.all}
          </Link>
        </li>
        <li>
          <Link className="btn btn-ghost" href={systemHref(locale, 'pricing')}>
            {locale === 'nl-BE' ? 'Wat kost het?' : 'What does it cost?'}
          </Link>
        </li>
      </ul>
    </section>
  )
}
