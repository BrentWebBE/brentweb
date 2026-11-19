import type { Block } from 'payload'

import { eyebrowField, headingField } from '@/fields/heading'
import { l } from '@/utilities/label'

/** "Klinkt dit bekend?": a problem in the visitor's words, and what fixes it. */
export const PainPoints: Block = {
  slug: 'painPoints',
  interfaceName: 'PainPointsBlock',
  labels: {
    singular: l('Herkenbare problemen', 'Pain points'),
    plural: l('Herkenbare problemen', 'Pain points'),
  },
  fields: [
    eyebrowField(),
    headingField({ required: true }),
    {
      name: 'items',
      type: 'array',
      label: l('Problemen', 'Problems'),
      minRows: 1,
      maxRows: 6,
      required: true,
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'problem',
          type: 'text',
          label: l('Probleem (in woorden van de klant)', "Problem (in the client's words)"),
          required: true,
        },
        { name: 'fix', type: 'textarea', label: l('Oplossing', 'Fix'), required: true },
        {
          name: 'linkLabel',
          type: 'text',
          label: l('Linktekst (het resultaat)', 'Link label (the outcome)'),
          admin: {
            description: l(
              'Bv. "Bestellingen automatiseren". Leeg = de algemene linktekst hieronder.',
              'E.g. "Automate orders". Empty = the general link label below.',
            ),
          },
        },
        {
          name: 'project',
          type: 'relationship',
          relationTo: 'projects',
          label: l(
            'Project waar ik dit oploste (optioneel)',
            'Project where I solved this (optional)',
          ),
          admin: {
            description: l(
              'Enkel werk dat echt in gebruik was. Er verschijnt een link onder het probleem.',
              'Only work that actually ran. A link appears under the problem.',
            ),
          },
        },
      ],
    },
    {
      name: 'caseLinkLabel',
      type: 'text',
      label: l('Linktekst naar het project', 'Link label to the project'),
      admin: {
        description: l('{client} wordt de naam van de klant.', '{client} becomes the client name.'),
      },
    },
    {
      name: 'linkLabel',
      type: 'text',
      label: l(
        'Linktekst naar het contactformulier (standaard)',
        'Link label to the contact form (default)',
      ),
      admin: {
        description: l(
          'Klikt iemand hierop, dan staat het probleem al ingevuld in het contactformulier.',
          'Clicking it prefills the contact form with the problem.',
        ),
      },
    },
  ],
}
