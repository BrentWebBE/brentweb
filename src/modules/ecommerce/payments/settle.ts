import type Stripe from 'stripe'

import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
  type PayloadRequest,
} from 'payload'

import type { Order, Transaction } from '@/payload-types'

type OrderData = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>

import { sendOrderEmails } from '../emails/orderEmails'

type CartItemSnapshot = { product: string; variant?: string; quantity: number }

export type SettleResult =
  | { status: 'settled'; order: Order; created: boolean }
  | { status: 'pending'; paymentIntentStatus: Stripe.PaymentIntent.Status }

const WAIT_FOR_OTHER_SETTLEMENT_MS = 5000
const POLL_MS = 200

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const relationID = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value)
    return String((value as { id: unknown }).id)
  return undefined
}

const parseJSON = <T>(value: string | undefined, field: string): T => {
  if (!value) throw new Error(`PaymentIntent metadata "${field}" is missing`)
  return JSON.parse(value) as T
}

const findTransaction = async (
  payload: Payload,
  paymentIntentID: string,
): Promise<Transaction | undefined> => {
  const { docs } = await payload.find({
    collection: 'transactions',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { 'stripe.paymentIntentID': { equals: paymentIntentID } },
  })
  return docs[0]
}

const waitForOrder = async (
  payload: Payload,
  paymentIntentID: string,
): Promise<Order | undefined> => {
  const deadline = Date.now() + WAIT_FOR_OTHER_SETTLEMENT_MS
  while (Date.now() < deadline) {
    const transaction = await findTransaction(payload, paymentIntentID)
    const orderID = relationID(transaction?.order)
    if (orderID) {
      return payload.findByID({ collection: 'orders', id: orderID, depth: 0, overrideAccess: true })
    }
    await sleep(POLL_MS)
  }
  return undefined
}

/**
 * Turns a succeeded Stripe PaymentIntent into a paid order. Idempotent and safe to run
 * concurrently: the webhook (`payment_intent.succeeded`) and the confirmation page both
 * call it; an atomic claim on the transaction (pending → processing, no order yet)
 * makes sure exactly one of them creates the order and sends the e-mails.
 */
export const settleStripePayment = async ({
  payload,
  paymentIntent,
}: {
  payload: Payload
  paymentIntent: Stripe.PaymentIntent
}): Promise<SettleResult> => {
  if (paymentIntent.status !== 'succeeded') {
    return { status: 'pending', paymentIntentStatus: paymentIntent.status }
  }

  const transaction = await findTransaction(payload, paymentIntent.id)
  if (!transaction) throw new Error(`No transaction for PaymentIntent ${paymentIntent.id}`)

  const existingOrderID = relationID(transaction.order)
  if (existingOrderID) {
    const order = await payload.findByID({
      collection: 'orders',
      id: existingOrderID,
      depth: 0,
      overrideAccess: true,
    })
    return { status: 'settled', order, created: false }
  }

  // The amount actually paid must match what the transaction was created for.
  if (
    paymentIntent.amount_received !== transaction.amount ||
    paymentIntent.currency.toUpperCase() !== String(transaction.currency).toUpperCase()
  ) {
    throw new Error(`Amount/currency mismatch for PaymentIntent ${paymentIntent.id}`)
  }

  const items = parseJSON<CartItemSnapshot[]>(
    paymentIntent.metadata.cartItemsSnapshot,
    'cartItemsSnapshot',
  )
  const shippingAddress = paymentIntent.metadata.shippingAddress
    ? parseJSON<Record<string, unknown>>(paymentIntent.metadata.shippingAddress, 'shippingAddress')
    : undefined
  const termsAcceptedAt = paymentIntent.metadata.termsAcceptedAt || undefined

  const req: PayloadRequest = await createLocalReq({}, payload)
  const shouldCommit = await initTransaction(req)

  let order: Order
  try {
    const claimed = await payload.db.updateOne({
      collection: 'transactions',
      data: { status: 'processing' },
      options: { atomic: true },
      req,
      where: {
        and: [
          { id: { equals: transaction.id } },
          { status: { equals: 'pending' } },
          { order: { exists: false } },
        ],
      },
    })

    if (!claimed) {
      // Someone else (webhook or confirmation page) is settling this payment.
      if (shouldCommit) await killTransaction(req)
      const other = await waitForOrder(payload, paymentIntent.id)
      if (!other) throw new Error(`PaymentIntent ${paymentIntent.id} is being settled elsewhere`)
      return { status: 'settled', order: other, created: false }
    }

    order = await payload.create({
      collection: 'orders',
      data: {
        amount: transaction.amount,
        currency: transaction.currency,
        ...(relationID(transaction.customer)
          ? { customer: relationID(transaction.customer) }
          : { customerEmail: transaction.customerEmail }),
        items,
        shippingAddress: shippingAddress as OrderData['shippingAddress'],
        status: 'processing',
        termsAcceptedAt,
        transactions: [transaction.id],
      } satisfies OrderData,
      overrideAccess: true,
      req,
    })

    const cartID = relationID(transaction.cart)
    if (cartID) {
      await payload.update({
        collection: 'carts',
        id: cartID,
        data: { purchasedAt: new Date().toISOString() },
        overrideAccess: true,
        req,
      })
    }

    for (const item of items) {
      const collection = item.variant ? 'variants' : 'products'
      const id = item.variant ?? item.product
      // Same as the plugin: atomic decrement, products without stock tracking stay untouched.
      await payload.db.updateOne({
        collection,
        id,
        data: { inventory: { $inc: -item.quantity } },
        req,
      })
    }

    await payload.update({
      collection: 'transactions',
      id: transaction.id,
      data: { order: order.id, status: 'succeeded' },
      overrideAccess: true,
      req,
    })

    if (shouldCommit) await commitTransaction(req)
  } catch (error) {
    if (shouldCommit) await killTransaction(req)
    throw error
  }

  // After commit, and only by the settlement that created the order.
  try {
    await sendOrderEmails({ payload, order })
  } catch (error) {
    payload.logger.error({ err: error, msg: `Order ${order.orderNumber}: sending e-mails failed` })
  }

  payload.logger.info(`Order ${order.orderNumber} created for PaymentIntent ${paymentIntent.id}`)
  return { status: 'settled', order, created: true }
}

/**
 * Marks a pending transaction as cancelled (PaymentIntent canceled or expired).
 * Failed attempts are deliberately not recorded: a PaymentIntent stays usable after a
 * declined card, and the customer may still pay it on the checkout page.
 */
export const markPaymentCancelled = async ({
  payload,
  paymentIntent,
}: {
  payload: Payload
  paymentIntent: Stripe.PaymentIntent
}): Promise<void> => {
  await payload.db.updateOne({
    collection: 'transactions',
    data: { status: 'cancelled' },
    where: {
      and: [
        { 'stripe.paymentIntentID': { equals: paymentIntent.id } },
        { status: { equals: 'pending' } },
      ],
    },
  })
}
