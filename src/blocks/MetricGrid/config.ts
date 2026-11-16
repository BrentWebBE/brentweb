import type { Block } from 'payload'

import { l } from '@/utilities/label'

/** A few big numbers with a label each. Only real figures. */
export const MetricGrid: Block = {
  slug: 'metricGrid',
  interfaceName: 'MetricGridBlock',
  labels: { singular: l('Cijfers', 'Metrics'), plural: l('Cijfers', 'Metrics') },
  fields: [
    {
      name: 'metrics',
      type: 'array',
      label: l('Cijfers', 'Metrics'),
      minRows: 1,
      maxRows: 4,
      required: true,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'value', type: 'text', label: l('Waarde', 'Value'), required: true },
            { name: 'label', type: 'text', label: l('Omschrijving', 'Label'), required: true },
          ],
        },
      ],
    },
  ],
}
