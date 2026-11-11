import { describe, expect, it, vi } from 'vitest'
import { singleFlight } from './singleFlight'

describe('singleFlight', () => {
  it('shares one run between concurrent callers with the same key', async () => {
    let release!: () => void
    const fn = vi.fn(() => new Promise<void>((r) => { release = r }))
    const load = singleFlight((id: string) => id, fn)
    const a = load('u1')
    const b = load('u1')
    expect(fn).toHaveBeenCalledTimes(1)
    release()
    await Promise.all([a, b])
  })

  it('runs again once the previous run has finished', async () => {
    const fn = vi.fn(async () => {})
    const load = singleFlight((id: string) => id, fn)
    await load('u1')
    await load('u1')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does not share between different keys', () => {
    const fn = vi.fn(() => new Promise<void>(() => {}))
    const load = singleFlight((id: string) => id, fn)
    load('u1')
    load('u2')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('clears a failed run so the next call can retry', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce(undefined)
    const load = singleFlight((id: string) => id, fn)
    await expect(load('u1')).rejects.toThrow('x')
    await expect(load('u1')).resolves.toBeUndefined()
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
