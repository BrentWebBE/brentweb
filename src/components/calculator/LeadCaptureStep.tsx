'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Download, Loader2 } from 'lucide-react'
import type { z } from 'zod'
import { useTranslations } from '@/hooks/useTranslations'
import { calculatorLeadSchema, type EstimateInput } from '@/lib/schemas/lead'
import { useLeadSubmit } from '@/hooks/useLeadSubmit'
import type { Locale } from '@/lib/locales'
import type { AiState } from '@/components/calculator/CostEstimator'
import { estimatorClasses } from '@/components/calculator/controls'
import {
  ConsentCheckbox,
  Field,
  Honeypot,
  SubmitButton,
  formClasses,
} from '@/components/contact/FormParts'

/** The estimate PDF endpoint. Not under /api: Payload owns that prefix. */
export const ESTIMATE_PDF_URL = '/next/estimate-pdf'

// The answers and the AI analysis live in the estimator's state and can still
// change on this step, so they are attached at submit time, not held as form
// fields that would go stale.
const leadFormSchema = calculatorLeadSchema.omit({ estimate: true, ai: true })
type LeadForm = z.infer<typeof leadFormSchema>

export function LeadCaptureStep({
  locale,
  input,
  ai,
}: {
  locale: Locale
  input: EstimateInput
  /** Only an analysis that matches `input`; the server re-checks the signature. */
  ai: AiState | null
}) {
  const { t } = useTranslations()
  const [isDownloading, setIsDownloading] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<z.input<typeof leadFormSchema>, unknown, LeadForm>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      source: 'calculator',
      locale,
      name: '',
      email: '',
      company: '',
      notes: '',
      gdprConsent: false,
      honeypot: '',
    },
  })

  const { submit, isPending } = useLeadSubmit('calculator.lead')
  const signedAi = ai?.signature ? { analysis: ai.analysis, signature: ai.signature } : undefined
  const onSubmit = (values: LeadForm) => submit({ ...values, estimate: input, ai: signedAi })

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(ESTIMATE_PDF_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: getValues('name').trim() || t('calculator.pdf.defaultName'),
          estimate: input,
          ai: signedAi,
          locale,
        }),
      })
      if (!response.ok) throw new Error(`PDF request failed with status ${response.status}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'project-estimate.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[calculator] PDF download failed', error)
      toast.error(t('calculator.lead.error'))
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="paper-card relative mt-12 grid gap-6 p-6 sm:p-8"
      noValidate
    >
      <div>
        <h3 className={estimatorClasses.title}>{t('calculator.lead.title')}</h3>
        <p className={estimatorClasses.description}>{t('calculator.lead.subtitle')}</p>
      </div>

      <Honeypot {...register('honeypot')} />

      <div className={formClasses.row}>
        <Field label={t('calculator.lead.name')} error={errors.name?.message}>
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
        <Field label={t('calculator.lead.email')} error={errors.email?.message}>
          {(id) => (
            <input
              id={id}
              type="email"
              autoComplete="email"
              className="field-hand"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
          )}
        </Field>
      </div>

      <Field label={t('calculator.lead.company')}>
        {(id) => (
          <input
            id={id}
            type="text"
            autoComplete="organization"
            className="field-hand"
            {...register('company')}
          />
        )}
      </Field>

      <Field label={t('calculator.lead.notes')}>
        {(id) => (
          <textarea id={id} rows={3} className="field-hand resize-y" {...register('notes')} />
        )}
      </Field>

      <ConsentCheckbox
        text={t('contact.form.gdprConsent')}
        error={errors.gdprConsent ? t('contact.form.gdprRequired') : undefined}
        {...register('gdprConsent')}
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <Download aria-hidden className="size-4" />
          )}
          {isDownloading
            ? t('calculator.result.downloadingPdf')
            : t('calculator.result.downloadPdf')}
        </button>
        <SubmitButton
          pending={isPending}
          label={t('calculator.lead.submit')}
          pendingLabel={t('calculator.lead.sending')}
        />
      </div>
    </form>
  )
}
