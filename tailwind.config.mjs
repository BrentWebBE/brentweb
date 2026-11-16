/** @type {import('tailwindcss').Config} */
// Prose (rich text) reads the Hallmark tokens in src/client/tokens.css.
const config = {
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: [
            {
              '--tw-prose-body': 'var(--color-ink-2)',
              '--tw-prose-headings': 'var(--color-ink)',
              '--tw-prose-lead': 'var(--color-ink-2)',
              '--tw-prose-links': 'var(--color-ink)',
              '--tw-prose-bold': 'var(--color-ink)',
              '--tw-prose-counters': 'var(--color-muted)',
              '--tw-prose-bullets': 'var(--color-accent)',
              '--tw-prose-hr': 'var(--color-rule)',
              '--tw-prose-quotes': 'var(--color-ink)',
              '--tw-prose-quote-borders': 'var(--color-rule)',
              '--tw-prose-captions': 'var(--color-muted)',
              '--tw-prose-code': 'var(--color-ink)',
              '--tw-prose-th-borders': 'var(--color-rule)',
              '--tw-prose-td-borders': 'var(--color-rule)',
              '--tw-prose-invert-body': 'var(--color-ink-2)',
              '--tw-prose-invert-headings': 'var(--color-ink)',
              '--tw-prose-invert-links': 'var(--color-ink)',
              '--tw-prose-invert-bold': 'var(--color-ink)',
              '--tw-prose-invert-bullets': 'var(--color-accent)',
              maxWidth: '68ch',
              'h2, h3, h4': {
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                letterSpacing: '-0.02em',
              },
              h2: { fontSize: 'var(--text-2xl)', marginTop: '2em', lineHeight: '1.15' },
              h3: { fontSize: 'var(--text-lg)' },
              a: {
                fontWeight: '500',
                textDecorationColor: 'var(--color-rule)',
                textUnderlineOffset: '0.22em',
              },
              'a:hover': { textDecorationColor: 'var(--color-accent)' },
            },
          ],
        },
      },
    },
  },
}

export default config
