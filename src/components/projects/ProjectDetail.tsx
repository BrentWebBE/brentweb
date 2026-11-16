import Link from 'next/link'
import React from 'react'

import type { Project } from '@/payload-types'

import { JsonLd } from '@/components/JsonLd'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { Note } from '@/components/handmade/Note'
import { Reveal } from '@/components/handmade/Reveal'
import { StatusBadge } from '@/components/projects/ProjectCard'
import { businessId, personId } from '@/components/seo/schema'
import type { Locale } from '@/lib/locales'
import { homeHref, projectHref, projectsHref } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'
import { getServerSideURL } from '@/utilities/getURL'
import { getProjects, getTestimonials } from '@/utilities/queries'

const hasContent = (state: Project['body']) =>
  Boolean(
    state?.root?.children?.some((c) => {
      const node = c as { children?: unknown[]; type?: string }
      return node.type !== 'paragraph' || (node.children?.length ?? 0) > 0
    }),
  )

/**
 * One case study. The story for the client comes first; the engineering side (what the
 * old /tech pages showed) folds open underneath, so both readers get one page.
 */
export async function ProjectDetail({ locale, project }: { locale: Locale; project: Project }) {
  const t = ui(locale).projects
  const [all, testimonials] = await Promise.all([getProjects(locale), getTestimonials(locale)])
  const index = all.findIndex((p) => p.id === project.id)
  const next = all.length > 1 ? all[(index + 1) % all.length] : null
  const quote = testimonials.find(
    (q) =>
      (typeof q.project === 'object' ? q.project?.id : q.project) === project.id && q.quote?.trim(),
  )
  const cover = typeof project.cover === 'object' ? project.cover : null
  const phone = typeof project.coverMobile === 'object' ? project.coverMobile : null
  const tech = project.technical
  const hasTech = Boolean(
    tech?.summary || tech?.decisions?.length || hasContent(tech?.body) || tech?.tags?.length,
  )
  const origin = getServerSideURL()
  const url = `${origin}${projectHref(locale, project.slug)}`

  return (
    <article className="pb-12">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          '@id': `${url}#work`,
          name: project.title,
          headline: project.title,
          description: project.abstract,
          url,
          inLanguage: locale,
          author: { '@id': personId() },
          publisher: { '@id': businessId() },
          image: cover?.url ? `${origin}${cover.url}` : undefined,
          datePublished: project.publishedAt || undefined,
          dateModified: project.updatedAt,
          keywords: tech?.tags?.join(', ') || undefined,
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: ui(locale).breadcrumbHome,
              item: `${origin}${homeHref(locale)}`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: t.all,
              item: `${origin}${projectsHref(locale)}`,
            },
            { '@type': 'ListItem', position: 3, name: project.title, item: url },
          ],
        }}
      />

      <header className="container pb-10 pt-10 md:pt-16">
        <Link className="link-hand text-sm text-muted-foreground" href={projectsHref(locale)}>
          ← {t.back}
        </Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow mb-3 -rotate-1">
              {[project.sector, project.period].filter(Boolean).join(' · ')}
            </p>
            <h1 className="display-1 mb-6 !text-[clamp(2.3rem,5.5vw,4.25rem)]">{project.title}</h1>
            {(project.summary || project.abstract) && (
              <p className="lede">{project.summary || project.abstract}</p>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {project.client && (
              <div>
                <dt className="hand text-lg text-muted-foreground">{t.client}</dt>
                <dd>{project.client}</dd>
              </div>
            )}
            <div>
              <dt className="hand text-lg text-muted-foreground">Status</dt>
              <dd>
                <StatusBadge locale={locale} status={project.status} />
              </dd>
            </div>
            <div className="col-span-2 flex flex-wrap gap-4 pt-2">
              {project.liveUrl && (
                <a
                  className="link-arrow"
                  href={project.liveUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t.visit}
                </a>
              )}
              {tech?.githubUrl && (
                <a
                  className="link-arrow"
                  href={tech.githubUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t.source}
                </a>
              )}
            </div>
          </dl>
        </div>
      </header>

      {cover && (
        <div className="container relative mb-16">
          <div className="sketch-frame">
            <div aria-hidden="true" className="sketch-frame__bar">
              <span />
              <span />
              <span />
            </div>
            <Media
              imgClassName="w-full"
              priority
              resource={cover}
              size="(min-width: 1280px) 76rem, 100vw"
            />
          </div>
          {phone && (
            <div className="absolute -bottom-10 right-8 hidden w-40 rotate-3 overflow-hidden rounded-[1.4rem] border-[5px] border-foreground shadow-[4px_5px_0_var(--shadow-ink)] md:block lg:w-48">
              <Media imgClassName="w-full" resource={phone} size="12rem" />
            </div>
          )}
        </div>
      )}

      {(project.metrics?.length || project.outcomes?.length) && (
        <section className="container mb-16 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          {project.metrics && project.metrics.length > 0 && (
            <dl className="grid content-start gap-4 sm:grid-cols-2">
              {project.metrics.map((m, i) => (
                <div className="paper-card flex flex-col-reverse px-5 py-4" key={m.id ?? i}>
                  <dt className="text-sm text-muted-foreground">{m.label}</dt>
                  <dd className="font-heading text-3xl text-primary">{m.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {project.outcomes && project.outcomes.length > 0 && (
            <div>
              <h2 className="hand mb-3 text-3xl text-primary">{t.outcomes}</h2>
              <ul className="list-ticks text-lg">
                {project.outcomes.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <div className="container-prose">
        {hasContent(project.body) ? (
          <RichText data={project.body!} enableGutter={false} locale={locale} />
        ) : (
          <p className="paper-sheet p-6 text-muted-foreground">{t.noWriteUp}</p>
        )}
      </div>

      {quote && (
        <Reveal className="container-prose mt-16" tilt={-1}>
          <figure className="paper-sheet relative px-7 pb-7 pt-9">
            <span aria-hidden="true" className="tape" />
            <blockquote
              className="font-heading text-2xl italic leading-relaxed"
              lang={quote.lang || undefined}
            >
              “{quote.quote}”
            </blockquote>
            <figcaption className="hand mt-5 text-2xl">
              — {[quote.name, quote.role].filter(Boolean).join(', ') || quote.business}
            </figcaption>
          </figure>
        </Reveal>
      )}

      {hasTech && (
        <section className="container-prose mt-16">
          <details className="paper-card group p-6 md:p-8">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block font-heading text-2xl">{t.technical}</span>
                <span className="hand text-xl text-muted-foreground">{t.technicalHint}</span>
              </span>
              <svg
                aria-hidden="true"
                className="size-7 flex-none text-primary transition-transform group-open:rotate-45"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2.4"
                viewBox="0 0 24 24"
              >
                <path d="M12.3 4.5c-.2 5-.1 10 .1 15M4.6 11.8c5 .3 10 .2 14.8-.2" />
              </svg>
            </summary>
            <div className="mt-6 border-t border-dashed border-border pt-6">
              {tech?.tags && tech.tags.length > 0 && (
                <div className="mb-5">
                  <h3 className="hand mb-2 text-xl text-muted-foreground">{t.stack}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {tech.tags.map((tag) => (
                      <li className="rounded-full border border-border px-3 py-1 text-sm" key={tag}>
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tech?.summary && <p className="mb-5 text-lg">{tech.summary}</p>}
              {tech?.decisions && tech.decisions.length > 0 && (
                <div className="mb-6">
                  <h3 className="hand mb-2 text-xl text-muted-foreground">{t.decisions}</h3>
                  <ul className="list-ticks">
                    {tech.decisions.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              {hasContent(tech?.body) && (
                <RichText data={tech!.body!} enableGutter={false} locale={locale} />
              )}
            </div>
          </details>
        </section>
      )}

      <nav className="container mt-20 flex flex-col items-start gap-6 border-t border-dashed border-border pt-10 md:flex-row md:items-center md:justify-between">
        <Link className="btn btn-primary" href={`${homeHref(locale)}#contact`}>
          {locale === 'nl-BE'
            ? 'Ook zoiets nodig? Vertel het me'
            : 'Need something like this? Tell me'}
        </Link>
        {next && next.id !== project.id && (
          <div className="relative text-right">
            <Note arrow="none" className="block text-lg" tilt={-2}>
              {t.next}
            </Note>
            <Link
              className="font-heading text-2xl hover:text-primary"
              href={projectHref(locale, next.slug)}
            >
              {next.title} →
            </Link>
          </div>
        )}
      </nav>
    </article>
  )
}
