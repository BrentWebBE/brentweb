'use client'

import { useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import { useEffect } from 'react'

/** The cart was purchased: forget it in this browser so the next visit starts empty. */
export const ClearCartOnSuccess: React.FC = () => {
  const { clearSession } = useEcommerce()
  useEffect(() => {
    clearSession()
  }, [clearSession])
  return null
}
