/* eslint-disable @next/next/no-img-element */
import React from 'react'

import icon from './icon.svg'

/** Admin navigation icon. Swap `icon.svg` to rebrand. */
export default function Icon() {
  return <img alt="BrentWeb" src={icon.src} style={{ width: '100%', height: '100%' }} />
}
