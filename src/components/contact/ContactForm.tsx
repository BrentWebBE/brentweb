'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { useLocale, useLocaleContext, useTranslations } from '@/hooks/useTranslations'
import {
  contactLeadFormSchema,
  BUDGET_KEYS,
  TIMELINE_KEYS,
  type ContactLead,
} from '@/lib/schemas/lead'
import { useLeadSubmit } from '@/hooks/useLeadSubmit'
import { formatBracket } from '@/lib/calculator/pricing'
import { cn } from '@/utilities/ui'
import {
  ConsentCheckbox,
  Field,
  Honeypot,
  SubmitButton,
  formClasses,
} from '@/components/contact/FormParts'

/**
 * Query parameter that carries a pain point into the contact form, e.g.
 * `/nl-BE/contact?probleem=2#contact`. The value is either one of the numbered keys
 * under `pain.items` in the messages (the sentence then comes from there) or the
 * problem sentence itself, as a pain-point block from Payload would send it. Free
 * text is trimmed to one short line before it lands in the message box.
 */
export const PREFILL_PARAM = 'probleem'

const PREFILL_MAX = 200

export type ContactFormProps = {
  /** Placeholder of the message box. Falls back to `contact.business.messagePlaceholder`. */
  messagePlaceholder?: string | null
  /** Short note above the form. Falls back to `contact.business.formNote`; '' hides it. */
  formNote?: string | null
  className?: string
}

/**
 * The contact form itself. LazyContactForm loads it only when its slot comes near
 * the viewport, so react-hook-form and zod stay out of the page's initial JavaScript.
 */
export function ContactForm({ messagePlaceholder, formNote, className }: ContactFormProps) {
  const { t } = useTranslations()
  const { messages } = useLocaleContext()
  const { locale } = useLocale()

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<z.input<typeof contactLeadFormSchema>, unknown, ContactLead>({
    resolver: zodResolver(contactLeadFormSchema),
    defaultValues: {
      source: 'contact',
      locale,
      name: '',
      email: '',
      message: '',
      website: '',
      gdprConsent: false,
      honeypot: '',
      budget: undefined,
      timeline: undefined,
    },
  })

  const { submit, isPending } = useLeadSubmit('contact.form')

  // Arriving from a pain point's "Dit wil ik oplossen" link: start the message
  // with that problem. Read after mount, not during render, so the server-rendered
  // page and the first client render still match. Never overwrites something the
  // visitor already typed.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get(PREFILL_PARAM)
    if (!raw || getValues('message')) return
    const problem = painProblem(raw, messages.pain.items)
    if (!problem) return
    setValue('message', t('contact.business.prefill', { problem }))
  }, [getValues, setValue, t, messages])

  const note = formNote ?? t('contact.business.formNote')

  return (
    <form
      onSubmit={handleSubmit((values) => submit(values))}
      className={cn('relative grid gap-6', className)}
      noValidate
    >
      {note && <p className="hand -rotate-1 text-2xl leading-tight text-primary">{note}</p>}

      <Honeypot {...register('honeypot')} />

      <div className={formClasses.row}>
        <Field label={t('contact.form.name')} error={errors.name?.message}>
          {(id) => (
            <input
              id={id}
              type="text"
              autoComplete="name"
              className="field-hand"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
          )}
        </Field>
        <Field label={t('contact.form.email')} error={errors.email?.message}>
          {(id) => (
            <input
              id={id}
              type="email"
              autoComplete="email"
              placeholder={locale === 'nl-BE' ? 'u@uwzaak.be' : 'you@yourbusiness.com'}
              className="field-hand"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
          )}
        </Field>
      </div>

      <Field label={t('contact.form.website')} error={errors.website?.message}>
        {(id) => (
          <input
            id={id}
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder={t('contact.form.websitePlaceholder')}
            className="field-hand"
            {...register('website')}
          />
        )}
      </Field>

      <div className={formClasses.row}>
        <Field label={t('contact.form.budget')} error={errors.budget?.message}>
          {(id) => (
            <select
              id={id}
              className="field-hand cursor-pointer"
              defaultValue=""
              aria-invalid={Boolean(errors.budget)}
              {...register('budget')}
            >
              <option value="" disabled>
                {t('contact.form.selectPlaceholder')}
              </option>
              {BUDGET_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key === 'not-sure'
                    ? t('contact.form.budgetOptions.not-sure')
                    : formatBracket(key, locale)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label={t('contact.form.timeline')} error={errors.timeline?.message}>
          {(id) => (
            <select
              id={id}
              className="field-hand cursor-pointer"
              defaultValue=""
              aria-invalid={Boolean(errors.timeline)}
              {...register('timeline')}
            >
              <option value="" disabled>
                {t('contact.form.selectPlaceholder')}
              </option>
              {/* Labels reuse the estimator's timeline copy: same key set. */}
              {TIMELINE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t(`calculator.timeline.options.${key}`)}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field label={t('contact.form.message')} error={errors.message?.message}>
        {(id) => (
          <textarea
            id={id}
            rows={5}
            placeholder={messagePlaceholder || t('contact.business.messagePlaceholder')}
            className="field-hand resize-y"
            aria-invalid={Boolean(errors.message)}
            {...register('message')}
          />
        )}
      </Field>

      <ConsentCheckbox
        text={t('contact.form.gdprConsent')}
        error={errors.gdprConsent ? t('contact.form.gdprRequired') : undefined}
        {...register('gdprConsent')}
      />

      <div>
        <SubmitButton
          pending={isPending}
          label={t('contact.form.send')}
          pendingLabel={t('contact.form.sending')}
        />
      </div>
    </form>
  )
}

export default ContactForm

/**
 * The problem sentence for a `?probleem=` value: a numbered message key, or a short
 * free-text sentence. Control characters and line breaks are dropped.
 */
function painProblem(raw: string, items: Record<string, { problem: string }>): string | null {
  const key = raw.trim()
  if (Object.hasOwn(items, key)) return items[key]!.problem
  const text = key
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length < 3) return null
  return text.length > PREFILL_MAX ? `${text.slice(0, PREFILL_MAX - 1).trimEnd()}…` : text
}
