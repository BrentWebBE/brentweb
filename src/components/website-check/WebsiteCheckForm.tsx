'use client'

import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTranslations, useLocale } from '@/hooks/useTranslations'
import { submitWebsiteCheck, type SubmitWebsiteCheckResult } from '@/actions/submit-website-check'
import { sendEvent } from '@/lib/analytics'
import { systemHref, WEBSITE_CHECK_URL_PARAM } from '@/lib/routing'
import { cn } from '@/utilities/ui'
import {
  websiteCheckSchema,
  type WebsiteCheck,
  type WebsiteCheckInput,
} from '@/lib/schemas/website-check'
import {
  ConsentCheckbox,
  Field,
  Honeypot,
  SubmitButton,
  formClasses,
} from '@/components/contact/FormParts'

/**
 * The free website check request. Prefills the URL from `?url=` (what was typed in
 * the website-check banner); success goes to the website-check thank-you page.
 */
export function WebsiteCheckForm({
  title,
  className,
}: {
  /** Heading above the form. Falls back to `websiteCheck.form.title`; '' hides it. */
  title?: string | null
  className?: string
}) {
  const { t } = useTranslations()
  const { locale } = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<WebsiteCheckInput, unknown, WebsiteCheck>({
    resolver: zodResolver(websiteCheckSchema),
    defaultValues: { url: '', name: '', email: '', honeypot: '', gdprConsent: false, locale },
  })

  // Arriving from the banner: keep what was typed there. Read after mount so the
  // server-rendered page and first client render match.
  useEffect(() => {
    const url = new URLSearchParams(window.location.search).get(WEBSITE_CHECK_URL_PARAM)
    if (url && !getValues('url')) setValue('url', url.slice(0, 500))
  }, [getValues, setValue])

  const errorText = (message?: string) => (message ? t(`websiteCheck.errors.${message}`) : null)

  const onSubmit = (values: WebsiteCheck) => {
    startTransition(async () => {
      let result: SubmitWebsiteCheckResult
      try {
        result = await submitWebsiteCheck(values)
      } catch {
        toast.error(t('websiteCheck.form.error'))
        return
      }

      if (result.ok) {
        // After the server accepted it, once per request; see useLeadSubmit.
        sendEvent('form-websitecheck')
        router.push(systemHref(locale, 'thankYouWebsiteCheck'))
        return
      }

      toast.error(
        t(result.error === 'rate_limited' ? 'contact.form.rateLimited' : 'websiteCheck.form.error'),
      )
    })
  }

  const heading = title ?? t('websiteCheck.form.title')

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('paper-card relative grid gap-6 p-6 sm:p-8', className)}
      noValidate
    >
      {heading && <h2 className="font-heading display-3">{heading}</h2>}

      <Honeypot {...register('honeypot')} />

      <Field label={t('websiteCheck.form.url')} error={errorText(errors.url?.message)}>
        {(id) => (
          <input
            id={id}
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder={t('websiteCheck.form.urlPlaceholder')}
            className="field-hand text-lg"
            aria-invalid={Boolean(errors.url)}
            {...register('url')}
          />
        )}
      </Field>

      <div className={formClasses.row}>
        <Field label={t('websiteCheck.form.name')} error={errorText(errors.name?.message)}>
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
        <Field label={t('websiteCheck.form.email')} error={errorText(errors.email?.message)}>
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

      <ConsentCheckbox
        text={t('websiteCheck.form.consent')}
        error={errorText(errors.gdprConsent?.message)}
        {...register('gdprConsent')}
      />

      <div>
        <SubmitButton
          pending={isPending}
          label={t('websiteCheck.form.submit')}
          pendingLabel={t('websiteCheck.form.sending')}
        />
      </div>
    </form>
  )
}
