import { describe, expect, it } from 'vitest'
import { membershipIdForInsert } from './membershipIdChoice'

describe('membershipIdForInsert', () => {
  it('leaves the number to the database when the office kept the suggestion', () => {
    expect(membershipIdForInsert('20000200', '20000200')).toBeUndefined()
    expect(membershipIdForInsert(' 20000200 ', '20000200')).toBeUndefined()
  })

  it('sends the number the office typed instead', () => {
    expect(membershipIdForInsert('20004500', '20000200')).toBe('20004500')
  })

  it('sends the typed number when no suggestion could be loaded', () => {
    expect(membershipIdForInsert('20004500', '')).toBe('20004500')
  })
})
