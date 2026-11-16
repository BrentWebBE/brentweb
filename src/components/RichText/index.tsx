import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'

import { CodeBlock, CodeBlockProps } from '@/modules/blog/blocks/Code/Component'

import type {
  BannerBlock as BannerBlockProps,
  CalloutBlock as CalloutBlockProps,
  CallToActionBlock as CTABlockProps,
  CodeSnippetBlock as CodeSnippetBlockProps,
  MediaBlock as MediaBlockProps,
  MetricGridBlock as MetricGridBlockProps,
} from '@/payload-types'
import { BannerBlock } from '@/modules/blog/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { CalloutBlock } from '@/blocks/Callout/Component'
import { MetricGridBlock } from '@/blocks/MetricGrid/Component'
import { contentLocale, type Locale } from '@/lib/locales'
import { docHref } from '@/lib/routing'
import { cn } from '@/utilities/ui'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<
      | CTABlockProps
      | MediaBlockProps
      | BannerBlockProps
      | CodeBlockProps
      | CalloutBlockProps
      | MetricGridBlockProps
      | CodeSnippetBlockProps
    >

const converters =
  (locale: Locale): JSXConvertersFunction<NodeTypes> =>
  ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkJSXConverter({
      internalDocToHref: ({ linkNode }: { linkNode: SerializedLinkNode }) => {
        const { value, relationTo } = linkNode.fields.doc!
        return docHref(locale, relationTo, value as never) ?? '#'
      },
    }),
    blocks: {
      banner: ({ node }) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
      mediaBlock: ({ node }) => (
        <MediaBlock
          className="not-prose my-10"
          imgClassName="m-0"
          {...node.fields}
          captionClassName="mx-auto max-w-[48rem]"
          enableGutter={false}
          disableInnerContainer={true}
        />
      ),
      code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
      cta: ({ node }) => <CallToActionBlock {...node.fields} locale={locale} />,
      callout: ({ node }) => <CalloutBlock {...node.fields} />,
      metricGrid: ({ node }) => <MetricGridBlock {...node.fields} />,
      codeSnippet: ({ node }) => (
        <CodeBlock
          blockType="code"
          className="my-8"
          code={node.fields.code}
          language={node.fields.language ?? undefined}
        />
      ),
    },
  })

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
  locale?: Locale
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const {
    className,
    enableProse = true,
    enableGutter = true,
    locale = contentLocale,
    ...rest
  } = props
  return (
    <ConvertRichText
      converters={converters(locale)}
      className={cn(
        'payload-richtext',
        {
          container: enableGutter,
          'max-w-none': !enableGutter,
          'prose prose-lg dark:prose-invert': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
