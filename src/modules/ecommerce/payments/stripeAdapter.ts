import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'

import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'
import Stripe from 'stripe'

import { runtimeEnv } from '@/utilities/runtimeEnv'

import { getMissingLegalPages } from '../utilities/legalPages'
import { STRIPE_API_VERSION } from '../utilities/stripe'
import { markPaymentCancelled, settleStripePayment } from './settle'

/** Bancontact + cards, set explicitly (independent of the Stripe dashboard's defaults). */
export const PAYMENT_METHOD_TYPES = ['bancontact', 'card'] as const

const stripeClient = (secretKey: string) =>
  new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION, appInfo: { name: 'brentweb-starter' } })

/**
 * The plugin's Stripe adapter with three changes:
 * - initiatePayment: explicit Bancontact + card, legal checks (terms accepted, legal pages
 *   configured) and the acceptance timestamp in the PaymentIntent metadata;
 * - webhooks: `payment_intent.succeeded` creates the order server-side (settle.ts), so a
 *   customer closing the browser during the Bancontact redirect still gets an order;
 * - Dutch label.
 *
 * Keys are read when the plugin is built (server start), from the runtime env.
 */
export const shopStripeAdapter = (): PaymentAdapter => {
  const secretKey = runtimeEnv('STRIPE_SECRET_KEY') ?? ''
  const publishableKey = runtimeEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY') ?? ''
  const webhookSecret = runtimeEnv('STRIPE_WEBHOOKS_SIGNING_SECRET')

  const base = stripeAdapter({
    apiVersion: STRIPE_API_VERSION,
    label: 'Bancontact / kaart',
    publishableKey,
    secretKey,
    webhookSecret,
    webhooks: {
      'payment_intent.succeeded': async ({ event, req }) => {
        await settleStripePayment({
          payload: req.payload,
          paymentIntent: event.data.object as Stripe.PaymentIntent,
        })
      },
      'payment_intent.canceled': async ({ event, req }) => {
        await markPaymentCancelled({
          payload: req.payload,
          paymentIntent: event.data.object as Stripe.PaymentIntent,
        })
      },
      'payment_intent.payment_failed': ({ event, req }) => {
        const intent = event.data.object as Stripe.PaymentIntent
        req.payload.logger.info(
          `Payment attempt failed for ${intent.id}: ${intent.last_payment_error?.message ?? 'unknown'}`,
        )
      },
    },
  })

  const initiatePayment: PaymentAdapter['initiatePayment'] = async ({
    data,
    req,
    transactionsSlug,
  }) => {
    const { payload } = req
    const { billingAddress, cart, currency, customerEmail, shippingAddress } = data
    const body = (req.data ?? {}) as { acceptedTerms?: unknown }

    if (!secretKey) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY).')
    if (body.acceptedTerms !== true)
      throw new Error('De algemene voorwaarden moeten aanvaard worden.')
    const missing = await getMissingLegalPages(payload)
    if (missing.length > 0)
      throw new Error(`Checkout geblokkeerd: ontbrekende pagina's (${missing.join(', ')}).`)
    if (!cart?.items?.length) throw new Error('Winkelmand is leeg.')
    if (!customerEmail || typeof customerEmail !== 'string')
      throw new Error('E-mailadres is verplicht.')
    if (currency !== 'EUR') throw new Error('Enkel EUR wordt ondersteund.')

    const amount = cart.subtotal
    if (typeof amount !== 'number' || amount <= 0) throw new Error('Ongeldig bedrag.')

    const stripe = stripeClient(secretKey)

    const items = cart.items.map((item) => {
      const product = typeof item.product === 'object' ? item.product.id : item.product
      const variant = item.variant
        ? typeof item.variant === 'object'
          ? item.variant.id
          : item.variant
        : undefined
      return { product, quantity: item.quantity, ...(variant ? { variant } : {}) }
    })

    const existing = (await stripe.customers.list({ email: customerEmail, limit: 1 })).data[0]
    const customer = existing ?? (await stripe.customers.create({ email: customerEmail }))

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      customer: customer.id,
      payment_method_types: [...PAYMENT_METHOD_TYPES],
      receipt_email: customerEmail,
      metadata: {
        cartID: String(cart.id),
        cartItemsSnapshot: JSON.stringify(items),
        shippingAddress: JSON.stringify(shippingAddress ?? {}),
        termsAcceptedAt: new Date().toISOString(),
        site: runtimeEnv('CLIENT_SLUG') ?? '',
      },
    })

    await payload.create({
      // Our config keeps the plugin's default slug.
      collection: transactionsSlug as 'transactions',
      data: {
        ...(req.user ? { customer: req.user.id } : { customerEmail }),
        amount: paymentIntent.amount,
        billingAddress,
        cart: cart.id,
        currency: 'EUR',
        items,
        paymentMethod: 'stripe',
        status: 'pending',
        stripe: { customerID: customer.id, paymentIntentID: paymentIntent.id },
      },
      overrideAccess: true,
      req,
    })

    return {
      clientSecret: paymentIntent.client_secret ?? '',
      message: 'Payment initiated',
      paymentIntentID: paymentIntent.id,
    }
  }

  return { ...base, initiatePayment, label: 'Bancontact / kaart' }
}
