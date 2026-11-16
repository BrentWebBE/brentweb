import React from 'react'

import type { HeroBlock as HeroBlockProps } from '@/payload-types'

import { HighImpactHero } from './variants/HighImpact'
import { LowImpactHero } from './variants/LowImpact'
import { MediumImpactHero } from './variants/MediumImpact'

type Props = HeroBlockProps & {
  isFirst?: boolean
}

export const HeroBlock: React.FC<Props> = (props) => {
  switch (props.type) {
    case 'highImpact':
      return <HighImpactHero {...props} />
    case 'mediumImpact':
      return <MediumImpactHero {...props} />
    case 'lowImpact':
      return <LowImpactHero {...props} />
    default:
      return null
  }
}
