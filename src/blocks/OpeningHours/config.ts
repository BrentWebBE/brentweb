import type { Block } from 'payload'

import { l } from '@/utilities/label'

export const OpeningHours: Block = {
  slug: 'openingHours',
  interfaceName: 'OpeningHoursBlock',
  labels: {
    singular: l('Openingsuren', 'Opening hours'),
    plural: l('Openingsuren', 'Opening hours'),
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: l('Titel', 'Heading'),
      defaultValue: 'Openingsuren',
    },
    {
      name: 'intro',
      type: 'textarea',
      label: l('Inleiding', 'Intro'),
      admin: {
        description: l(
          'De uren zelf beheer je in Instellingen → Bedrijfsgegevens → Openingsuren.',
          'Manage the hours themselves in Settings → Site settings → Opening hours.',
        ),
      },
    },
  ],
}
