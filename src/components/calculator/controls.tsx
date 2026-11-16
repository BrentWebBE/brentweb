'use client'

import { useId, type ReactNode } from 'react'
import { cn } from '@/utilities/ui'

/**
 * Small building blocks shared by the estimator steps. Every option is a real
 * <button>, so keyboard and screen-reader users get the same cards; single
 * choices announce as radios, multi-select as toggle buttons.
 */

export const estimatorClasses = {
  title: 'font-heading display-3',
  description: 'mt-2 max-w-2xl text-muted-foreground',
  fieldLabel: 'block font-semibold',
  help: 'text-sm text-muted-foreground',
  actions: 'mt-8 flex flex-wrap items-center justify-end gap-3',
  options: 'mt-3 grid gap-3 sm:grid-cols-2',
  optionsThree: 'mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
  subTitle: 'font-heading text-xl',
  list: 'list-ticks mt-3',
} as const

/** A hand-drawn tick, shown in the corner of a picked card. */
function Tick() {
  return (
    <svg aria-hidden viewBox="0 0 26 22" className="size-5 shrink-0 text-primary">
      <path
        d="M2 12.5c2.6 1.6 5 4.2 6.6 7C11.8 12.4 17.4 5.6 24 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function OptionCard({
  selected,
  onClick,
  label,
  description,
  aside,
  role,
}: {
  selected: boolean
  onClick: () => void
  label: string
  description?: string
  /** Right-hand extra, e.g. the price a feature adds. */
  aside?: ReactNode
  role?: 'radio'
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === 'radio' ? selected : undefined}
      aria-pressed={role === 'radio' ? undefined : selected}
      className={cn(
        'group flex h-full flex-col gap-1.5 rounded-[12px_18px_14px_16px] border-[1.5px] bg-card p-4 text-left transition-[transform,box-shadow,border-color,background-color] duration-150',
        selected
          ? 'border-foreground bg-[color-mix(in_oklch,var(--accent)_28%,var(--card))] shadow-[3px_4px_0_var(--shadow-ink)]'
          : 'border-border hover:-rotate-[0.4deg] hover:border-foreground',
      )}
      onClick={onClick}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="font-semibold leading-snug">{label}</span>
        {selected ? <Tick /> : <span aria-hidden className="size-5 shrink-0" />}
      </span>
      {description && (
        <span className="text-sm leading-relaxed text-muted-foreground">{description}</span>
      )}
      {aside && <span className="hand mt-auto pt-1 text-xl text-primary">{aside}</span>}
    </button>
  )
}

/** A labelled single-choice group of option cards. */
export function ChoiceGroup<K extends string>({
  label,
  options,
  value,
  onChange,
  describe,
  aside,
  columns = 3,
}: {
  label: string
  options: readonly K[]
  value: K
  onChange: (value: K) => void
  describe: (key: K) => { label: string; description?: string }
  aside?: (key: K) => ReactNode
  columns?: 2 | 3
}) {
  const id = useId()
  return (
    <div>
      <span id={id} className={estimatorClasses.fieldLabel}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={id}
        className={columns === 3 ? estimatorClasses.optionsThree : estimatorClasses.options}
      >
        {options.map((key) => (
          <OptionCard
            key={key}
            role="radio"
            selected={value === key}
            onClick={() => onChange(key)}
            {...describe(key)}
            aside={aside?.(key)}
          />
        ))}
      </div>
    </div>
  )
}

/** Number input with -/+ buttons, clamped to [min, max]. */
export function Stepper({
  label,
  help,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  help?: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  const id = useId()
  const set = (next: number) => onChange(Math.min(max, Math.max(min, Math.round(next) || min)))
  const buttonClass =
    'grid size-11 place-items-center rounded-[10px_14px_12px_9px] border-[1.5px] border-foreground bg-card text-xl font-semibold transition-transform hover:-rotate-3 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:rotate-0'

  return (
    <div>
      <label htmlFor={id} className={estimatorClasses.fieldLabel}>
        {label}
      </label>
      {help && <p className={estimatorClasses.help}>{help}</p>}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={() => set(value - 1)}
          disabled={value <= min}
          aria-label={`${label} -1`}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          className="field-hand w-20 text-center text-lg font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          min={min}
          max={max}
          value={value}
          onChange={(event) => set(Number(event.target.value))}
        />
        <button
          type="button"
          className={buttonClass}
          onClick={() => set(value + 1)}
          disabled={value >= max}
          aria-label={`${label} +1`}
        >
          +
        </button>
      </div>
    </div>
  )
}

export function StepShell({
  title,
  description,
  children,
  actions,
}: {
  title: string
  description?: string
  children: ReactNode
  actions: ReactNode
}) {
  return (
    <div>
      <h2 className={estimatorClasses.title}>{title}</h2>
      {description && <p className={estimatorClasses.description}>{description}</p>}
      <div className="mt-8 grid gap-9">{children}</div>
      <div className={estimatorClasses.actions}>{actions}</div>
    </div>
  )
}

/** Back / next pair used at the bottom of most steps. */
export function StepNav({
  backLabel,
  nextLabel,
  onBack,
  onNext,
}: {
  backLabel: string
  nextLabel: string
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <button type="button" className="btn btn-ghost" onClick={onBack}>
        ← {backLabel}
      </button>
      <button type="button" className="btn btn-primary" onClick={onNext}>
        {nextLabel} →
      </button>
    </>
  )
}
