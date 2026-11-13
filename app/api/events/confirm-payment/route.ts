import { POST } from '../../stripe/confirm-payment/route'

/**
 * Same as /api/stripe/confirm-payment: paid event registrations are recorded
 * by the one settlement step like every other payment. This route used to
 * insert columns that do not exist, so no paid registration ever succeeded.
 */
export { POST }
