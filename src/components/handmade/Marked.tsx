import React, { Fragment } from 'react'

/**
 * Light markup for headings written in Payload text fields:
 *
 *   _word_     → a hand-drawn pen line under it
 *   ==word==   → a highlighter swipe behind it
 *
 * Kept deliberately tiny (no nesting) so editors can't break a heading. The admin
 * description of every heading field that supports this says so (MARKED_HELP).
 */
export const MARKED_HELP = {
  nl: 'Tip: zet een woord tussen _underscores_ voor een pennenstreep eronder, of tussen ==gelijktekens== voor markeerstift.',
  en: 'Tip: wrap a word in _underscores_ for a pen line under it, or in ==equals signs== for highlighter.',
}

const TOKEN = /(==[^=]+==|_[^_]+_)/g

export function Marked({ text }: { text: string | null | undefined }) {
  if (!text) return null
  const parts = text.split(TOKEN).filter(Boolean)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
          return (
            <mark className="highlight bg-transparent text-inherit" key={i}>
              {part.slice(2, -2)}
            </mark>
          )
        }
        if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
          return <Scribble key={i}>{part.slice(1, -1)}</Scribble>
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}

/** Strips the markup, for <title>, alt text and structured data. */
export const plainText = (text: string | null | undefined): string =>
  (text ?? '').replace(/==([^=]+)==/g, '$1').replace(/_([^_]+)_/g, '$1')

export function Scribble({ children }: { children: React.ReactNode }) {
  return (
    <span className="scribble">
      {children}
      <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 200 14">
        <path
          d="M3 9.5C34 5.6 62 4.2 96 6.4c26 1.7 52 3.5 78-.6 8-1.3 15-2.6 23-1.4"
          fill="none"
          pathLength={1}
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3.4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  )
}
