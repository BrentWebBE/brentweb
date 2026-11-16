import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import { Button } from '@/components/ui/button'

import { ClearCartOnSuccess } from '../components/ClearCartOnSuccess'
import { shopRoutes } from '../config'
import { settleStripePayment } from '../payments/settle'
import { formatCents } from '../utilities/formatPrice'
import { getStripe } from '../utilities/stripe'

export type ConfirmationArgs = {
  searchParams: Promise<{ payment_intent?: string; payment_intent_client_secret?: string }>
}

const Shell: React.FC<{ title: string; children: React.ReactNode }> = ({ children, title }) => (
  <div className="container max-w-2xl pt-16 pb-24">
    <h1 className="font-heading mb-6 text-4xl">{title}</h1>
    <div className="flex flex-col items-start gap-4">{children}</div>
  </div>
)

/**
 * Stripe redirects here after card / Bancontact. The payment is verified server-side
 * (PaymentIntent fetched from Stripe, client secret must match), then settled with the
 * same idempotent function as the webhook.
 */
export async function ConfirmationPage({ searchParams }: ConfirmationArgs) {
  const { payment_intent: id, payment_intent_client_secret: secret } = await searchParams

  if (!id || !secret) {
    return (
      <Shell title="Bestelling niet gevonden">
        <p>We konden deze bestelling niet terugvinden.</p>
        <Button asChild>
          <Link href={shopRoutes.listing}>Naar de shop</Link>
        </Button>
      </Shell>
    )
  }

  const payload = await getPayload({ config: configPromise })
  let paymentIntent
  try {
    paymentIntent = await getStripe().paymentIntents.retrieve(id)
  } catch {
    paymentIntent = null
  }

  if (!paymentIntent || paymentIntent.client_secret !== secret) {
    return (
      <Shell title="Bestelling niet gevonden">
        <p>We konden deze betaling niet verifiëren.</p>
      </Shell>
    )
  }

  if (paymentIntent.status === 'processing') {
    return (
      <Shell title="Betaling wordt verwerkt">
        <meta content="5" httpEquiv="refresh" />
        <p>Je betaling wordt nog verwerkt. Deze pagina ververst automatisch.</p>
      </Shell>
    )
  }

  if (paymentIntent.status !== 'succeeded') {
    return (
      <Shell title="Betaling niet gelukt">
        <p>De betaling is geannuleerd of mislukt. Je winkelmand is bewaard; je kan het opnieuw proberen.</p>
        <Button asChild>
          <Link href={shopRoutes.checkout}>Opnieuw proberen</Link>
        </Button>
      </Shell>
    )
  }

  let orderNumber: string | null | undefined
  let amount: number | null | undefined
  let email: string | null | undefined
  try {
    const result = await settleStripePayment({ payload, paymentIntent })
    if (result.status === 'settled') {
      orderNumber = result.order.orderNumber
      amount = result.order.amount
      email = result.order.customerEmail
    }
  } catch (error) {
    payload.logger.error({ err: error, msg: `Confirmation page: settling ${id} failed` })
  }

  return (
    <Shell title="Bedankt voor je bestelling!">
      <ClearCartOnSuccess />
      <p>
        We hebben je betaling van <strong>{formatCents(amount ?? paymentIntent.amount_received)}</strong> goed ontvangen.
      </p>
      {orderNumber ? (
        <p>
          Je bestelnummer is <strong>{orderNumber}</strong>.
          {email ? ` Een bevestiging is onderweg naar ${email}.` : ''}
        </p>
      ) : (
        <p>Je bestelling wordt verwerkt; je ontvangt zo dadelijk een bevestiging per e-mail.</p>
      )}
      <Button asChild variant="outline">
        <Link href={shopRoutes.listing}>Verder winkelen</Link>
      </Button>
    </Shell>
  )
}
