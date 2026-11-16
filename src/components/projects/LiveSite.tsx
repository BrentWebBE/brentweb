'use client'

import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'

import { cn } from '@/utilities/ui'

export type LiveSiteImage = {
  url: string
  width: number
  height: number
  alt: string
}

/**
 * A real client site, shown as the page it is: a full-page screenshot (refreshed weekly
 * by the captureScreenshots job) in a clean browser or phone frame, scrolling itself
 * slowly from top to bottom and back. Visitors don't scroll it; it pauses off-screen,
 * under reduced motion and with the pause button (anything that moves for more than five
 * seconds needs one). Without JavaScript it shows the top of the page, still.
 */
export function LiveSite({
  className,
  domain,
  image,
  labels,
  priority,
  sizes,
  variant = 'desktop',
}: {
  className?: string
  domain?: string | null
  image: LiveSiteImage
  labels: { pause: string; play: string }
  priority?: boolean
  sizes: string
  variant?: 'desktop' | 'phone'
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scroll, setScroll] = useState<{ distance: number; duration: number } | null>(null)
  const [visible, setVisible] = useState(false)
  const [paused, setPaused] = useState(false)

  // How far the page can travel inside the frame, at a calm reading pace.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const measure = () => {
      const frameHeight = viewport.clientHeight
      const pageHeight = (viewport.clientWidth / image.width) * image.height
      const distance = Math.max(0, pageHeight - frameHeight)
      if (distance < 40) return setScroll(null)
      const pxPerSecond = variant === 'phone' ? 45 : 60
      setScroll({ distance, duration: Math.min(90, Math.max(14, distance / pxPerSecond)) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [image.height, image.width, variant])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      {
        threshold: 0.15,
      },
    )
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const style = scroll
    ? ({
        '--scroll-distance': `${-scroll.distance}px`,
        '--scroll-duration': `${scroll.duration}s`,
      } as React.CSSProperties)
    : undefined

  return (
    <div
      className={cn('site-frame', variant === 'phone' && 'site-frame--phone', className)}
      data-paused={paused}
      data-scroll={scroll ? 'on' : 'off'}
      data-visible={visible}
      ref={frameRef}
      style={style}
    >
      {variant === 'desktop' && (
        <div className="site-frame__bar">
          <span className="site-frame__url">{domain}</span>
          {scroll && (
            <PauseButton labels={labels} onToggle={() => setPaused((p) => !p)} paused={paused} />
          )}
        </div>
      )}
      <div className="site-frame__viewport" ref={viewportRef}>
        <Image
          alt={image.alt}
          className="site-frame__page pointer-events-none select-none"
          draggable={false}
          height={image.height}
          priority={priority}
          quality={75}
          sizes={sizes}
          src={image.url}
          width={image.width}
        />
        {variant === 'phone' && scroll && (
          <div className="absolute bottom-2 right-2 z-[var(--z-raised)] rounded-full bg-paper/90">
            <PauseButton labels={labels} onToggle={() => setPaused((p) => !p)} paused={paused} />
          </div>
        )}
      </div>
    </div>
  )
}

function PauseButton({
  labels,
  onToggle,
  paused,
}: {
  labels: { pause: string; play: string }
  onToggle: () => void
  paused: boolean
}) {
  return (
    <button
      aria-label={paused ? labels.play : labels.pause}
      aria-pressed={paused}
      className="site-frame__pause"
      onClick={onToggle}
      title={paused ? labels.play : labels.pause}
      type="button"
    >
      <svg aria-hidden="true" fill="currentColor" height="14" viewBox="0 0 14 14" width="14">
        {paused ? (
          <path d="M3.5 2.2v9.6L11.5 7z" />
        ) : (
          <path d="M3.5 2.5h2.4v9H3.5zM8.1 2.5h2.4v9H8.1z" />
        )}
      </svg>
    </button>
  )
}
