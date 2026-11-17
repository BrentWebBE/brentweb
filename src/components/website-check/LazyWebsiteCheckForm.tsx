'use client'

import { lazy, Suspense, type ComponentProps } from 'react'
import type { WebsiteCheckForm as Form } from './WebsiteCheckForm'

const WebsiteCheckForm = lazy(() =>
  import('./WebsiteCheckForm').then((m) => ({ default: m.WebsiteCheckForm })),
)

/**
 * The website-check form as its own chunk, so the form, react-hook-form and zod
 * only ship to the page that renders it. Same props as WebsiteCheckForm.
 */
export function LazyWebsiteCheckForm(props: ComponentProps<typeof Form>) {
  return (
    <Suspense fallback={<div aria-hidden className="min-h-[34rem]" />}>
      <WebsiteCheckForm {...props} />
    </Suspense>
  )
}
