import React from 'react'

import type { HeroBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Greeting } from '@/components/handmade/Greeting'
import { Marked } from '@/components/handmade/Marked'
import { Note } from '@/components/handmade/Note'
import { Polaroid } from '@/components/handmade/Polaroid'
import { SCOPE_DEFINITIONS } from '@/lib/calculator/pricing'
import type { Locale } from '@/lib/locales'
import { fillPrices, formatPriceRange } from '@/lib/prices'
import type { ScopeKey } from '@/lib/schemas/lead'
import { fill, ui } from '@/lib/ui-strings'

type HeroProps = Props & { locale: Locale }

export function HeroBlock(props: HeroProps) {
  return props.variant === 'home' ? <HomeHero {...props} /> : <PageHero {...props} />
}

function Links({ links, locale }: Pick<HeroProps, 'links' | 'locale'>) {
  if (!links?.length) return null
  return (
    <div className="flex flex-wrap items-center gap-4">
      {links.map(({ id, link }, i) => (
        <CMSLink
          key={id ?? i}
          {...link}
          appearance={i === 0 ? 'button' : 'arrow'}
          locale={locale}
        />
      ))}
    </div>
  )
}

function TrustItems({ items }: { items: HeroProps['trustItems'] }) {
  if (!items?.length) return null
  return (
    <ul className="list-ticks mt-8 sm:flex sm:flex-wrap sm:gap-x-8">
      {items.map(({ id, text }) => (
        <li key={id ?? text}>{text}</li>
      ))}
    </ul>
  )
}

/** The homepage: a greeting, a person, a photo taped to the page. */
function HomeHero({
  greeting,
  greetingSuffix,
  image,
  imageCaption,
  intro,
  links,
  locale,
  note,
  title,
  trustItems,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden pb-12 pt-10 md:pb-20 md:pt-16">
      <div className="container grid items-center gap-14 lg:grid-cols-[1.35fr_1fr]">
        <div>
          {greeting && (
            <p className="hand mb-4 -rotate-2 text-3xl text-primary md:text-4xl">
              <Greeting locale={locale} />
              {greetingSuffix}
            </p>
          )}
          <h1 className="display-1 mb-6">
            <Marked text={title} />
          </h1>
          {intro && <p className="lede mb-9 whitespace-pre-line">{fillPrices(intro, locale)}</p>}
          <Links links={links} locale={locale} />
          <TrustItems items={trustItems} />
        </div>

        {image && typeof image === 'object' && (
          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <Polaroid
              caption={imageCaption}
              image={image}
              priority
              sizes="(min-width: 1024px) 26rem, 80vw"
              tilt={3}
            />
            {note && (
              <Note arrow="right" className="absolute -bottom-8 -left-2 md:-left-20" tilt={-5}>
                {note}
              </Note>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

/** Service, local and standalone pages: a smaller, still personal top. */
function PageHero({
  eyebrow,
  image,
  imageCaption,
  intro,
  links,
  locale,
  note,
  paragraphs,
  priceScopes,
  title,
  trustItems,
}: HeroProps) {
  const t = ui(locale)
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
  const hasImage = image && typeof image === 'object'

  return (
    <section className="pb-10 pt-12 md:pb-14 md:pt-20">
      <div
        className={
          hasImage ? 'container grid items-center gap-12 lg:grid-cols-[1.4fr_1fr]' : 'container'
        }
      >
        <div className="max-w-3xl">
          {eyebrow && <p className="eyebrow mb-3 -rotate-2">{eyebrow}</p>}
          <h1 className="display-1 mb-6 !text-[clamp(2.3rem,5.2vw,4rem)]">
            <Marked text={title} />
          </h1>
          {intro && <p className="lede mb-6 whitespace-pre-line">{fillPrices(intro, locale)}</p>}
          {paragraphs?.map(({ id, text }) => (
            <p className="mb-4 max-w-2xl text-lg" key={id ?? text}>
              {fillPrices(text, locale)}
            </p>
          ))}

          {price && (
            <dl className="paper-card my-8 inline-grid grid-cols-2 gap-x-8 gap-y-1 px-6 py-4">
              <dt className="hand text-lg text-muted-foreground">{t.price.label}</dt>
              <dt className="hand text-lg text-muted-foreground">{t.price.duration}</dt>
              <dd className="font-heading text-2xl">{price.range}</dd>
              <dd className="font-heading text-2xl">{price.weeks}</dd>
            </dl>
          )}

          <div className="mt-2">
            <Links links={links} locale={locale} />
          </div>
          <TrustItems items={trustItems} />
        </div>

        {hasImage && (
          <div className="relative mx-auto w-full max-w-sm">
            <Polaroid caption={imageCaption} image={image} priority tilt={2.5} />
            {note && (
              <Note arrow="right" className="absolute -bottom-6 -left-8" tilt={-4}>
                {note}
              </Note>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
