import Link from 'next/link'
import React from 'react'

import type { Project } from '@/payload-types'

import { Media } from '@/components/Media'
import type { Locale } from '@/lib/locales'
import { projectHref } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'

import { LiveSite } from './LiveSite'
import { domainOf, projectVisual } from './visual'

export function statusLabel(locale: Locale, status: Project['status']): string | null {
  return status ? ui(locale).projects.status[status] : null
}

/** One project, its live site on top, the story below; the whole card links to it. */
export function ProjectCard({
  locale,
  note,
  project,
}: {
  locale: Locale
  note?: string | null
  project: Project
}) {
  const t = ui(locale).projects
  const { cover, desktop } = projectVisual(project)
  const href = projectHref(locale, project.slug)

  return (
    <article className="group relative flex h-full flex-col">
      {desktop ? (
        <LiveSite
          domain={domainOf(project.liveUrl)}
          image={desktop}
          labels={{ pause: t.pause, play: t.play }}
          sizes="(min-width: 1024px) 36rem, 92vw"
        />
      ) : cover ? (
        <div className="site-frame">
          <div className="site-frame__viewport">
            <Media
              imgClassName="h-full w-full object-cover object-top"
              resource={cover}
              size="(min-width: 1024px) 36rem, 92vw"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-[var(--space-lg)] flex flex-col gap-[var(--space-xs)]">
        <p className="small flex flex-wrap gap-x-[var(--space-md)]">
          {project.sector && <span>{project.sector}</span>}
          {project.period && <span>{project.period}</span>}
        </p>
        <h3 className="h-title">
          <Link className="after:absolute after:inset-0 after:content-['']" href={href}>
            {project.title}
          </Link>
        </h3>
        <p className="max-w-[52ch] text-[var(--color-ink-2)]">{note || project.abstract}</p>
        <span className="link mt-[var(--space-xs)] w-fit group-hover:decoration-[var(--color-accent)]">
          {t.read}
        </span>
      </div>
    </article>
  )
}
