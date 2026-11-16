import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContactBlock } from '@/blocks/Contact/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { EstimatorBlock } from '@/blocks/Estimator/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { FeaturesBlock } from '@/blocks/Features/Component'
import { GalleryBlock } from '@/blocks/Gallery/Component'
import { HeroBlock } from '@/blocks/Hero/Component'
import { OpeningHoursBlock } from '@/blocks/OpeningHours/Component'
import { PainPointsBlock } from '@/blocks/PainPoints/Component'
import { PricingBlock } from '@/blocks/Pricing/Component'
import { PricingTableBlock } from '@/blocks/PricingTable/Component'
import { ProjectsBlockComponent } from '@/blocks/Projects/Component'
import { ServicesBlock } from '@/blocks/Services/Component'
import { StepsBlock } from '@/blocks/Steps/Component'
import { TestimonialsBlock } from '@/blocks/Testimonials/Component'
import { TextImageBlock } from '@/blocks/TextImage/Component'
import { TimelineBlock } from '@/blocks/Timeline/Component'
import { WebsiteCheckBlock } from '@/blocks/WebsiteCheck/Component'
import type { Locale } from '@/lib/locales'
import { ArchiveBlock } from '@/modules/blog/blocks/ArchiveBlock/Component'
import { MenuBlock } from '@/modules/menu/blocks/Menu/Component'
import { ProductGridBlock } from '@/modules/ecommerce/blocks/ProductGrid/Component'

type LayoutBlock = Page['layout'][number]

/** Each block pads itself (`.section`), so backgrounds can fill their whole band. */
const renderBlock = (block: LayoutBlock, locale: Locale, next?: LayoutBlock): React.ReactNode => {
  switch (block.blockType) {
    case 'hero':
      return (
        <HeroBlock
          {...block}
          locale={locale}
          nextIsShowcase={next?.blockType === 'projects' && next.layout === 'showcase'}
        />
      )
    case 'painPoints':
      return <PainPointsBlock {...block} locale={locale} />
    case 'services':
      return <ServicesBlock {...block} locale={locale} />
    case 'projects':
      return <ProjectsBlockComponent {...block} locale={locale} />
    case 'testimonials':
      return <TestimonialsBlock {...block} locale={locale} />
    case 'features':
      return <FeaturesBlock {...block} locale={locale} />
    case 'steps':
      return <StepsBlock {...block} locale={locale} />
    case 'pricing':
      return <PricingBlock {...block} locale={locale} />
    case 'pricingTable':
      return <PricingTableBlock {...block} locale={locale} />
    case 'estimator':
      return <EstimatorBlock {...block} locale={locale} />
    case 'faq':
      return <FAQBlock {...block} locale={locale} />
    case 'textImage':
      return <TextImageBlock {...block} locale={locale} />
    case 'timeline':
      return <TimelineBlock {...block} locale={locale} />
    case 'websiteCheck':
      return <WebsiteCheckBlock {...block} locale={locale} />
    case 'cta':
      return <CallToActionBlock {...block} locale={locale} />
    case 'contact':
      return <ContactBlock {...block} locale={locale} />
    case 'content':
      return <ContentBlock {...block} locale={locale} />
    case 'gallery':
      return <GalleryBlock {...block} />
    case 'openingHours':
      return <OpeningHoursBlock {...block} />
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

export const RenderBlocks: React.FC<{ blocks: Page['layout']; locale: Locale }> = ({
  blocks,
  locale,
}) => {
  if (!Array.isArray(blocks) || blocks.length === 0) return null
  return (
    <>
      {blocks.map((block, index) => (
        <Fragment key={block.id ?? index}>{renderBlock(block, locale, blocks[index + 1])}</Fragment>
      ))}
    </>
  )
}
