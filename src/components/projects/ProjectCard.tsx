import Link from 'next/link'
import React from 'react'

import type { Project } from '@/payload-types'

import { Media } from '@/components/Media'
import type { Locale } from '@/lib/locales'
import { projectHref } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'
import { cn } from '@/utilities/ui'

export function StatusBadge({ locale, status }: { locale: Locale; status: Project['status'] }) {
  if (!status) return null
  const live = status === 'active' || status === 'maintained'
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <span
        aria-hidden="true"
        className={cn('size-2 rounded-full', live ? 'bg-success' : 'bg-muted-foreground/50')}
      />
      {ui(locale).projects.status[status]}
    </span>
  )
}

/** A project as a sketched browser window with the screenshot, plus the short story. */
export function ProjectCard({
  index = 0,
  locale,
  note,
  project,
}: {
  index?: number
  locale: Locale
  note?: string | null
  project: Project
}) {
  const t = ui(locale)
  const cover = project.cover && typeof project.cover === 'object' ? project.cover : null
  const href = projectHref(locale, project.slug)

  return (
    <article className="group relative flex flex-col">
      <div
        className={cn(
          'sketch-frame transition-transform duration-300 group-hover:-translate-y-1',
          index % 2 ? 'group-hover:rotate-[0.8deg]' : 'group-hover:-rotate-[0.8deg]',
        )}
      >
        <div aria-hidden="true" className="sketch-frame__bar">
          <span />
          <span />
          <span />
        </div>
        {cover ? (
          <Media
            imgClassName="aspect-[16/10] w-full object-cover object-top"
            resource={cover}
            size="(min-width: 1024px) 36rem, 92vw"
          />
        ) : (
          <div className="grid aspect-[16/10] place-items-center bg-muted">
            <span className="hand text-3xl text-muted-foreground">
              {project.client || project.title}
            </span>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {project.sector && <span>{project.sector}</span>}
        {project.period && (
          <>
            <span aria-hidden="true">·</span>
            <span>{project.period}</span>
          </>
        )}
        <span className="ml-auto">
          <StatusBadge locale={locale} status={project.status} />
        </span>
      </div>
      <h3 className="display-3 mt-1">
        <Link className="before:absolute before:inset-0 before:content-['']" href={href}>
          {project.title}
        </Link>
      </h3>
      <p className="mt-2 text-muted-foreground">{note || project.abstract}</p>
      <span className="link-arrow mt-4">{t.projects.read}</span>
    </article>
  )
}
