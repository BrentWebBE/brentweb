import type { Block } from 'payload'

import { eyebrowField, headingField, introField } from '@/fields/heading'
import { l } from '@/utilities/label'

/** The full price table per project type (from code), for the pricing page. */
export const PricingTable: Block = {
  slug: 'pricingTable',
  interfaceName: 'PricingTableBlock',
  labels: {
    singular: l('Prijstabel', 'Price table'),
    plural: l('Prijstabellen', 'Price tables'),
  },
  fields: [eyebrowField(), headingField({ required: true }), introField()],
}
