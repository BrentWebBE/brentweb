import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import type { Field, SelectFieldSingleValidation } from 'payload'

import { isAdminUser } from '@/access/roles'
import { l } from '@/utilities/label'

/** e.g. 20261116-7KQ2: sortable, readable on the phone. */
const generateOrderNumber = (): string => {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0')
  return `${date}-${random}`
}

/** Only admins may mark an order as refunded (refunds themselves happen in Stripe). */
const refundOnlyByAdmin = (field: Field): Field => {
  if (!('name' in field) || field.name !== 'status' || field.type !== 'select') return field
  const original = field.validate as SelectFieldSingleValidation | undefined
  const validate: SelectFieldSingleValidation = (value, options) => {
    const previous = (options as { previousValue?: unknown }).previousValue
    if (value === 'refunded' && previous !== 'refunded' && options.req.user && !isAdminUser(options.req.user)) {
      return 'Enkel een beheerder kan een bestelling als terugbetaald markeren.'
    }
    return original ? original(value, options) : true
  }
  return { ...field, validate } as Field
}

export const ordersCollectionOverride: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    defaultColumns: ['orderNumber', 'customerEmail', 'amount', 'status', 'createdAt'],
    group: l('Webshop', 'Shop'),
    useAsTitle: 'orderNumber',
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      label: l('Bestelnummer', 'Order number'),
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
      hooks: {
        beforeValidate: [({ value, operation }) => (operation === 'create' && !value ? generateOrderNumber() : value)],
      },
    },
    {
      name: 'termsAcceptedAt',
      type: 'date',
      label: l('Voorwaarden aanvaard op', 'Terms accepted at'),
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    ...defaultCollection.fields.map(refundOnlyByAdmin),
  ],
})
