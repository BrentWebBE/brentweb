'use client'

import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import { Wordmark } from '@/components/Logo/Wordmark'

/**
 * First-visit curtain: the wordmark draws itself letter by letter on the dark field, a
 * red rule runs underneath, and the curtain lifts off the page. Ported from the
 * brentweb-portfolio preloader, restyled for this design (styles in src/client/site.css).
 *
 * The motion is CSS only, so it runs before React hydrates and finishes even without
 * JavaScript (the curtain ends off-screen). React only unmounts it when the lift ends
 * and locks scrolling while it covers the page.
 */

/** Once per tab. A preloader on every navigation is an obstacle, not a brand. */
const SESSION_KEY = 'bw:preloaded'

/** Backstop: if animations are suppressed without an `animationend`, never leave a curtain. */
const MAX_DURATION_MS = 3200

function readPlayed() {
  try {
    return sessionStorage.getItem(SESSION_KEY) !== null || window.self !== window.top
  } catch {
    return false
  }
}

function markPlayed() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* privacy modes throw; never fatal */
  }
}

/**
 * Runs while the HTML is parsed, before the curtain is: repeat visits in the same tab
 * (and the admin's live preview, which loads the site in an iframe) hide it at once
 * instead of flashing it until hydration.
 */
const NO_FLASH_SCRIPT = `try{if(sessionStorage.getItem('${SESSION_KEY}')||window.self!==window.top)document.documentElement.dataset.preloaded='1'}catch(e){}`

/** Read once at module scope: under StrictMode the effect runs twice, after the first wrote the key. */
const ALREADY_PLAYED = typeof window !== 'undefined' && readPlayed()

// A value that differs between server (curtain in the HTML) and client, without a
// hydration mismatch.
const NEVER_CHANGES = () => () => {}
const readClient = () => ALREADY_PLAYED
const readServer = () => false

export function Preloader() {
  const played = useSyncExternalStore(NEVER_CHANGES, readClient, readServer)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (played) return
    markPlayed()
    document.documentElement.classList.add('preloader-active')
    const timer = window.setTimeout(() => setFinished(true), MAX_DURATION_MS)
    return () => {
      window.clearTimeout(timer)
      document.documentElement.classList.remove('preloader-active')
    }
  }, [played])

  // It renders null rather than unmounting, so the lock is released here.
  useEffect(() => {
    if (finished) document.documentElement.classList.remove('preloader-active')
  }, [finished])

  // Only the curtain's own exit counts; the glyph animations bubble up through it.
  const onAnimationEnd = useCallback((event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) setFinished(true)
  }, [])

  if (played || finished) return null

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      <div aria-hidden="true" className="preloader" onAnimationEnd={onAnimationEnd}>
        <div className="preloader__inner">
          <Wordmark className="preloader__mark" />
          <span className="preloader__bar" />
        </div>
      </div>
    </>
  )
}
