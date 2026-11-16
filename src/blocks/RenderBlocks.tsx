import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContactBlock } from '@/blocks/Contact/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { GalleryBlock } from '@/blocks/Gallery/Component'
import { HeroBlock } from '@/blocks/Hero/Component'
import { OpeningHoursBlock } from '@/blocks/OpeningHours/Component'
import { ServicesBlock } from '@/blocks/Services/Component'
import { TextImageBlock } from '@/blocks/TextImage/Component'
import { ArchiveBlock } from '@/modules/blog/blocks/ArchiveBlock/Component'
import { MenuBlock } from '@/modules/menu/blocks/Menu/Component'
import { ProductGridBlock } from '@/modules/ecommerce/blocks/ProductGrid/Component'

type LayoutBlock = Page['layout'][number]

const renderBlock = (block: LayoutBlock, index: number): React.ReactNode => {
  switch (block.blockType) {
    case 'hero':
      return <HeroBlock {...block} isFirst={index === 0} />
    case 'textImage':
      return <TextImageBlock {...block} />
    case 'services':
      return <ServicesBlock {...block} />
    case 'gallery':
      return <GalleryBlock {...block} />
    case 'faq':
      return <FAQBlock {...block} />
    case 'cta':
      return <CallToActionBlock {...block} />
    case 'openingHours':
      return <OpeningHoursBlock {...block} />
    case 'contact':
      return <ContactBlock {...block} />
    case 'content':
      return <ContentBlock {...block} />
    // Feature modules: the block is only selectable when its flag is on.
    case 'menu':
      return <MenuBlock {...block} />
    case 'productGrid':
      return <ProductGridBlock {...block} />
    case 'archive':
      return <ArchiveBlock {...block} id={block.id ?? undefined} />
    default: {
      // Exhaustiveness check: adding a block to Pages without rendering it fails type-checking.
      const unhandled: never = block
      return unhandled
    }
  }
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout']
}> = ({ blocks }) => {
  if (!Array.isArray(blocks) || blocks.length === 0) return null

  return (
    <Fragment>
      {blocks.map((block, index) => {
        const key = block.id ?? index
        // Heroes manage their own spacing (they sit flush under the header).
        if (block.blockType === 'hero') {
          return <Fragment key={key}>{renderBlock(block, index)}</Fragment>
        }
        return (
          <div className="my-section" key={key}>
            {renderBlock(block, index)}
          </div>
        )
      })}
    </Fragment>
  )
}
