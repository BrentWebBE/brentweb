import type { Block } from 'payload'

import { eyebrowField, headingField, PRICE_HELP } from '@/fields/heading'
import { linkGroup } from '@/fields/linkGroup'
import { SCOPE_OPTIONS } from '@/lib/scopes'
import { l } from '@/utilities/label'

/**
 * The top of a page.
 *  - `home`: the greeting, a big personal headline, a taped-on photo with a note.
 *  - `page`: eyebrow, title and intro for service, local and other pages, optionally
 *    with the price range and duration of the scopes the page sells.
 */
export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: {
    singular: l('Hero', 'Hero'),
    plural: l('Heroes', 'Heroes'),
  },
  fields: [
    {
      name: 'variant',
      type: 'radio',
      label: l('Soort', 'Variant'),
      defaultValue: 'page',
      options: [
        {
          label: l('Homepage (persoonlijk, met foto)', 'Homepage (personal, with photo)'),
          value: 'home',
        },
        { label: l('Gewone pagina', 'Regular page'), value: 'page' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'greeting',
      type: 'checkbox',
      label: l(
        'Begroeting volgens het uur ("Goeiemorgen")',
        'Time-of-day greeting ("Good morning")',
      ),
      defaultValue: true,
      admin: { condition: (_, siblingData) => siblingData?.variant === 'home' },
    },
    {
      name: 'greetingSuffix',
      type: 'text',
      label: l('Na de begroeting', 'After the greeting'),
      admin: {
        condition: (_, siblingData) => siblingData?.variant === 'home' && siblingData?.greeting,
        description: l('Bv. ", ik ben Brent."', 'E.g. ", I\'m Brent."'),
      },
    },
    eyebrowField({
      admin: { condition: (_, siblingData) => siblingData?.variant !== 'home' },
    }),
    headingField({ name: 'title', label: l('Titel (H1)', 'Title (H1)'), required: true }),
    {
      name: 'intro',
      type: 'textarea',
      label: l('Inleiding', 'Intro'),
      admin: { description: PRICE_HELP },
    },
    {
      name: 'paragraphs',
      type: 'array',
      label: l("Extra alinea's", 'Extra paragraphs'),
      admin: {
        initCollapsed: true,
        condition: (_, siblingData) => siblingData?.variant !== 'home',
      },
      fields: [{ name: 'text', type: 'textarea', label: l('Tekst', 'Text'), required: true }],
    },
    linkGroup({ overrides: { maxRows: 2 } }),
    {
      name: 'trustItems',
      type: 'array',
      label: l('Korte geruststellingen', 'Short reassurances'),
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description: l('Bv. "Vaste prijs vooraf".', 'E.g. "Fixed price up front".'),
      },
      fields: [{ name: 'text', type: 'text', label: l('Tekst', 'Text'), required: true }],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: l('Foto', 'Photo'),
          admin: { width: '50%' },
        },
        {
          name: 'imageCaption',
          type: 'text',
          label: l('Handgeschreven onderschrift', 'Handwritten caption'),
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'note',
      type: 'text',
      label: l('Handgeschreven notitie bij de foto', 'Handwritten note by the photo'),
      admin: { description: l('Bv. "dat ben ik!"', 'E.g. "that\'s me!"') },
    },
    {
      name: 'priceScopes',
      type: 'select',
      hasMany: true,
      label: l('Toon prijs en duur van', 'Show price and duration of'),
      options: SCOPE_OPTIONS,
      admin: {
        condition: (_, siblingData) => siblingData?.variant !== 'home',
        description: l(
          'De prijsvork komt uit de kostenraming.',
          'The price range comes from the estimator.',
        ),
      },
    },
  ],
}
