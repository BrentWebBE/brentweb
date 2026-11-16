import Link from 'next/link'
import React from 'react'

import type { Project, ProjectsBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import { ProjectCard, StatusBadge } from '@/components/projects/ProjectCard'
import type { Locale } from '@/lib/locales'
import { projectHref } from '@/lib/routing'
import { getProjects } from '@/utilities/queries'

export async function ProjectsBlockComponent({
  eyebrow,
  heading,
  intro,
  items,
  layout,
  link,
  locale,
  mode,
  showLink,
}: Props & { locale: Locale }) {
  const entries: { note?: string | null; project: Project }[] =
    mode === 'all'
      ? (await getProjects(locale)).map((project) => ({ project }))
      : (items ?? [])
          .filter((i) => typeof i.project === 'object' && i.project?._status !== 'draft')
          .map((i) => ({ note: i.note, project: i.project as Project }))

  if (entries.length === 0) return null

  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} locale={locale} />

        {layout === 'list' ? (
          <ul className="grid gap-5">
            {entries.map(({ note, project }) => (
              <li
                className="paper-card relative p-6 md:flex md:items-start md:gap-8"
                key={project.id}
              >
                <div className="md:w-1/3">
                  <h3 className="display-3">
                    <Link
                      className="before:absolute before:inset-0 before:content-['']"
                      href={projectHref(locale, project.slug)}
                    >
                      {project.title}
                    </Link>
                  </h3>
                  <StatusBadge locale={locale} status={project.status} />
                </div>
                <p className="mt-3 text-muted-foreground md:mt-0 md:flex-1">
                  {note || project.abstract}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid gap-x-10 gap-y-16 md:grid-cols-2">
            {entries.map(({ note, project }, i) => (
              <li className={i % 2 ? 'md:mt-16' : undefined} key={project.id}>
                <ProjectCard index={i} locale={locale} note={note} project={project} />
              </li>
            ))}
          </ul>
        )}

        {showLink && link && (
          <div className="mt-12">
            <CMSLink {...link} appearance="arrow" locale={locale} />
          </div>
        )}
      </div>
    </section>
  )
}
