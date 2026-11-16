'use client'

import { Toaster as Sonner, toast } from 'sonner'
import { useTheme } from '@/providers/Theme'

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Toast host in the paper style: card background, ink outline and offset shadow.
 * Sonner reads its colours from these CSS variables.
 */
const Toaster = ({ style, toastOptions, ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme ?? 'light'}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--card)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--foreground)',
          '--border-radius': '14px 22px 16px 20px',
          ...style,
        } as React.CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast:
            'group toast font-sans !border-[1.5px] !shadow-[3px_4px_0_var(--shadow-ink)] group-[.toaster]:bg-card group-[.toaster]:text-foreground',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
