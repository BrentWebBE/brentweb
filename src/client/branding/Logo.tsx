/* eslint-disable @next/next/no-img-element */
import React from 'react'

import logo from './logo.svg'

/** Admin login screen logo. Swap `logo.svg` to rebrand. */
export default function Logo() {
  return (
    <img
      alt="BrentWeb"
      src={logo.src}
      style={{ maxWidth: '240px', width: '100%', height: 'auto' }}
    />
  )
}
