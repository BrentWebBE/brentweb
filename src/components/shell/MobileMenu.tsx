'use client'

import { usePathname } from 'next/navigation'
import React, { useEffect, useId, useRef, useState } from 'react'

import { NavLink } from './NavLink'

/**
 * The menu below `xl`: a full-screen panel under the header, which stays in place with
 * its close button. Large links first, the call to action and the theme switch at the
 * bottom within thumb reach. The page behind it doesn't scroll while it is open.
 */
export function MobileMenu({
  cta,
  extras,
  items,
  labels,
}: {
  cta: React.ReactNode
  /** Small controls next to the call to action (the theme switch). */
  extras?: React.ReactNode
  items: { id?: string | null; href: string; label: string }[]
  labels: { close: string; nav: string; open: string }
}) {
  // Open "for" a path: navigating anywhere closes it without an effect.
  const pathname = usePathname()
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const setOpen = (next: boolean | ((o: boolean) => boolean)) =>
    setOpenOn((typeof next === 'function' ? next(open) : next) ? pathname : null)
  const id = useId()
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpenOn(null)
      button.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    // Lock the page behind the panel; restore whatever was there before.
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    // Focus moves into the menu (the panel itself, so no link shows a focus ring).
    panel.current?.focus({ preventScroll: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      root.style.overflow = previous
    }
  }, [open])

  if (items.length === 0 && !cta) return null

  return (
    <div className="xl:hidden">
      <button
        aria-controls={id}
        aria-expanded={open}
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen((o) => !o)}
        ref={button}
        type="button"
      >
        {open ? labels.close : labels.open}
      </button>
      {open && (
        <div
          className="fixed inset-x-0 bottom-0 top-[calc(var(--nav-height)+1px)] z-[var(--z-modal)] overflow-y-auto overscroll-contain bg-[var(--color-paper)] outline-none motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
          id={id}
          ref={panel}
          tabIndex={-1}
        >
          <div className="container flex min-h-full flex-col pb-[calc(var(--space-xl)+env(safe-area-inset-bottom))] pt-[var(--space-xl)]">
            <nav aria-label={labels.nav}>
              <ul className="flex flex-col gap-[var(--space-2xs)]">
                {items.map((item) => (
                  <li key={item.id ?? item.href}>
                    <NavLink
                      className="w-full whitespace-normal px-0 py-[var(--space-xs)] text-[length:var(--text-section)] font-bold leading-[1.1] tracking-[-0.02em]"
                      href={item.href}
                      onNavigate={() => setOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            {(cta || extras) && (
              <div className="mt-auto flex flex-col gap-[var(--space-md)] border-t border-[var(--color-rule)] pt-[var(--space-lg)]">
                {cta}
                {extras && <div className="flex justify-end">{extras}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
