import type React from 'react'
import type { Page, Post } from '@/payload-types'

import { contentLocale, type Locale } from '@/lib/locales'
import { docHref } from '@/lib/routing'

import { getCachedDocument } from '@/utilities/getDocument'
import { getCachedRedirects } from '@/utilities/getRedirects'
import { notFound, permanentRedirect } from 'next/navigation'

interface Props {
  disableNotFound?: boolean
  locale?: Locale
  url: string
}

/* SSR redirects managed in Payload (Redirects collection). Permanent (308): they replace
   moved URLs, so search engines should move their ranking to the new address. */
export const PayloadRedirects: React.FC<Props> = async ({
  disableNotFound,
  locale = contentLocale,
  url,
}) => {
  const redirects = await getCachedRedirects()()

  const redirectItem = redirects.find((redirect) => redirect.from === url)

  if (redirectItem) {
    if (redirectItem.to?.url) {
      permanentRedirect(redirectItem.to.url)
    }

    const ref = redirectItem.to?.reference
    const doc =
      typeof ref?.value === 'string'
        ? ((await getCachedDocument(ref.relationTo, ref.value)()) as Page | Post)
        : ref?.value
    const redirectUrl = ref ? docHref(locale, ref.relationTo, doc as never) : null

    if (redirectUrl) permanentRedirect(redirectUrl)
  }

  if (disableNotFound) return null

  notFound()
}
