import React from 'react'

/** Admin guidance shown under every heading field. */
export const MARKED_HELP = {
  nl: 'Kort en concreet: zeg wat de bezoeker hier ziet of krijgt, in zes woorden of minder.',
  en: 'Short and concrete: say what the visitor sees or gets here, in six words or fewer.',
}

/**
 * Headings from the first design could carry _underline_ or ==highlight== markup; it is
 * stripped, since every heading is now set in one weight and one colour. The redesign sets every
 * heading in one weight, one colour (no accented word); the markup stays harmless.
 */
export function Marked({ text }: { text: string | null | undefined }) {
  return <>{plainText(text)}</>
}

/** Strips the markup, for <title>, alt text and structured data. */
export const plainText = (text: string | null | undefined): string =>
  (text ?? '').replace(/==([^=]+)==/g, '$1').replace(/_([^_]+)_/g, '$1')
