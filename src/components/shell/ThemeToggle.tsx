'use client'

import React from 'react'

import { useTheme } from '@/providers/Theme'

/**
 * A hand-drawn sun / moon. Both icons and both labels are always rendered and CSS shows
 * the right one (`dark:`), so the server HTML matches the client whatever the theme is.
 */
export function ThemeToggle({ labels }: { labels: { dark: string; light: string } }) {
  const { setTheme } = useTheme()

  return (
    <button
      className="grid size-10 place-items-center rounded-full text-foreground/80 transition hover:rotate-12 hover:text-foreground"
      onClick={() => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
        setTheme(isDark ? 'light' : 'dark')
      }}
      type="button"
    >
      <span className="sr-only dark:hidden">{labels.dark}</span>
      <span className="sr-only hidden dark:inline">{labels.light}</span>
      <svg
        aria-hidden="true"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <g className="hidden dark:inline">
          <path d="M12.2 7.6c2.5-.3 4.5 1.6 4.4 4.3-.1 2.6-2.2 4.5-4.6 4.3-2.4-.1-4.3-2.1-4.2-4.5.2-2.2 2-3.9 4.4-4.1Z" />
          <path d="M12 2.8v2M12 19.3v2M4.6 5l1.5 1.4M18 17.6l1.4 1.5M2.7 12.2h2M19.3 11.9h2M4.8 19.2l1.4-1.5M17.8 6.3 19.3 5" />
        </g>
        <path
          className="dark:hidden"
          d="M19.6 14.7c-1 .4-2.1.6-3.3.6-4.5 0-8-3.5-8-7.9 0-1.5.4-2.9 1.1-4.1-3.6 1-6.3 4.4-6.2 8.3.1 4.6 3.9 8.4 8.6 8.3 3.6 0 6.6-2.2 7.8-5.2Z"
        />
      </svg>
    </button>
  )
}
