import React from 'react'

import type { SiteSetting } from '@/payload-types'

import { groupOpeningHours } from '@/SiteSettings/openingHours'
import { cn } from '@/utilities/ui'

export const OpeningHoursTable: React.FC<{
  className?: string
  openingHours: SiteSetting['openingHours']
}> = ({ className, openingHours }) => {
  const days = groupOpeningHours(openingHours)

  if (days.length === 0) {
    return <p className="text-muted-foreground">Openingsuren volgen binnenkort.</p>
  }

  return (
    <table className={cn('w-full text-left', className)}>
      <tbody className="divide-y divide-border">
        {days.map(({ closed, day, label, notes, ranges }) => (
          <tr key={day}>
            <th className="py-2 pr-4 font-medium" scope="row">
              {label}
            </th>
            <td className="py-2 tabular-nums">
              {closed
                ? 'Gesloten'
                : ranges.map(({ close, open }) => `${open} – ${close}`).join(', ')}
              {notes.length > 0 && (
                <span className="block text-sm text-muted-foreground">{notes.join(' · ')}</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
