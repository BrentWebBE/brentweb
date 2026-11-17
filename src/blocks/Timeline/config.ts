import type { Block } from 'payload'

import { eyebrowField, headingField, introField } from '@/fields/heading'
import { l } from '@/utilities/label'

/** Experience as a hand-drawn timeline: work, school, hackathons. */
export const Timeline: Block = {
  slug: 'timeline',
  interfaceName: 'TimelineBlock',
  labels: {
    singular: l('Tijdlijn', 'Timeline'),
    plural: l('Tijdlijnen', 'Timelines'),
  },
  fields: [
    eyebrowField(),
    headingField(),
    introField(),
    {
      name: 'groups',
      type: 'array',
      label: l('Groepen', 'Groups'),
      minRows: 1,
      required: true,
      admin: { initCollapsed: true },
      fields: [
        { name: 'label', type: 'text', label: l('Groep', 'Group'), required: true },
        {
          name: 'entries',
          type: 'array',
          label: l('Items', 'Entries'),
          admin: { initCollapsed: true },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'period',
                  type: 'text',
                  label: l('Periode', 'Period'),
                  required: true,
                  admin: { width: '30%' },
                },
                {
                  name: 'title',
                  type: 'text',
                  label: l('Rol / titel', 'Role / title'),
                  required: true,
                  admin: { width: '40%' },
                },
                {
                  name: 'organisation',
                  type: 'text',
                  label: l('Waar', 'Where'),
                  admin: { width: '30%' },
                },
              ],
            },
            { name: 'description', type: 'textarea', label: l('Omschrijving', 'Description') },
            {
              name: 'note',
              type: 'text',
              label: l('Persoonlijke noot (handgeschreven)', 'Personal note (handwritten)'),
            },
            { name: 'tags', type: 'text', hasMany: true, label: l('Tags', 'Tags') },
            { name: 'current', type: 'checkbox', label: l('Huidig', 'Current') },
          ],
        },
      ],
    },
  ],
}
