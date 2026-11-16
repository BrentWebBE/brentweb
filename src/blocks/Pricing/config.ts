import type { Block } from 'payload'

import { eyebrowField, headingField, PRICE_HELP } from '@/fields/heading'
import { link } from '@/fields/link'
import { l } from '@/utilities/label'

/**
 * Price ranges per type of project. The numbers come from the estimator's pricing
 * table in code (src/lib/calculator/pricing.ts); only the words are edited here.
 */
export const Pricing: Block = {
  slug: 'pricing',
  interfaceName: 'PricingBlock',
  labels: {
    singular: l('Prijzen (overzicht)', 'Pricing overview'),
    plural: l('Prijzen (overzicht)', 'Pricing overview'),
  },
  fields: [
    eyebrowField(),
    headingField({ required: true }),
    {
      name: 'note',
      type: 'textarea',
      label: l('Notitie onder de prijzen', 'Note under the prices'),
      admin: { description: PRICE_HELP },
    },
    {
      name: 'ctaTitle',
      type: 'text',
      label: l('Titel van het kaartje ernaast', 'Side card title'),
    },
    { name: 'ctaBody', type: 'textarea', label: l('Tekst van het kaartje', 'Side card text') },
    link({ appearances: false, overrides: { name: 'ctaLink', label: l('Knop', 'Button') } }),
  ],
}
