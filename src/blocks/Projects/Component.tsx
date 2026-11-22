import Link from 'next/link'
import React from 'react'

import type { Project, ProjectsBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import { LiveSite } from '@/components/projects/LiveSite'
import { ProjectCard, statusLabel } from '@/components/projects/ProjectCard'
import { domainOf, projectVisual } from '@/components/projects/visual'
import type { Locale } from '@/lib/locales'
import { projectHref } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'
import { cn } from '@/utilities/ui'
import { getProjects } from '@/utilities/queries'

type Entry = { note?: string | null; project: Project }

export async function ProjectsBlockComponent({
  heading,
  intro,
  items,
  layout,
  link,
  locale,
  mode,
  showLink,
}: Props & { locale: Locale }) {
  const entries: Entry[] =
    mode === 'all'
      ? (await getProjects(locale)).map((project) => ({ project }))
      : (items ?? [])
          .filter((i) => typeof i.project === 'object' && i.project?._status !== 'draft')
          .map((i) => ({ note: i.note, project: i.project as Project }))
  if (entries.length === 0) return null

  const more =
    showLink && link ? (
      <CMSLink {...link} appearance="link" locale={locale}>
        <span aria-hidden="true" className="ml-[var(--space-xs)]">
          →
        </span>
      </CMSLink>
    ) : null

  if (layout === 'showcase') {
    return (
      <Showcase entries={entries} heading={heading} intro={intro} locale={locale} more={more} />
    )
  }

  return (
    <section className="section-l">
      <div className="container">
        <SectionHeading heading={heading} intro={intro} locale={locale} />
        {layout === 'list' ? (
          <ul className="border-t border-[var(--color-rule)]">
            {entries.map(({ note, project }) => (
              <li className="relative border-b border-[var(--color-rule)]" key={project.id}>
                <div className="grid gap-[var(--space-xs)] py-[var(--space-lg)] md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-[var(--gap-columns)]">
                  <h3 className="h-title">
                    <Link
                      className="after:absolute after:inset-0 after:content-[''] hover:text-[var(--color-accent)]"
                      href={projectHref(locale, project.slug)}
                    >
                      {project.title}
                    </Link>
                  </h3>
                  <p className="text-[var(--color-ink-2)]">{note || project.abstract}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid gap-x-[var(--gap-columns)] gap-y-[var(--space-3xl)] md:grid-cols-2">
            {entries.map(({ note, project }) => (
              <li key={project.id}>
                <ProjectCard locale={locale} note={note} project={project} />
              </li>
            ))}
          </ul>
        )}
        {more && <div className="mt-[var(--space-2xl)]">{more}</div>}
      </div>
    </section>
  )
}

/**
 * The work on the dark band: each project a large live site with the phone version
 * beside it, alternating sides, the story in a narrow column. This is the page's
 * signature: real client sites, running today, scrolling by themselves.
 */
function Showcase({
  entries,
  heading,
  intro,
  locale,
  more,
}: {
  entries: Entry[]
  heading?: string | null
  intro?: string | null
  locale: Locale
  more: React.ReactNode
}) {
  const t = ui(locale).projects
  return (
    <section className="field py-[calc(var(--section-gap)*0.7)]" id="werk">
      <div className="container">
        <SectionHeading heading={heading} intro={intro} locale={locale} />
        <ol className="grid gap-[var(--section-gap-s)]">
          {entries.map(({ note, project }, i) => {
            const { cover, desktop, phone } = projectVisual(project)
            const flip = i % 2 === 1
            return (
              <li
                className="grid items-center gap-[var(--space-xl)] lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] lg:gap-[var(--space-2xl)]"
                key={project.id}
              >
                <div className={cn('relative', flip && 'lg:order-2')}>
                  {desktop ? (
                    <LiveSite
                      domain={domainOf(project.liveUrl)}
                      image={desktop}
                      labels={{ pause: t.pause, play: t.play }}
                      priority={i === 0}
                      sizes="(min-width: 1240px) 760px, (min-width: 1024px) 62vw, 92vw"
                    />
                  ) : (
                    cover && <ProjectCard locale={locale} project={project} />
                  )}
                  {phone && (
                    <LiveSite
                      className={cn(
                        'absolute bottom-[-8%] hidden w-[22%] md:block',
                        flip ? 'left-[-4%]' : 'right-[-4%]',
                      )}
                      image={phone}
                      labels={{ pause: t.pause, play: t.play }}
                      sizes="180px"
                      variant="phone"
                    />
                  )}
                </div>
                <div className={cn('flex flex-col gap-[var(--space-sm)]', flip && 'lg:order-1')}>
                  <p className="small flex flex-wrap gap-x-[var(--space-md)]">
                    {project.sector && <span>{project.sector}</span>}
                    {project.period && <span>{project.period}</span>}
                  </p>
                  <h3 className="h-title">{project.title}</h3>
                  <p className="text-[var(--color-ink-2)]">{note || project.abstract}</p>
                  {statusLabel(locale, project.status) && (
                    <p className="small">{statusLabel(locale, project.status)}</p>
                  )}
                  <Link
                    className="btn btn-ghost mt-[var(--space-sm)] w-fit"
                    href={projectHref(locale, project.slug)}
                  >
                    {t.read}
                  </Link>
                </div>
              </li>
            )
          })}
        </ol>
        {more && <div className="mt-[var(--space-2xl)]">{more}</div>}
      </div>
    </section>
  )
}
