/**
 * The membership_id to send when the office approves an application.
 *
 * The approve dialog pre-fills the next number from generate_membership_id.
 * That suggestion is read when the dialog opens, so another approval can take
 * it in the meantime. When the office keeps it, send nothing: the members
 * trigger assigns the next number in the same transaction as the insert, under
 * the lock (migration 20261111000003). When the office typed its own number,
 * send that; the UNIQUE constraint still rejects a duplicate.
 */
export function membershipIdForInsert(entered: string, suggested: string): string | undefined {
  const value = entered.trim()
  if (suggested !== '' && value === suggested) return undefined
  return value
}
