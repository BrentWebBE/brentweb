import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { features } from '@/features'
import { ConfirmationPage, type ConfirmationArgs } from '@/modules/ecommerce/routes/ConfirmationPage'

export const metadata: Metadata = { title: 'Bestelling', robots: { index: false } }

export default async function Page(args: ConfirmationArgs) {
  if (!features.ecommerce) notFound()
  return <ConfirmationPage {...args} />
}
