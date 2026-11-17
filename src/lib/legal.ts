/** Enterprise number in the Belgian Crossroads Bank for Enterprises (KBO). */
export const KBO_NUMBER = '1039.059.149'
export const KBO_URL = `https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html?nummer=${KBO_NUMBER.replace(/\./g, '')}&actionLu=Zoek`

/**
 * Business identification the Belgian Code of Economic Law (art. XII.6 WER)
 * requires on the site: legal name, geographic address, KBO number and VAT
 * status. The estimator, its PDF and the price copy read the VAT status here.
 */
export const LEGAL = {
  name: 'Brent Schoenmakers',
  kbo: KBO_NUMBER,
  kboUrl: KBO_URL,
  address: 'Laarsveld 30, 2440 Geel',
  // Small-business VAT exemption (art. 56bis WBTW): no VAT is charged, so
  // every price on the site is final. Set `vat` and flip this if that changes.
  vatExempt: true,
  vat: '',
} as const
