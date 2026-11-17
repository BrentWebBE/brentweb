'use client'

import { useSyncExternalStore } from 'react'

import type { Locale } from '@/lib/locales'

/**
 * "Goeiemorgen / Goeiemiddag / Goeienavond", from the visitor's own clock.
 *
 * The server can't know the visitor's time of day (and a cached page would freeze the
 * hour it was rendered), so the HTML carries a neutral greeting and the client swaps
 * in the right one after hydration via useSyncExternalStore's server snapshot.
 */
const GREETINGS: Record<
  Locale,
  { neutral: string; morning: string; afternoon: string; evening: string; night: string }
> = {
  'nl-BE': {
    neutral: 'Hallo',
    morning: 'Goeiemorgen',
    afternoon: 'Goeiemiddag',
    evening: 'Goeienavond',
    night: 'Nog wakker?',
  },
  en: {
    neutral: 'Hello',
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Still up?',
  },
}

/** The clock never notifies; the greeting is read once per render. */
const subscribe = () => () => {}

export function pickGreeting(locale: Locale, hour: number): string {
  const g = GREETINGS[locale]
  if (hour < 5) return g.night
  if (hour < 12) return g.morning
  if (hour < 18) return g.afternoon
  return g.evening
}

export function Greeting({ locale }: { locale: Locale }) {
  return useSyncExternalStore(
    subscribe,
    () => pickGreeting(locale, new Date().getHours()),
    () => GREETINGS[locale].neutral,
  )
}
