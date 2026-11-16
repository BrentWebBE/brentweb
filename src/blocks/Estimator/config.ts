import type { Block } from 'payload'

import { eyebrowField, headingField, introField } from '@/fields/heading'
import { l } from '@/utilities/label'

/**
 * The cost estimator. The questions, prices and the AI analysis are code; only the
 * heading above it is edited here.
 */
export const Estimator: Block = {
  slug: 'estimator',
  interfaceName: 'EstimatorBlock',
  labels: {
    singular: l('Kostenraming', 'Cost estimator'),
    plural: l('Kostenramingen', 'Cost estimators'),
  },
  fields: [eyebrowField(), headingField(), introField()],
}
