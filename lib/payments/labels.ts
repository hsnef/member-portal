import type { PaymentMethod } from '@/types/database'

/** How a payment method reads to a member: on receipts, emails and screens. */
export function paymentMethodLabel(method: PaymentMethod | string): string {
  switch (method) {
    case 'Stripe':
      return 'Card (online)'
    case 'Card':
      return 'Card (at the temple)'
    case 'Check':
      return 'Cheque'
    case 'Cash':
      return 'Cash'
    case 'Zelle':
      return 'Zelle'
    default:
      return String(method)
  }
}

/**
 * The receipt number to print for a payment loaded with `receipts(receipt_number)`.
 * Every payment recorded through the settlement step has one (RCP-YYYY-NNNNNN);
 * a payment recorded before receipts existed falls back to a reference made
 * from its id, marked as such.
 */
export function receiptNumberOf(p: { id: string; receipts?: Array<{ receipt_number: string }> | { receipt_number: string } | null }): string {
  const r = Array.isArray(p.receipts) ? p.receipts[0] : p.receipts
  return r?.receipt_number ?? `REF-${p.id.slice(0, 8).toUpperCase()}`
}
