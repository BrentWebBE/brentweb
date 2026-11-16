import Link from 'next/link'
import React from 'react'

import { Note } from '@/components/handmade/Note'
import { requestLocale } from '@/lib/requestLocale'
import { homeHref, projectsHref, systemHref } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'

/** The 404, in the visitor's language, inside the normal site shell. */
export default async function NotFound() {
  const { locale } = await requestLocale()
  const t = ui(locale)

  return (
    <section className="container-prose py-24 md:py-32">
      <Note arrow="down" className="mb-4" tilt={-6}>
        {t.notFound.note}
      </Note>
      <h1 className="display-2 mb-5">{t.notFound.title}</h1>
      <p className="lede mb-8">{t.notFound.body}</p>
      <ul className="flex flex-wrap gap-3">
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
