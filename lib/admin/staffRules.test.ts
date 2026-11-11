import { describe, expect, it } from 'vitest'
import { isStaffRole, wouldRemoveLastAdmin } from './staffRules'

const admin = (id: string, test = false) => ({ user_id: id, roles: ['Admin'], is_test_account: test })

describe('wouldRemoveLastAdmin', () => {
  it('refuses to remove the only real Admin', () => {
    expect(wouldRemoveLastAdmin([admin('a')], 'a', 'Admin')).toBe(true)
  })

  it('allows it once there is a second Admin', () => {
    expect(wouldRemoveLastAdmin([admin('a'), admin('b')], 'a', 'Admin')).toBe(false)
  })

  it('does not count test accounts as the remaining Admin', () => {
    expect(wouldRemoveLastAdmin([admin('a'), admin('t', true)], 'a', 'Admin')).toBe(true)
  })

  it('never blocks removing a non-Admin role', () => {
    expect(wouldRemoveLastAdmin([admin('a')], 'a', 'Office Staff')).toBe(false)
  })
})

describe('isStaffRole', () => {
  it('accepts the three staff roles and nothing else', () => {
    expect(['Admin', 'Office Manager', 'Office Staff'].every(isStaffRole)).toBe(true)
    expect(isStaffRole('Member')).toBe(false)
    expect(isStaffRole('admin')).toBe(false)
  })
})
