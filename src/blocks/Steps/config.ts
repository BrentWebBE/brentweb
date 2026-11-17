import type { Block } from 'payload'

import { eyebrowField, headingField, introField } from '@/fields/heading'
import { link } from '@/fields/link'
import { l } from '@/utilities/label'

/** Numbered steps: how a project goes, what happens after a form. */
export const Steps: Block = {
  slug: 'steps',
  interfaceName: 'StepsBlock',
  labels: {
    singular: l('Stappen', 'Steps'),
    plural: l('Stappen', 'Steps'),
  },
  fields: [
    eyebrowField(),
    headingField({ required: true }),
    introField(),
    {
      name: 'steps',
      type: 'array',
      label: l('Stappen', 'Steps'),
      minRows: 1,
      required: true,
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', label: l('Titel', 'Title'), required: true },
        { name: 'body', type: 'textarea', label: l('Tekst', 'Text') },
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
