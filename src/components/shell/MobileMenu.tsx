'use client'

import { usePathname } from 'next/navigation'
import React, { useEffect, useId, useState } from 'react'

import { NavLink } from './NavLink'

/** The menu below `lg`: a sheet of paper that drops down under the header. */
export function MobileMenu({
  cta,
  items,
  labels,
}: {
  cta: React.ReactNode
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

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenOn(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (items.length === 0 && !cta) return null

  return (
    <div className="xl:hidden">
      <button
        aria-controls={id}
        aria-expanded={open}
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        {open ? labels.close : labels.open}
      </button>
      {open && (
        <nav
          aria-label={labels.nav}
          className="card absolute inset-x-[var(--gutter)] top-[calc(100%+var(--space-xs))] z-[var(--z-dropdown)] p-[var(--space-md)] shadow-[var(--shadow-card)]"
          id={id}
        >
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.id ?? item.href}>
                <NavLink
                  className="w-full text-[length:var(--text-lg)]"
                  href={item.href}
                  onNavigate={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {cta && (
            <div className="mt-[var(--space-sm)] border-t border-[var(--color-rule)] pt-[var(--space-md)]">
              {cta}
            </div>
          )}
        </nav>
      )}
    </div>
  )
}
