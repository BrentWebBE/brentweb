import type { Block } from 'payload'

import { l } from '@/utilities/label'

/** A code sample in a technical write-up. Rendered by the blog module's highlighter. */
export const CodeSnippet: Block = {
  slug: 'codeSnippet',
  interfaceName: 'CodeSnippetBlock',
  labels: { singular: l('Code', 'Code'), plural: l('Code', 'Code') },
  fields: [
    {
      name: 'language',
      type: 'select',
      defaultValue: 'tsx',
      options: [
        { label: 'TypeScript / TSX', value: 'tsx' },
        { label: 'JavaScript', value: 'javascript' },
        { label: 'Rust', value: 'rust' },
        { label: 'HTML', value: 'markup' },
        { label: 'CSS', value: 'css' },
        { label: 'Shell', value: 'bash' },
        { label: 'JSON', value: 'json' },
        { label: 'YAML', value: 'yaml' },
      ],
    },
    { name: 'code', type: 'code', label: false, required: true },
  ],
}
