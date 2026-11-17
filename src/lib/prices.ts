import type { Locale } from '@/lib/locales'
import { PRICING, SCOPE_DEFINITIONS } from '@/lib/calculator/pricing'
import type { ScopeKey } from '@/lib/schemas/lead'

/**
 * The one place prices reach copy from.
 *
 * Every figure is derived from SCOPE_DEFINITIONS, the estimator's rule table,
 * so the homepage list, the service pages, the meta descriptions, the FAQ
 * answers and the structured data all move together when a rate or an hour
 * range changes. Copy never types an amount: it carries a placeholder such as
 * `{websiteRange}` and goes through fillPrices() before it is rendered.
 *
 * Placeholders (each also as `…Min` / `…Max`):
 *   {websiteRange}     website
 *   {webAppRange}      web app
 *   {apiRange}         API integration
 *   {automationRange}  automation
 *   {integrationsRange} API integration and automation together (service page)
 *   {fromPrice}        the lowest price of any scope
 *
 * Durations work the same way, as plain numbers for the copy to put units on:
 * `{websiteWeeksMin}` / `{websiteWeeksMax}` and so on for every name above. A
 * FAQ answer that typed "twee tot zes weken" next to a "1-6 weken" label was
 * the reason.
 */
const SCOPE_PARAM: Record<ScopeKey, string> = {
  website: 'website',
  web_app: 'webApp',
  api_integration: 'api',
  automation: 'automation',
}

function money(locale: Locale) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
}

/** "€ 425 - € 1.975" (nl-BE) / "€425 - €1,975" (en). */
export function formatPriceRange(min: number, max: number, locale: Locale): string {
  const format = money(locale).format
  return `${format(min)} - ${format(max)}`
}

/** Lowest and highest price over a set of scopes (all scopes when empty or omitted). */
export function priceBounds(scopes: readonly ScopeKey[] = []) {
  const keys = scopes.length ? scopes : (Object.keys(SCOPE_DEFINITIONS) as ScopeKey[])
  const defs = keys.map((scope) => SCOPE_DEFINITIONS[scope])
  return {
    min: Math.min(...defs.map((d) => d.minCost)),
    max: Math.max(...defs.map((d) => d.maxCost)),
  }
}

export function priceParams(locale: Locale): Record<string, string> {
  const format = money(locale).format
  const params: Record<string, string> = {}

  const add = (name: string, scopes: ScopeKey[]) => {
    const { min, max } = priceBounds(scopes)
    params[`${name}Min`] = format(min)
    params[`${name}Max`] = format(max)
    params[`${name}Range`] = formatPriceRange(min, max, locale)
    const defs = scopes.map((scope) => SCOPE_DEFINITIONS[scope])
    params[`${name}WeeksMin`] = String(Math.min(...defs.map((d) => d.minWeeks)))
    params[`${name}WeeksMax`] = String(Math.max(...defs.map((d) => d.maxWeeks)))
  }

  for (const scope of Object.keys(SCOPE_PARAM) as ScopeKey[]) add(SCOPE_PARAM[scope], [scope])
  add('integrations', ['api_integration', 'automation'])
  params.fromPrice = format(priceBounds().min)
  // Monthly maintenance after launch, from the same table (copy: {maintenanceBasic}).
  params.maintenanceBasic = format(PRICING.maintenance.basic)
  params.maintenanceActive = format(PRICING.maintenance.active)

  return params
}

/** Replaces the price placeholders in a message; other placeholders are left alone. */
export function fillPrices(text: string, locale: Locale): string {
  const params = priceParams(locale)
  return text.replace(/\{(\w+)\}/g, (match, key: string) => params[key] ?? match)
}

/** schema.org priceRange for the business as a whole. */
export function schemaPriceRange(): string {
  const { min, max } = priceBounds()
  return `€${min} - €${max}`
}

/**
 * Price and duration range over a set of scopes (e.g. the scopes a service page
 * sells). Pass the keys from src/lib/scopes.ts; an empty list means every scope.
 */
export function scopeRange(scopes: readonly ScopeKey[]) {
  const keys = scopes.length ? scopes : (Object.keys(SCOPE_DEFINITIONS) as ScopeKey[])
  const defs = keys.map((scope) => SCOPE_DEFINITIONS[scope])
  return {
    minCost: Math.min(...defs.map((d) => d.minCost)),
    maxCost: Math.max(...defs.map((d) => d.maxCost)),
    minWeeks: Math.min(...defs.map((d) => d.minWeeks)),
    maxWeeks: Math.max(...defs.map((d) => d.maxWeeks)),
  }
}
