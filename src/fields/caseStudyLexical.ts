import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { Callout } from '@/blocks/Callout/config'
import { CodeSnippet } from '@/blocks/CodeSnippet/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { MetricGrid } from '@/blocks/MetricGrid/config'

/** Editor for case-study write-ups: headings, lists, links plus three inline blocks. */
export const caseStudyLexical = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    BlocksFeature({ blocks: [Callout, MetricGrid, MediaBlock, CodeSnippet] }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
    HorizontalRuleFeature(),
  ],
})
