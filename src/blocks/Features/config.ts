import type { Block } from 'payload'

import { eyebrowField, headingField, introField, PRICE_HELP } from '@/fields/heading'
import { link } from '@/fields/link'
import { l } from '@/utilities/label'

/**
 * A list of short items: what's included, who it's for, what I need from you,
 * how I secure a site. One block, a few looks.
 */
export const Features: Block = {
  slug: 'features',
  interfaceName: 'FeaturesBlock',
  labels: {
    singular: l('Opsomming', 'Feature list'),
    plural: l('Opsommingen', 'Feature lists'),
  },
  fields: [
    eyebrowField(),
    headingField(),
    introField({ admin: { description: PRICE_HELP } }),
    {
      name: 'style',
      type: 'select',
      label: l('Stijl', 'Style'),
      defaultValue: 'cards',
      options: [
        { label: l('Papieren kaartjes', 'Paper cards'), value: 'cards' },
        { label: l('Lijst met vinkjes', 'Ticked list'), value: 'ticks' },
        { label: l('Compacte rij', 'Compact row'), value: 'compact' },
      ],
    },
    {
      name: 'background',
      type: 'checkbox',
      label: l('Kraftpapier-achtergrond', 'Kraft paper background'),
    },
    {
      name: 'items',
      type: 'array',
      label: l('Items', 'Items'),
      minRows: 1,
      required: true,
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', label: l('Titel', 'Title') },
        {
          name: 'body',
          type: 'textarea',
          label: l('Tekst', 'Text'),
          admin: { description: PRICE_HELP },
        },
      ],
    },
    { name: 'enableLink', type: 'checkbox', label: l('Link toevoegen', 'Add link') },
    link({
      appearances: false,
      overrides: {
        admin: { condition: (_, siblingData) => Boolean(siblingData?.enableLink) },
      },
    }),
  ],
}
