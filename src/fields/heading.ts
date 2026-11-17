import type { TextField, TextareaField } from 'payload'

import { MARKED_HELP } from '@/components/handmade/Marked'
import { l } from '@/utilities/label'

/** A heading that supports the _scribble_ / ==highlight== markup (see <Marked>). */
export const headingField = (overrides: Partial<TextField> = {}): TextField =>
  ({
    name: 'heading',
    type: 'text',
    label: l('Titel', 'Heading'),
    admin: { description: l(MARKED_HELP.nl, MARKED_HELP.en) },
    ...overrides,
  }) as TextField

/** The small handwritten line above a heading ("hoe ik werk"). */
export const eyebrowField = (overrides: Partial<TextField> = {}): TextField =>
  ({
    name: 'eyebrow',
    type: 'text',
    label: l('Handgeschreven regel erboven', 'Handwritten line above'),
    admin: {
      description: l(
        'Optioneel. Kort en informeel, bv. "zo werk ik".',
        'Optional. Short and informal, e.g. "how I work".',
      ),
    },
    ...overrides,
  }) as TextField

export const introField = (overrides: Partial<TextareaField> = {}): TextareaField =>
  ({
    name: 'intro',
    type: 'textarea',
    label: l('Inleiding', 'Intro'),
    ...overrides,
  }) as TextareaField

/** Price placeholders the frontend fills in from the estimator's pricing table. */
export const PRICE_HELP = l(
  'Prijzen typ je niet zelf: gebruik {websiteRange}, {websiteMin}, {websiteMax}, {webAppRange}, {apiRange}, {automationRange}, {integrationsRange}, {fromPrice}, {maintenanceBasic}, {maintenanceActive} of …WeeksMin / …WeeksMax. Die komen uit de kostenraming, zodat ze overal kloppen.',
  "Don't type prices: use {websiteRange}, {websiteMin}, {websiteMax}, {webAppRange}, {apiRange}, {automationRange}, {integrationsRange}, {fromPrice}, {maintenanceBasic}, {maintenanceActive} or …WeeksMin / …WeeksMax. They come from the estimator, so they match everywhere.",
)
