import { describe, expect, it, vi } from 'vitest'
import { makeAuthListener } from './authListener'

function setup(load = vi.fn(async () => {})) {
  const deferred: Array<() => void> = []
  const deps = {
    setUser: vi.fn(),
    load,
    clear: vi.fn(),
    setLoading: vi.fn(),
    defer: (fn: () => void) => deferred.push(fn),
  }
  return { listener: makeAuthListener(deps), deps, deferred }
}

describe('makeAuthListener', () => {
  it('returns without calling Supabase, and loads only after the callback has returned', () => {
    const { listener, deps, deferred } = setup()
    const result = listener('SIGNED_IN', { user: { id: 'u1' } })
    expect(result).toBeUndefined() // synchronous: nothing for Supabase to await
    expect(deps.setUser).toHaveBeenCalledWith({ id: 'u1' })
    expect(deps.load).not.toHaveBeenCalled()
    expect(deferred).toHaveLength(1)
  })

  it('runs the deferred load and then ends loading', async () => {
    const { listener, deps, deferred } = setup()
    listener('SIGNED_IN', { user: { id: 'u1' } })
    deferred[0]()
    await vi.waitFor(() => expect(deps.setLoading).toHaveBeenCalledWith(false))
    expect(deps.load).toHaveBeenCalledWith({ id: 'u1' })
  })

  it('still ends loading when the load fails', async () => {
    const { listener, deps, deferred } = setup(vi.fn(async () => { throw new Error('network') }))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    listener('SIGNED_IN', { user: { id: 'u1' } })
    deferred[0]()
    await vi.waitFor(() => expect(deps.setLoading).toHaveBeenCalledWith(false))
  })

  it('clears state on sign-out without deferring anything', () => {
    const { listener, deps, deferred } = setup()
    listener('SIGNED_OUT', null)
    expect(deps.setUser).toHaveBeenCalledWith(null)
    expect(deps.clear).toHaveBeenCalled()
    expect(deps.setLoading).toHaveBeenCalledWith(false)
    expect(deferred).toHaveLength(0)
  })
})
