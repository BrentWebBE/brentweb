'use client'

import React, { useEffect, useRef } from 'react'

/**
 * Fades its child in, with a tiny tilt, the first time it scrolls into view.
 * Server-rendered content stays visible without JS: the attribute is only set once
 * the observer is running, and handmade.css only hides `[data-reveal]` when motion is
 * allowed.
 */
export function Reveal({
  as: Tag = 'div',
  children,
  className,
  tilt = 0,
}: {
  as?: 'div' | 'section' | 'li' | 'article'
  children: React.ReactNode
  className?: string
  tilt?: number
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    // Already on screen at load: don't hide it first.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return

    el.dataset.reveal = 'hidden'
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.dataset.reveal = 'shown'
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const style = tilt ? ({ '--reveal-tilt': `${tilt}deg` } as React.CSSProperties) : undefined

  return React.createElement(Tag, { className, ref, style }, children)
}
