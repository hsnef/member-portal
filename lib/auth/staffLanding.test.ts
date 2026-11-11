import { describe, expect, it } from 'vitest'
import { shouldSendToOfficeConsole } from './staffLanding'

const done = { authLoading: false, memberLoading: false }

describe('shouldSendToOfficeConsole', () => {
  it('sends staff with no membership to the office console', () => {
    expect(shouldSendToOfficeConsole({ ...done, hasMembership: false, isStaff: true })).toBe(true)
  })

  it('keeps staff who are also members on their member home', () => {
    expect(shouldSendToOfficeConsole({ ...done, hasMembership: true, isStaff: true })).toBe(false)
  })

  it('never redirects a non-staff account, member or not', () => {
    expect(shouldSendToOfficeConsole({ ...done, hasMembership: false, isStaff: false })).toBe(false)
  })

  it('waits while auth or the member lookup is still loading', () => {
    expect(shouldSendToOfficeConsole({ authLoading: true, memberLoading: false, hasMembership: false, isStaff: true })).toBe(false)
    expect(shouldSendToOfficeConsole({ authLoading: false, memberLoading: true, hasMembership: false, isStaff: true })).toBe(false)
  })
})
