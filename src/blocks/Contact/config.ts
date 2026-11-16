import type { Block } from 'payload'

import { eyebrowField, headingField, introField } from '@/fields/heading'
import { l } from '@/utilities/label'

/**
 * Contact section: the lead form (code: validation, CRM, mail), contact details from
 * the site settings, and a click-to-load map of the two places I work from.
 */
export const Contact: Block = {
  slug: 'contact',
  interfaceName: 'ContactBlock',
  labels: {
    singular: l('Contact', 'Contact'),
    plural: l('Contact', 'Contact'),
  },
  fields: [
    eyebrowField(),
    headingField({ required: true }),
    introField(),
    {
      name: 'messagePlaceholder',
      type: 'text',
      label: l('Voorbeeldtekst in het berichtveld', 'Message field placeholder'),
    },
    {
      name: 'formNote',
      type: 'text',
      label: l('Notitie onder het formulier', 'Note under the form'),
    },
    {
      name: 'showMap',
      type: 'checkbox',
      label: l('Kaart tonen', 'Show map'),
      defaultValue: true,
    },
  ],
}
