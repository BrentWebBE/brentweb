import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { features } from '@/features'
import { CartPage } from '@/modules/ecommerce/routes/CartPage'

export const metadata: Metadata = { title: 'Winkelmand', robots: { index: false } }

export default async function Page() {
  if (!features.ecommerce) notFound()
  return <CartPage />
}
