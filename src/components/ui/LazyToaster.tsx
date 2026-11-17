'use client'

import dynamic from 'next/dynamic'

/**
 * The toast host, loaded after hydration instead of with the page. Toasts only ever
 * follow a form submission, which is seconds away at the earliest, so sonner has no
 * business in the initial bundle. Render once, e.g. in the frontend layout.
 */
export const LazyToaster = dynamic(() => import('./sonner').then((m) => m.Toaster), {
  ssr: false,
})
