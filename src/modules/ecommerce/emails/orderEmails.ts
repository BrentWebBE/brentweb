import type { Payload } from 'payload'

import type { Order } from '@/payload-types'

import { runtimeEnv } from '@/utilities/runtimeEnv'

import { formatCents } from '../utilities/formatPrice'

const escape = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

type Line = { title: string; quantity: number; lineTotal: number | undefined }

const idOf = (value: unknown): string | undefined =>
  typeof value === 'string'
    ? value
    : value && typeof value === 'object' && 'id' in value
      ? String(value.id)
      : undefined

const loadLines = async (payload: Payload, order: Order): Promise<Line[]> => {
  const lines: Line[] = []
  for (const item of order.items ?? []) {
    const productID = idOf(item.product)
    const variantID = idOf(item.variant)
    const product = productID
      ? await payload.findByID({
          collection: 'products',
          id: productID,
          depth: 0,
          overrideAccess: true,
          disableErrors: true,
        })
      : null
    const variant = variantID
      ? await payload.findByID({
          collection: 'variants',
          id: variantID,
          depth: 0,
          overrideAccess: true,
          disableErrors: true,
        })
      : null
    const unit = variant?.priceInEUR ?? product?.priceInEUR ?? undefined
    lines.push({
      title: [product?.title ?? 'Product', variant?.title].filter(Boolean).join(' – '),
      quantity: item.quantity,
      lineTotal: typeof unit === 'number' ? unit * item.quantity : undefined,
    })
  }
  return lines
}

const addressBlock = (order: Order): string => {
  const a = (order.shippingAddress ?? {}) as Record<string, string | null | undefined>
  const rows = [
    [a.firstName, a.lastName].filter(Boolean).join(' '),
    a.company,
    a.addressLine1,
    a.addressLine2,
    [a.postalCode, a.city].filter(Boolean).join(' '),
    a.country,
    a.phone,
  ].filter(Boolean)
  return rows.map(escape).join('<br>')
}

const linesTable = (lines: Line[], total: number | null | undefined): string => `
  <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:560px">
    ${lines
      .map(
        (line) => `<tr style="border-bottom:1px solid #e5e5e5">
          <td>${line.quantity} × ${escape(line.title)}</td>
          <td style="text-align:right;white-space:nowrap">${line.lineTotal !== undefined ? formatCents(line.lineTotal) : ''}</td>
        </tr>`,
      )
      .join('')}
    <tr><td><strong>Totaal (incl. btw)</strong></td><td style="text-align:right;white-space:nowrap"><strong>${formatCents(total)}</strong></td></tr>
  </table>`

const layout = (title: string, body: string, businessName: string) => `<!doctype html>
<html lang="nl"><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;line-height:1.5;padding:16px">
  <h1 style="font-size:20px">${escape(title)}</h1>
  ${body}
  <p style="color:#666;font-size:13px;margin-top:32px">${escape(businessName)}</p>
</body></html>`

/** Order confirmation for the customer + "new order" notification for the shop owner. */
export const sendOrderEmails = async ({
  payload,
  order,
}: {
  payload: Payload
  order: Order
}): Promise<void> => {
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    overrideAccess: true,
  })
  const businessName = settings?.businessName || 'Webshop'
  const serverURL = runtimeEnv('NEXT_PUBLIC_SERVER_URL') ?? ''
  const lines = await loadLines(payload, order)
  const table = linesTable(lines, order.amount)
  const address = addressBlock(order)
  const customerEmail = order.customerEmail
  const firstName = (order.shippingAddress as { firstName?: string } | undefined)?.firstName

  if (customerEmail) {
    await payload.sendEmail({
      to: customerEmail,
      subject: `Bevestiging van je bestelling ${order.orderNumber} – ${businessName}`,
      html: layout(
        'Bedankt voor je bestelling!',
        `<p>${firstName ? `Hallo ${escape(firstName)},` : 'Hallo,'}</p>
         <p>We hebben je betaling goed ontvangen. Je bestelnummer is <strong>${escape(order.orderNumber)}</strong>.</p>
         ${table}
         ${address ? `<p><strong>Leveradres</strong><br>${address}</p>` : ''}
         <p>Vragen? Antwoord gewoon op deze e-mail${settings?.phone ? ` of bel ons op ${escape(settings.phone)}` : ''}.</p>`,
        businessName,
      ),
      ...(settings?.email ? { replyTo: settings.email } : {}),
    })
  }

  if (settings?.email) {
    await payload.sendEmail({
      to: settings.email,
      subject: `Nieuwe bestelling ${order.orderNumber} (${formatCents(order.amount)})`,
      html: layout(
        `Nieuwe bestelling ${order.orderNumber}`,
        `<p>Er is een nieuwe, betaalde bestelling binnengekomen.</p>
         <p><strong>Klant:</strong> ${escape(customerEmail ?? '')}</p>
         ${table}
         ${address ? `<p><strong>Leveradres</strong><br>${address}</p>` : ''}
         ${serverURL ? `<p><a href="${escape(serverURL)}/admin/collections/orders/${escape(order.id)}">Bekijk de bestelling in het beheer</a></p>` : ''}`,
        businessName,
      ),
      ...(customerEmail ? { replyTo: customerEmail } : {}),
    })
  } else {
    payload.logger.warn(
      `Order ${order.orderNumber}: no shop e-mail in SiteSettings, owner notification skipped`,
    )
  }
}
