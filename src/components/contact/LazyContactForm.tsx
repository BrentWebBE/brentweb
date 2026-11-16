'use client'

import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslations } from '@/hooks/useTranslations'

import type { ContactFormProps } from './ContactForm'

const ContactForm = lazy(() => import('./ContactForm'))

/** Same query parameter as ContactForm's PREFILL_PARAM, without importing that chunk. */
const PREFILL_PARAM = 'probleem'

/**
 * Mounts the contact form once its slot is within a screen or so of the viewport (or
 * straight away when the visitor came for it: a #contact link or a pain-point
 * prefill). Until then the slot keeps roughly the form's height, so the page doesn't
 * jump when it arrives. Takes the same props as ContactForm.
 */
export function LazyContactForm(props: ContactFormProps) {
  const { t } = useTranslations()
  const slot = useRef<HTMLDivElement>(null)
  const [load, setLoad] = useState(false)

  useEffect(() => {
    const wanted =
      window.location.hash === '#contact' ||
      new URLSearchParams(window.location.search).has(PREFILL_PARAM)
    const el = slot.current
    if (wanted || !el || !('IntersectionObserver' in window)) {
      // Decided after mount on purpose: the server can't know the hash.
      setLoad(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '800px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Not an empty box: if the script is slow or fails, the visitor still sees how to reach me.
  const placeholder = (
    <div className="grid min-h-[38rem] content-start gap-[var(--space-xs)]">
      <p className="font-medium">{t('contact.form.loading')}</p>
      <p className="small">{t('contact.form.loadingAlt')}</p>
    </div>
  )

  return (
    <div ref={slot}>
      {load ? (
        <Suspense fallback={placeholder}>
          <ContactForm {...props} />
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  )
}
