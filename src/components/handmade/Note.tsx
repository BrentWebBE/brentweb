import React from 'react'

import { cn } from '@/utilities/ui'

export type NoteArrow = 'left' | 'right' | 'down' | 'up' | 'none'

/**
 * A handwritten aside with a curly arrow pointing at something ("← dat ben ik").
 * Decorative: the arrow is aria-hidden, the text is read normally.
 */
export function Note({
  arrow = 'left',
  children,
  className,
  tilt = -3,
}: {
  arrow?: NoteArrow
  children: React.ReactNode
  className?: string
  tilt?: number
}) {
  const style = { '--tilt': `${tilt}deg` } as React.CSSProperties
  const svg = arrow === 'none' ? null : <Arrow direction={arrow} />
  const arrowFirst = arrow === 'left' || arrow === 'up'

  return (
    <span
      className={cn('note', (arrow === 'down' || arrow === 'up') && 'flex-col', className)}
      style={style}
    >
      {arrowFirst && svg}
      <span>{children}</span>
      {!arrowFirst && svg}
    </span>
  )
}

const ROTATION: Record<Exclude<NoteArrow, 'none'>, number> = {
  right: 0,
  down: 70,
  left: 180,
  up: -110,
}

function Arrow({ direction }: { direction: Exclude<NoteArrow, 'none'> }) {
  return (
    <svg
      aria-hidden="true"
      style={{ transform: `rotate(${ROTATION[direction]}deg)` }}
      viewBox="0 0 52 44"
    >
      <path
        d="M4 30c8-14 22-21 38-17"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.6"
      />
      <path
        d="M33 6c4 2.6 7.6 4.8 10.6 7.2-3.4 2-6.4 4.8-8.6 8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
      />
    </svg>
  )
}
