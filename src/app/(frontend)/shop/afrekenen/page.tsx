import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { features } from '@/features'
import { CheckoutPage } from '@/modules/ecommerce/routes/CheckoutPage'

export const metadata: Metadata = { title: 'Afrekenen', robots: { index: false } }

export default async function Page() {
  if (!features.ecommerce) notFound()
  return <CheckoutPage />
}
