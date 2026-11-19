/**
 * The BrentWeb wordmark: "BRENT" in the ink colour, "WEB" in the accent. One version
 * everywhere (header, footer, preloader, and the static logo files generated from it by
 * scripts/render-logos.mjs); the old thin drawing with the ".be" tagline is retired.
 *
 * The source glyphs (public/logo.svg in the old site) are outlines whose lines are ~4
 * units thick: at header size that renders near 1px. Each glyph is also stroked in its
 * own colour, STROKE units wide, so every line is >= 2px at the smallest header size
 * (16px tall) and the proportions are the same at every size.
 */

/** The word plus room for the stroke. */
export const VIEW_BOX = '233 322 561 72'
/** In viewBox units, so the weight scales with the logo. */
export const STROKE = 5

type Tone = 'mark' | 'accent'

/**
 * The glyphs as data, so consumers can address them from CSS: `[data-tone]` for colour,
 * `:nth-child` for the preloader's stagger, which draws them in read order.
 */
const PATHS: { d: string; tone: Tone }[] = [
  // "Brent"
  {
    tone: 'mark',
    d: 'M285.2,362.2c-2.3-2.7-5.8-4.4-10.3-5.3,3.1-1,5.8-2.8,7.6-5.3,1.9-2.4,2.9-5.4,2.9-9.1s-2-9.1-5.8-11.9-9.1-4.2-15.9-4.2h-26.3v4h26.1c5.5,0,9.7,1.1,12.7,3.2s4.5,5.2,4.5,9.3-1.5,7.3-4.5,9.4c-3,2.2-7.2,3.2-12.7,3.2h-26.1v4h28.1c6,0,10.7,1.1,13.9,3.2,3.1,2.2,4.8,5.4,4.8,9.8s-1.6,7.7-4.8,9.9c-3.1,2.2-7.7,3.1-13.9,3.1h-28.1v4h28.1c7.6,0,13.4-1.4,17.4-4.3,3.9-2.9,5.8-6.9,5.8-12.3s-1.3-7.7-3.6-10.5h0Z',
  },
  {
    tone: 'mark',
    d: 'M338.4,367.4c4.7-1.3,8.4-3.7,10.9-7.1s3.9-7.6,3.9-12.6-2.2-11.8-6.8-15.6c-4.5-3.8-10.7-5.7-18.6-5.7h-22.6v4.1h22.6c6.7,0,11.8,1.5,15.4,4.5,3.5,3,5.3,7.2,5.3,12.6s-1.8,9.7-5.3,12.7c-3.6,3-8.7,4.4-15.4,4.4h-22.6v24.7h4.6v-20.6h18c1.8,0,3.9,0,6.1-.5l15,21.1h5.2l-15.8-22Z',
  },
  {
    tone: 'mark',
    d: 'M410.8,355.4h-40.8v4h40.8v-4ZM410.8,326.4h-40.8v4.1h40.8v-4.1ZM370.1,385.3v4.1h40.8v-4.1h-40.8Z',
  },
  {
    tone: 'mark',
    d: 'M481.7,326.4h-4.6v54.7l-42.8-54.7h-3.9v63h4.6v-54.7l42.9,54.7h3.8v-63Z',
  },
  { tone: 'mark', d: 'M515.7,330.6v58.9h4.6v-58.9h22.7v-4.1h-49.9v4.1h22.7Z' },
  // "web"
  {
    tone: 'accent',
    d: 'M661.7,326.4h-4.5l-19.3,56.8-19.6-56.8h-4.4l-19.7,56.7-19.2-56.7h-4.9l21.4,63h4.9l19.6-56.5,19.5,56.5h4.9l21.3-63Z',
  },
  {
    tone: 'accent',
    d: 'M715.6,355.4h-40.8v4h40.8v-4ZM715.6,326.4h-40.8v4.1h40.8v-4.1ZM674.9,385.3v4.1h40.8v-4.1h-40.8Z',
  },
  {
    tone: 'accent',
    d: 'M782.9,362.2c-2.3-2.7-5.8-4.4-10.3-5.3,3.2-1,5.8-2.8,7.6-5.3,1.9-2.4,2.9-5.4,2.9-9.1s-2-9.1-5.8-11.9-9.1-4.2-15.9-4.2h-26.3v4h26.1c5.5,0,9.7,1.1,12.7,3.2,3,2.2,4.5,5.2,4.5,9.3s-1.5,7.3-4.5,9.4c-3,2.2-7.2,3.2-12.7,3.2h-26.1v4h28.1c6,0,10.7,1.1,13.9,3.2,3.2,2.2,4.8,5.4,4.8,9.8s-1.6,7.7-4.8,9.9c-3.2,2.2-7.7,3.1-13.9,3.1h-28.1v4h28.1c7.6,0,13.4-1.4,17.4-4.3,3.9-2.9,5.8-6.9,5.8-12.3s-1.3-7.7-3.6-10.5Z',
  },
]

const FILL: Record<Tone, string> = {
  mark: 'currentColor',
  accent: 'var(--color-accent)',
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={VIEW_BOX}
      className={className}
      role="img"
      aria-label="BrentWeb"
      xmlns="http://www.w3.org/2000/svg"
    >
      {PATHS.map(({ d, tone }) => (
        <path
          key={d.slice(0, 24)}
          d={d}
          data-tone={tone}
          fill={FILL[tone]}
          stroke={FILL[tone]}
          strokeLinejoin="round"
          strokeWidth={STROKE}
          /* Every contour gets length 1, so the preloader's single dasharray draws
           * them all at the same pace whatever their real length. */
          pathLength={1}
        />
      ))}
    </svg>
  )
}
