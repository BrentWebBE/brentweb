import React from 'react'

import type { HeroBlock as Props, Media as MediaDoc, Project } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { LiveSite } from '@/components/projects/LiveSite'
import { domainOf, projectVisual } from '@/components/projects/visual'
import { Media } from '@/components/Media'
import { Greeting } from '@/components/handmade/Greeting'
import { plainText } from '@/components/handmade/Marked'
import { SCOPE_DEFINITIONS } from '@/lib/calculator/pricing'
import type { Locale } from '@/lib/locales'
import { fillPrices, formatPriceRange } from '@/lib/prices'
import { homeHref } from '@/lib/routing'
import type { ScopeKey } from '@/lib/schemas/lead'
import { fill, ui } from '@/lib/ui-strings'
import { cn } from '@/utilities/ui'

type HeroProps = Props & {
  locale: Locale
  /** The home hero stands on the dark work band when that comes next. */
  nextIsShowcase?: boolean
}

export function HeroBlock(props: HeroProps) {
  return props.variant === 'home' ? <HomeHero {...props} /> : <PageHero {...props} />
}

function Actions({ links, locale }: Pick<HeroProps, 'links' | 'locale'>) {
  if (!links?.length) return null
  return (
    <div className="flex flex-wrap items-center gap-[var(--space-md)]">
      {links.map(({ id, link }, i) => (
        <CMSLink
          key={id ?? i}
          {...link}
          appearance={i === 0 ? 'button' : 'ghost'}
          locale={locale}
        />
      ))}
    </div>
  )
}

function Reassurances({ items }: { items: HeroProps['trustItems'] }) {
  if (!items?.length) return null
  return (
    <ul className="list-ticks mt-[var(--space-xl)] text-[length:var(--text-sm)] text-[var(--color-ink-2)]">
      {items.map(({ id, text }) => (
        <li key={id ?? text}>{text}</li>
      ))}
    </ul>
  )
}

/**
 * The homepage: who, what, and the person, in one screen. The portrait stands across
 * the seam onto the dark band where the client sites scroll.
 */
function HomeHero({
  greeting,
  greetingSuffix,
  image,
  imageCaption,
  intro,
  links,
  locale,
  nextIsShowcase,
  title,
  trustItems,
}: HeroProps) {
  const portrait = image && typeof image === 'object' ? (image as MediaDoc) : null
  return (
    <section
      className={cn(
        'relative pt-[var(--space-2xl)] md:pt-[var(--space-3xl)]',
        nextIsShowcase ? 'pb-[var(--space-3xl)] lg:pb-0' : 'pb-[var(--section-gap-s)]',
      )}
    >
      {nextIsShowcase && (
        <div
          aria-hidden="true"
          className="field absolute inset-x-0 bottom-0 hidden h-[calc(var(--space-4xl)-var(--space-lg))] lg:block"
        />
      )}
      <div className="container relative grid gap-[var(--space-2xl)] lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-[var(--space-3xl)]">
        <div className="lg:pb-[var(--space-4xl)] lg:pt-[var(--space-xl)]">
          <h1 className="display mb-[var(--space-lg)]">{plainText(title)}</h1>
          <p className="lede mb-[var(--space-xl)] whitespace-pre-line">
            {greeting && (
              <strong className="font-medium text-[var(--color-ink)]">
                <Greeting locale={locale} />
                {greetingSuffix}{' '}
              </strong>
            )}
            {intro && fillPrices(intro, locale)}
          </p>
          <Actions links={links} locale={locale} />
          <Reassurances items={trustItems} />
        </div>

        {portrait && (
          <figure className="mx-auto w-full max-w-[26rem] lg:mx-0 lg:ml-auto lg:self-end">
            <Media
              imgClassName="aspect-[4/5] w-full rounded-[var(--radius-card)] object-cover"
              priority
              resource={portrait}
              size="(min-width: 1024px) 26rem, 80vw"
            />
            {imageCaption && (
              <figcaption
                className={cn(
                  'small mt-[var(--space-sm)]',
                  nextIsShowcase && 'lg:text-[var(--color-field-muted)]',
                )}
              >
                {imageCaption}
              </figcaption>
            )}
          </figure>
        )}
      </div>
    </section>
  )
}

/** Service, local and standalone pages: breadcrumb, a big title, the facts, the action. */
function PageHero({
  eyebrow,
  image,
  imageCaption,
  intro,
  links,
  locale,
  paragraphs,
  priceScopes,
  showcaseProject,
  title,
  trustItems,
}: HeroProps) {
  const t = ui(locale)
  const live =
    showcaseProject && typeof showcaseProject === 'object'
      ? projectVisual(showcaseProject as Project).desktop
      : null
  const liveDomain =
    showcaseProject && typeof showcaseProject === 'object'
      ? domainOf((showcaseProject as Project).liveUrl)
      : null
  const scopes = (priceScopes ?? []) as ScopeKey[]
  const defs = scopes.map((s) => SCOPE_DEFINITIONS[s])
  const price = defs.length
    ? {
        range: formatPriceRange(
          Math.min(...defs.map((d) => d.minCost)),
          Math.max(...defs.map((d) => d.maxCost)),
          locale,
        ),
        weeks: fill(t.price.weeks, {
          min: Math.min(...defs.map((d) => d.minWeeks)),
          max: Math.max(...defs.map((d) => d.maxWeeks)),
        }),
      }
    : null
  const media = image && typeof image === 'object' ? (image as MediaDoc) : null

  return (
    <section className="pb-[var(--space-2xl)] pt-[var(--space-xl)] md:pb-[var(--space-3xl)] md:pt-[var(--space-2xl)]">
      <div
        className={cn(
          'container',
          (media || live) &&
            'grid gap-[var(--space-2xl)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center',
        )}
      >
        <div>
          <nav
            aria-label={locale === 'nl-BE' ? 'Kruimelpad' : 'Breadcrumb'}
            className="small mb-[var(--space-xl)]"
          >
            <ol className="flex flex-wrap gap-x-[var(--space-xs)]">
              <li>
                <a className="hover:text-[var(--color-ink)]" href={homeHref(locale)}>
                  {t.breadcrumbHome}
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">
                {eyebrow ? eyebrow.charAt(0).toUpperCase() + eyebrow.slice(1) : plainText(title)}
              </li>
            </ol>
          </nav>
          <h1 className="display-s mb-[var(--space-lg)] max-w-[22ch]">{plainText(title)}</h1>
          {intro && (
            <p className="lede mb-[var(--space-lg)] whitespace-pre-line">
              {fillPrices(intro, locale)}
            </p>
          )}
          {paragraphs?.map(({ id, text }) => (
            <p
              className="mb-[var(--space-md)] max-w-[62ch] text-[var(--color-ink-2)]"
              key={id ?? text}
            >
              {fillPrices(text, locale)}
            </p>
          ))}

          {price && (
            <dl className="my-[var(--space-xl)] grid max-w-md grid-cols-2 border-t border-[var(--color-rule)] pt-[var(--space-md)]">
              <div>
                <dt className="small">{t.price.label}</dt>
                <dd className="figure text-[length:var(--text-xl)] font-bold">{price.range}</dd>
              </div>
              <div className="border-l border-[var(--color-rule)] pl-[var(--space-lg)]">
                <dt className="small">{t.price.duration}</dt>
                <dd className="figure text-[length:var(--text-xl)] font-bold">{price.weeks}</dd>
              </div>
            </dl>
          )}

          <div className="mt-[var(--space-lg)]">
            <Actions links={links} locale={locale} />
          </div>
          <Reassurances items={trustItems} />
        </div>

        {live ? (
          <LiveSite
            domain={liveDomain}
            image={live}
            labels={{ pause: t.projects.pause, play: t.projects.play }}
            priority
            sizes="(min-width: 1024px) 34rem, 92vw"
          />
        ) : (
          media && (
            <figure className="mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto">
              <Media
                imgClassName="aspect-[4/5] w-full rounded-[var(--radius-card)] object-cover"
                priority
                resource={media}
                size="(min-width: 1024px) 24rem, 80vw"
              />
              {imageCaption && (
                <figcaption className="small mt-[var(--space-sm)]">{imageCaption}</figcaption>
              )}
            </figure>
          )
        )}
      </div>
    </section>
  )
}
