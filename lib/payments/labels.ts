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
