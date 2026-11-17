import type { Block } from 'payload'

import { eyebrowField, headingField, introField } from '@/fields/heading'
import { l } from '@/utilities/label'

/**
 * The free website check: either a one-line banner that hands the typed URL to the
 * check page, or the full request form. Form labels and validation are code.
 */
export const WebsiteCheck: Block = {
  slug: 'websiteCheck',
  interfaceName: 'WebsiteCheckBlock',
  labels: {
    singular: l('Gratis websitecheck', 'Free website check'),
    plural: l('Gratis websitecheck', 'Free website check'),
  },
  fields: [
    {
      name: 'variant',
      type: 'radio',
      label: l('Weergave', 'Variant'),
      defaultValue: 'banner',
      options: [
        { label: l('Banner (één regel)', 'Banner (one line)'), value: 'banner' },
        { label: l('Volledig formulier', 'Full form'), value: 'form' },
      ],
      admin: { layout: 'horizontal' },
    },
    eyebrowField(),
    headingField(),
    introField(),
    {
      name: 'checkPage',
      type: 'relationship',
      relationTo: 'pages',
      label: l('Pagina met het formulier', 'Page with the form'),
      admin: {
        condition: (_, siblingData) => siblingData?.variant === 'banner',
        description: l(
          'De banner stuurt het ingevulde adres door naar deze pagina.',
          'The banner sends the typed address to this page.',
        ),
      },
    },
  ],
}
