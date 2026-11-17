import type { Block } from 'payload'

import { l } from '@/utilities/label'

/** A highlighted aside inside a case study ("the first three months were about…"). */
export const Callout: Block = {
  slug: 'callout',
  interfaceName: 'CalloutBlock',
  labels: { singular: l('Opvallend kader', 'Callout'), plural: l('Opvallende kaders', 'Callouts') },
  fields: [
    {
      name: 'text',
      type: 'textarea',
      label: l('Tekst', 'Text'),
      required: true,
    },
  ],
}
