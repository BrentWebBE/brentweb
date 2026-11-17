import type { Block } from 'payload'

import { eyebrowField, headingField } from '@/fields/heading'
import { link } from '@/fields/link'
import { l } from '@/utilities/label'

export const TestimonialsBlock: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: {
    singular: l('Reviews', 'Testimonials'),
    plural: l('Reviews', 'Testimonials'),
  },
  fields: [
    eyebrowField(),
    headingField(),
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      label: l('Reviews', 'Testimonials'),
      admin: {
        description: l(
          'Leeg laten om alle zichtbare reviews te tonen.',
          'Leave empty to show every visible testimonial.',
        ),
      },
    },
    {
      name: 'enableLink',
      type: 'checkbox',
      label: l(
        'Link onder de reviews (bv. Google-reviews)',
        'Link under the reviews (e.g. Google reviews)',
      ),
    },
    link({
      appearances: false,
      overrides: { admin: { condition: (_, siblingData) => Boolean(siblingData?.enableLink) } },
    }),
  ],
}
