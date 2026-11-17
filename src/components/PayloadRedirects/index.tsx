import type React from 'react'
import type { Page, Post } from '@/payload-types'

import { contentLocale, type Locale } from '@/lib/locales'
import { docHref } from '@/lib/routing'

import { getCachedDocument } from '@/utilities/getDocument'
import { getCachedRedirects } from '@/utilities/getRedirects'
import { notFound, redirect } from 'next/navigation'

interface Props {
  disableNotFound?: boolean
  locale?: Locale
  url: string
}

/* This component helps us with SSR based dynamic redirects */
export const PayloadRedirects: React.FC<Props> = async ({
  disableNotFound,
  locale = contentLocale,
  url,
}) => {
  const redirects = await getCachedRedirects()()

  const redirectItem = redirects.find((redirect) => redirect.from === url)

  if (redirectItem) {
    if (redirectItem.to?.url) {
      redirect(redirectItem.to.url)
    }

    const ref = redirectItem.to?.reference
    const doc =
      typeof ref?.value === 'string'
        ? ((await getCachedDocument(ref.relationTo, ref.value)()) as Page | Post)
        : ref?.value
    const redirectUrl = ref ? docHref(locale, ref.relationTo, doc as never) : null

    if (redirectUrl) redirect(redirectUrl)
  }

  if (disableNotFound) return null

  notFound()
}
