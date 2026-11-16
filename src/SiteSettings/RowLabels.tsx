'use client'
import type { SiteSetting } from '@/payload-types'

import { type RowLabelProps, useRowLabel, useTranslation } from '@payloadcms/ui'

import { DAYS, SOCIAL_PLATFORMS } from './options'

type OpeningHoursRow = NonNullable<SiteSetting['openingHours']>[number]
type SocialLinkRow = NonNullable<SiteSetting['socialLinks']>[number]

export const OpeningHoursRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<OpeningHoursRow>()
  const { i18n } = useTranslation()
  const day = DAYS.find(({ value }) => value === data?.day)

  if (!day) return <div>{`#${(rowNumber ?? 0) + 1}`}</div>

  const dayLabel = i18n.language === 'en' ? day.en : day.nl
  const closedLabel = i18n.language === 'en' ? 'closed' : 'gesloten'
  const hours = data?.closed ? closedLabel : `${data?.open ?? '…'} – ${data?.close ?? '…'}`

  return <div>{`${dayLabel}: ${hours}`}</div>
}

export const SocialLinkRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<SocialLinkRow>()
  const platform = SOCIAL_PLATFORMS.find(({ value }) => value === data?.platform)

  return <div>{platform ? platform.label : `#${(rowNumber ?? 0) + 1}`}</div>
}
