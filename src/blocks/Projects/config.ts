import type { Block } from 'payload'

import { eyebrowField, headingField, introField } from '@/fields/heading'
import { link } from '@/fields/link'
import { l } from '@/utilities/label'

/** Case studies: a hand-picked selection (with an optional note each) or all of them. */
export const ProjectsBlock: Block = {
  slug: 'projects',
  interfaceName: 'ProjectsBlock',
  labels: {
    singular: l('Projecten', 'Projects'),
    plural: l('Projecten', 'Projects'),
  },
  fields: [
    eyebrowField(),
    headingField(),
    introField(),
    {
      name: 'mode',
      type: 'radio',
      label: l('Welke projecten', 'Which projects'),
      defaultValue: 'selected',
      options: [
        { label: l('Zelf kiezen', 'Hand-picked'), value: 'selected' },
        { label: l('Alle gepubliceerde projecten', 'All published projects'), value: 'all' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'items',
      type: 'array',
      label: l('Projecten', 'Projects'),
      admin: {
        initCollapsed: true,
        condition: (_, siblingData) => siblingData?.mode !== 'all',
      },
      fields: [
        {
          name: 'project',
          type: 'relationship',
          relationTo: 'projects',
          label: l('Project', 'Project'),
          required: true,
        },
        {
          name: 'note',
          type: 'textarea',
          label: l('Eigen notitie (optioneel)', 'Own note (optional)'),
          admin: {
            description: l(
              'Vervangt de korte samenvatting, bv. waarom dit project op deze pagina staat.',
              'Replaces the short summary, e.g. why this project is on this page.',
            ),
          },
        },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      label: l('Weergave', 'Layout'),
      defaultValue: 'cards',
      options: [
        {
          label: l(
            'Uitgelicht: live sites op een donkere band',
            'Showcase: live sites on a dark band',
          ),
          value: 'showcase',
        },
        { label: l('Raster met live sites', 'Grid of live sites'), value: 'cards' },
        { label: l('Lijst met notities', 'List with notes'), value: 'list' },
      ],
    },
    {
      name: 'showLink',
      type: 'checkbox',
      label: l('Link naar alle projecten tonen', 'Show link to all projects'),
    },
    link({
      appearances: false,
      overrides: {
        admin: { condition: (_, siblingData) => Boolean(siblingData?.showLink) },
      },
    }),
  ],
}
