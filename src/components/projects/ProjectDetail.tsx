import Link from 'next/link'
import React from 'react'

import type { Project } from '@/payload-types'

import { JsonLd } from '@/components/JsonLd'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { businessId, personId } from '@/components/seo/schema'
import type { Locale } from '@/lib/locales'
import { homeHref, projectHref, projectsHref } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'
import { getServerSideURL } from '@/utilities/getURL'
import { getProjects, getTestimonials } from '@/utilities/queries'

import { LiveSite } from './LiveSite'
import { statusLabel } from './ProjectCard'
import { domainOf, projectVisual } from './visual'

const hasContent = (state: Project['body']) =>
  Boolean(
    state?.root?.children?.some((c) => {
      const node = c as { children?: unknown[]; type?: string }
      return node.type !== 'paragraph' || (node.children?.length ?? 0) > 0
    }),
  )

/**
 * One case study. The live site first, then the story for the client; the engineering
 * side (what the old /tech pages carried) folds open underneath, so both readers get
 * one page.
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
  const { cover, desktop, phone } = projectVisual(project)
  const tech = project.technical
  const hasTech = Boolean(
    tech?.summary || tech?.decisions?.length || hasContent(tech?.body) || tech?.tags?.length,
  )
  const origin = getServerSideURL()
  const url = `${origin}${projectHref(locale, project.slug)}`
  const status = statusLabel(locale, project.status)
  // The write-up may set the same figures in its own metric grid: show them once.
  const bodyHasMetrics = JSON.stringify(project.body ?? {}).includes('"blockType":"metricGrid"')
  const metrics = bodyHasMetrics ? [] : (project.metrics ?? [])

  return (
    <article className="pb-[var(--section-gap-s)]">
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

      <header className="container pb-[var(--space-2xl)] pt-[var(--space-xl)] md:pt-[var(--space-2xl)]">
        <nav
          aria-label={locale === 'nl-BE' ? 'Kruimelpad' : 'Breadcrumb'}
          className="small mb-[var(--space-xl)]"
        >
          <ol className="flex flex-wrap gap-x-[var(--space-xs)]">
            <li>
              <Link className="hover:text-[var(--color-ink)]" href={projectsHref(locale)}>
                {t.all}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{project.title}</li>
          </ol>
        </nav>
        <div className="grid gap-[var(--space-xl)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-end lg:gap-[var(--space-3xl)]">
          <div>
            <h1 className="display-s mb-[var(--space-lg)]">{project.title}</h1>
            {(project.summary || project.abstract) && (
              <p className="lede">{project.summary || project.abstract}</p>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-x-[var(--space-lg)] gap-y-[var(--space-md)] border-t border-[var(--color-rule)] pt-[var(--space-md)]">
            {project.client && (
              <div>
                <dt className="small">{t.client}</dt>
                <dd>{project.client}</dd>
              </div>
            )}
            {project.period && (
              <div>
                <dt className="small">{t.period}</dt>
                <dd>{project.period}</dd>
              </div>
            )}
            {project.sector && (
              <div>
                <dt className="small">
                  {locale === 'nl-BE' ? 'Soort project' : 'Kind of project'}
                </dt>
                <dd>{project.sector}</dd>
              </div>
            )}
            {status && (
              <div>
                <dt className="small">{t.status_label}</dt>
                <dd>{status}</dd>
              </div>
            )}
            {(project.liveUrl || tech?.githubUrl) && (
              <div className="col-span-2 flex flex-wrap gap-x-[var(--space-lg)] pt-[var(--space-xs)]">
                {project.liveUrl && (
                  <a
                    className="link"
                    href={project.liveUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {project.status === 'decommissioned' ? t.archive : t.visit}
                  </a>
                )}
                {tech?.githubUrl && (
                  <a
                    className="link"
                    href={tech.githubUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t.source}
                  </a>
                )}
              </div>
            )}
          </dl>
        </div>
      </header>

      {(desktop || cover) && (
        <div className="field py-[var(--space-3xl)]">
          <div className="container">
            <div className="grid items-start gap-[var(--space-xl)] md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
              {desktop ? (
                <LiveSite
                  domain={domainOf(project.liveUrl)}
                  image={desktop}
                  labels={{ pause: t.pause, play: t.play }}
                  priority
                  sizes="(min-width: 1240px) 860px, 70vw"
                />
              ) : (
                cover && (
                  <div className="site-frame">
                    <Media
                      imgClassName="w-full"
                      priority
                      resource={cover}
                      size="(min-width: 1240px) 860px, 92vw"
                    />
                  </div>
                )
              )}
              {phone && (
                <LiveSite
                  className="mx-auto hidden w-full max-w-[15rem] md:block"
                  image={phone}
                  labels={{ pause: t.pause, play: t.play }}
                  sizes="240px"
                  variant="phone"
                />
              )}
            </div>
            {desktop && <p className="small mt-[var(--space-lg)]">{t.liveNote}</p>}
          </div>
        </div>
      )}

      {(metrics.length > 0 || Boolean(project.outcomes?.length)) && (
        <section className="container grid gap-[var(--space-2xl)] py-[var(--space-3xl)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          {metrics.length > 0 && (
            <dl className="grid content-start gap-[var(--space-lg)] sm:grid-cols-2">
              {metrics.map((m, i) => (
                <div
                  className="flex flex-col-reverse border-t border-[var(--color-rule)] pt-[var(--space-md)]"
                  key={m.id ?? i}
                >
                  <dt className="small">{m.label}</dt>
                  <dd className="figure text-[length:var(--text-2xl)] font-bold">{m.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {project.outcomes && project.outcomes.length > 0 && (
            <div>
              <h2 className="h-title mb-[var(--space-md)]">{t.outcomes}</h2>
              <ul className="list-ticks">
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
          <p className="well p-[var(--space-lg)] text-[var(--color-ink-2)]">{t.noWriteUp}</p>
        )}
      </div>

      {quote && (
        <figure className="container-prose mt-[var(--space-3xl)]">
          <blockquote
            className="text-[length:var(--text-2xl)] font-medium leading-[1.3] tracking-[-0.015em]"
            lang={quote.lang || undefined}
          >
            “{quote.quote}”
          </blockquote>
          <figcaption className="small mt-[var(--space-md)]">
            {[quote.name, quote.role].filter(Boolean).join(', ') || quote.business}
          </figcaption>
        </figure>
      )}

      {hasTech && (
        <section className="container-prose mt-[var(--space-3xl)]">
          <details className="group border-y border-[var(--color-rule)]">
            <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-[var(--space-md)] py-[var(--space-md)] [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-[length:var(--text-xl)] font-bold tracking-[-0.015em]">
                  {t.technical}
                </span>
                <span className="small">{t.technicalHint}</span>
              </span>
              <svg
                aria-hidden="true"
                className="size-5 flex-none text-[var(--color-muted)] transition-transform duration-[var(--dur-short)] group-open:rotate-45"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
                viewBox="0 0 20 20"
              >
                <path d="M10 4v12M4 10h12" />
              </svg>
            </summary>
            <div className="pb-[var(--space-xl)]">
              {tech?.tags && tech.tags.length > 0 && (
                <div className="mb-[var(--space-lg)]">
                  <h3 className="small mb-[var(--space-xs)] font-medium">{t.stack}</h3>
                  <ul className="flex flex-wrap gap-[var(--space-xs)]">
                    {tech.tags.map((tag) => (
                      <li
                        className="rounded-[var(--radius-pill)] bg-[var(--color-paper-2)] px-[var(--space-sm)] py-[var(--space-3xs)] text-[length:var(--text-sm)]"
                        key={tag}
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tech?.summary && (
                <p className="mb-[var(--space-lg)] text-[var(--color-ink-2)]">{tech.summary}</p>
              )}
              {tech?.decisions && tech.decisions.length > 0 && (
                <div className="mb-[var(--space-lg)]">
                  <h3 className="small mb-[var(--space-xs)] font-medium">{t.decisions}</h3>
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

      <nav
        aria-label={locale === 'nl-BE' ? 'Verder' : 'Continue'}
        className="container mt-[var(--section-gap-s)] grid gap-[var(--space-xl)] border-t border-[var(--color-rule)] pt-[var(--space-2xl)] md:grid-cols-2 md:items-end"
      >
        <div>
          <Link className="btn btn-primary" href={`${homeHref(locale)}#contact`}>
            {t.contact}
          </Link>
        </div>
        {next && next.id !== project.id && (
          <div className="md:text-right">
            <p className="small">{t.next}</p>
            <Link
              className="text-[length:var(--text-xl)] font-bold tracking-[-0.015em] hover:text-[var(--color-accent)]"
              href={projectHref(locale, next.slug)}
            >
              {next.title}
            </Link>
          </div>
        )}
      </nav>
    </article>
  )
}
