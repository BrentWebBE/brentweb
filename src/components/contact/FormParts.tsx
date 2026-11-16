'use client'

import Link from 'next/link'
import { useId, type ReactNode } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useLocale, useTranslations } from '@/hooks/useTranslations'
import { systemHref } from '@/lib/routing'
import { cn } from '@/utilities/ui'

/**
 * Pieces shared by the lead forms (contact, website check, estimator lead step), so
 * the three look and behave the same: hand-drawn fields, the honeypot, the consent
 * box and the submit button.
 */

export const formClasses = {
  label: 'mb-1.5 block font-semibold',
  error: 'mt-1.5 block text-sm text-destructive',
  help: 'text-sm text-muted-foreground',
  row: 'grid gap-5 sm:grid-cols-2',
} as const

/** A labelled field. `children` gets the id through the render prop. */
export function Field({
  label,
  error,
  className,
  children,
}: {
  label: ReactNode
  error?: ReactNode
  className?: string
  children: (id: string) => ReactNode
}) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className={formClasses.label}>
        {label}
      </label>
      {children(id)}
      {error ? (
        <span className={formClasses.error} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}

/**
 * Honeypot: real visitors never see this field. Kept in the layout (not
 * display:none) and moved off-screen, because some bots skip hidden inputs.
 */
export function Honeypot(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
      <label htmlFor={id}>Leave this field empty</label>
      <input id={id} type="text" tabIndex={-1} autoComplete="off" {...props} />
    </div>
  )
}

/** The GDPR consent checkbox with the privacy link. `text` is the consent sentence. */
export function ConsentCheckbox({
  text,
  error,
  ...input
}: { text: string; error?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  const { t } = useTranslations()
  const { locale } = useLocale()
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
        <input
          type="checkbox"
          className="mt-1 size-5 shrink-0 cursor-pointer accent-[var(--primary)]"
          {...input}
        />
        <span>
          {text}{' '}
          <Link href={systemHref(locale, 'privacy')} className="link-hand">
            {t('contact.form.gdprConsentLink')}
          </Link>
          {'. '}
          <span className="text-muted-foreground">{t('contact.form.gdprConsentSuffix')}</span>
        </span>
      </label>
      {error ? (
        <span className={formClasses.error} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}

export function SubmitButton({
  pending,
  label,
  pendingLabel,
  className,
  icon = true,
}: {
  pending: boolean
  label: string
  pendingLabel: string
  className?: string
  icon?: boolean
}) {
  return (
    <button type="submit" disabled={pending} className={cn('btn btn-primary', className)}>
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        <>
          {icon && <Send aria-hidden className="size-4" />}
          {label}
        </>
      )}
    </button>
  )
}
