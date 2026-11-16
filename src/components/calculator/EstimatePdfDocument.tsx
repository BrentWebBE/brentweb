import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Messages, Locale } from '@/i18n'
import {
  PRICING,
  formatCostRange,
  formatEuro,
  formatRange,
  lineLabel,
  type EstimatorResult,
} from '@/lib/calculator/pricing'
import { LEGAL } from '@/lib/legal'
import type { AiAnalysis, EstimateInput } from '@/lib/schemas/lead'

/**
 * The site's paper palette as hex: @react-pdf renders outside a CSS engine and can't
 * read the theme's custom properties. Mirrors the light tokens in
 * src/client/theme.css (converted from oklch); update both together.
 */
const BRAND_COLORS = {
  primary: '#c22826', // --primary
  foreground: '#291f19', // --foreground
  mutedForeground: '#5b5048', // --muted-foreground
  border: '#d4c9b9', // --border
  muted: '#f1eadf', // --muted
  accent: '#f6e281', // --accent (highlighter)
} as const

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    color: BRAND_COLORS.foreground,
    fontFamily: 'Helvetica',
  },
  brand: {
    fontSize: 12,
    color: BRAND_COLORS.primary,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  meta: {
    fontSize: 10,
    color: BRAND_COLORS.mutedForeground,
    marginBottom: 28,
  },
  section: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: `1px solid ${BRAND_COLORS.border}`,
  },
  sectionLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: BRAND_COLORS.mutedForeground,
    marginBottom: 6,
  },
  bigValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_COLORS.primary,
  },
  value: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
  },
  listItem: {
    fontSize: 11,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  noteBox: {
    backgroundColor: BRAND_COLORS.accent,
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: BRAND_COLORS.foreground,
  },
  footer: {
    fontSize: 9,
    color: BRAND_COLORS.mutedForeground,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottom: `0.5px solid ${BRAND_COLORS.border}`,
  },
  rowTotal: {
    flexDirection: 'row',
    paddingTop: 6,
    fontFamily: 'Helvetica-Bold',
  },
  cellLabel: { flex: 1, fontSize: 10, paddingRight: 8 },
  cellHours: { width: 60, fontSize: 10, textAlign: 'right' },
  cellCost: { width: 110, fontSize: 10, textAlign: 'right' },
  reason: { fontSize: 8, color: BRAND_COLORS.mutedForeground, marginTop: 1 },
  aiTag: { fontSize: 8, color: BRAND_COLORS.primary, fontFamily: 'Helvetica-Bold' },
  small: { fontSize: 9, color: BRAND_COLORS.mutedForeground, marginTop: 6, lineHeight: 1.4 },
  paragraph: { fontSize: 10, lineHeight: 1.5 },
  subLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginTop: 8, marginBottom: 3 },
  twoCol: { flexDirection: 'row', gap: 24 },
  col: { flex: 1 },
})

interface EstimatePdfProps {
  name: string
  input: EstimateInput
  result: EstimatorResult
  /** Already verified by the caller; null renders the rule-based estimate only. */
  ai: AiAnalysis | null
  generatedAt: string
  /**
   * The visitor's message bundle and translator. @react-pdf renders outside
   * React context, so translations have to be passed in explicitly.
   */
  messages: Messages
  t: (key: string, params?: Record<string, string | number>) => string
  locale: Locale
}

export function EstimatePdfDocument({
  name,
  input,
  result,
  ai,
  generatedAt,
  messages,
  t,
  locale,
}: EstimatePdfProps) {
  const { calculator } = messages
  const pdf = calculator.pdf
  const included = input.scope.flatMap((key) => calculator.scope.options[key].includes)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>brentweb.be</Text>
        <Text style={styles.title}>{pdf.title}</Text>
        <Text style={styles.meta}>
          {t('calculator.pdf.preparedFor', { name, date: generatedAt })}
        </Text>

        <View style={[styles.section, styles.twoCol]}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>{pdf.budgetLabel}</Text>
            <Text style={styles.bigValue}>{formatCostRange(result.cost, locale)}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>{pdf.hoursLabel}</Text>
            <Text style={styles.value}>
              {t('calculator.pdf.hoursValue', { hours: formatRange(result.hours, locale) })}
            </Text>
            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>{pdf.timelineLabel}</Text>
            <Text style={styles.value}>
              {t('calculator.pdf.weeks', {
                min: result.estimatedWeeks[0],
                max: result.estimatedWeeks[1],
              })}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{pdf.breakdownLabel}</Text>
          {result.lines.map((line, i) => (
            <View key={i} style={styles.row} wrap={false}>
              <View style={styles.cellLabel}>
                <Text>
                  {line.kind === 'ai' && <Text style={styles.aiTag}>AI </Text>}
                  {lineLabel(line, t)}
                </Text>
                {line.kind === 'ai' && <Text style={styles.reason}>{line.reason}</Text>}
              </View>
              <Text style={styles.cellHours}>{formatRange(line.hours, locale)} h</Text>
              <Text style={styles.cellCost}>{formatCostRange(line.cost, locale)}</Text>
            </View>
          ))}
          <View style={styles.rowTotal}>
            <Text style={styles.cellLabel}>{calculator.result.totalLabel}</Text>
            <Text style={styles.cellHours}>{formatRange(result.hours, locale)} h</Text>
            <Text style={styles.cellCost}>{formatCostRange(result.cost, locale)}</Text>
          </View>
          <Text style={styles.small}>
            {t('calculator.result.rateNote', { rate: formatEuro(PRICING.hourlyRate, locale) })}{' '}
            {LEGAL.vatExempt ? messages.pricing.vatExempt : messages.pricing.vatExcluded}
            {result.aiAdjusted ? ` ${pdf.aiNote}` : ''}
          </Text>
        </View>

        <View style={[styles.section, styles.twoCol]}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>{pdf.scopeLabel}</Text>
            {input.scope.map((key) => (
              <Text key={key} style={styles.listItem}>
                • {calculator.scope.options[key].label}
              </Text>
            ))}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>{pdf.timelinePreferenceLabel}</Text>
            <Text style={styles.listItem}>{calculator.timeline.options[input.timeline]}</Text>
            {result.monthly > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 8 }]}>{pdf.maintenanceLabel}</Text>
                <Text style={styles.listItem}>
                  {calculator.extras.maintenance.options[input.maintenance].label}:{' '}
                  {t('calculator.extras.maintenance.perMonth', {
                    amount: formatEuro(result.monthly, locale),
                  })}
                </Text>
              </>
            )}
          </View>
        </View>

        {result.isRush && (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>{calculator.result.rushNote}</Text>
          </View>
        )}

        {input.description.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{pdf.descriptionLabel}</Text>
            <Text style={styles.paragraph}>{input.description.trim()}</Text>
          </View>
        )}

        {ai && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{pdf.aiLabel}</Text>
            <Text style={styles.paragraph}>{ai.summary}</Text>
            <PdfList title={pdf.risksLabel} items={ai.risks} />
            <PdfList title={pdf.assumptionsLabel} items={ai.assumptions} />
            <PdfList title={pdf.questionsLabel} items={ai.questions} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{pdf.includedLabel}</Text>
          {included.map((item) => (
            <Text key={item} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>

        <Text style={styles.footer}>{pdf.footer}</Text>
      </Page>
    </Document>
  )
}

function PdfList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <View>
      <Text style={styles.subLabel}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.listItem}>
          • {item}
        </Text>
      ))}
    </View>
  )
}
