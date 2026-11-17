import React from 'react'

import type { Locale } from '@/lib/locales'
import type { SiteSetting } from '@/payload-types'

import { JsonLd } from '@/components/JsonLd'

import { buildSiteSchemas } from './schema'

/** Business + Person on every page (identical everywhere; see schema.ts). */
export function SiteJsonLd({ settings }: { locale: Locale; settings: SiteSetting }) {
  return (
    <>
      {buildSiteSchemas(settings).map((data) => (
        <JsonLd data={data} key={String(data['@id'])} />
      ))}
    </>
  )
}
