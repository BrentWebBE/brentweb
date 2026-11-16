import type { SiteSetting } from '@/payload-types'

import { DAYS, type DayValue } from './options'

export type OpeningHoursEntry = NonNullable<SiteSetting['openingHours']>[number]

export type OpeningHoursDay = {
  day: DayValue
  label: string
  closed: boolean
  ranges: { open: string; close: string }[]
  notes: string[]
}

/** Groups opening hours per weekday (Mon→Sun), merging multiple rows for the same day. */
export const groupOpeningHours = (entries: SiteSetting['openingHours']): OpeningHoursDay[] => {
  const rows = entries ?? []

  return DAYS.map(({ value, nl }) => {
    const forDay = rows.filter((row) => row.day === value)
    const ranges = forDay
      .filter((row) => !row.closed && row.open && row.close)
      .map((row) => ({ open: row.open as string, close: row.close as string }))
      .sort((a, b) => a.open.localeCompare(b.open))

    return {
      day: value,
      label: nl,
      closed: forDay.length > 0 && ranges.length === 0,
      ranges,
      notes: forDay.map((row) => row.note).filter((note): note is string => Boolean(note)),
    }
  }).filter((day) => day.closed || day.ranges.length > 0 || day.notes.length > 0)
}
