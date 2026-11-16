const formatter = new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' })

export const formatPrice = (price: number | null | undefined): string | null =>
  typeof price === 'number' ? formatter.format(price) : null
