import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAuthLock, type LockManagerLike } from './authLock'

/**
 * A fake of navigator.locks for one exclusive lock: one holder at a time, a
 * queue, `ifAvailable`, `signal` (gives up waiting with AbortError) and
 * `steal` (the holder loses the lock and the stealer runs at once).
 */
function fakeLocks() {
  const abortError = () => Object.assign(new Error('aborted'), { name: 'AbortError' })
  let holder: { reject: (e: unknown) => void } | null = null
  const queue: Array<() => void> = []

  const release = () => {
    holder = null
    queue.shift()?.()
  }

  const locks: LockManagerLike = {
    request(_name, options, callback) {
      return new Promise((resolve, reject) => {
        const run = () => {
          holder = { reject }
          Promise.resolve()
            .then(() => callback({}))
            .then(resolve, reject)
            .finally(() => { if (holder?.reject === reject) release() })
        }
        if (options.steal) {
          holder?.reject(abortError())
          holder = null
          return run()
        }
        if (!holder) return run()
        if (options.ifAvailable) {
          return Promise.resolve().then(() => callback(null)).then(resolve, reject)
        }
        queue.push(run)
        options.signal?.addEventListener('abort', () => {
          const i = queue.indexOf(run)
          if (i >= 0) { queue.splice(i, 1); reject(abortError()) }
        })
      })
    },
  }
  return { locks, isHeld: () => holder !== null }
}

/** A holder that never finishes, like a tab frozen mid-refresh. */
const frozen = () => new Promise<never>(() => {})

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('auth lock', () => {
  it('runs straight away when the lock is free', async () => {
    const { locks } = fakeLocks()
    const lock = makeAuthLock({ locks, timeoutMs: 1000 })
    await expect(lock('auth', -1, async () => 'ok')).resolves.toBe('ok')
  })

  it('still makes tabs take turns: the second waits for the first', async () => {
    const { locks } = fakeLocks()
    const lock = makeAuthLock({ locks, timeoutMs: 1000 })
    const order: string[] = []
    let finishFirst!: () => void
    const first = lock('auth', -1, () => new Promise<void>((r) => { order.push('first start'); finishFirst = () => { order.push('first end'); r() } }))
    await vi.advanceTimersByTimeAsync(0)
    const second = lock('auth', -1, async () => { order.push('second') })
    await vi.advanceTimersByTimeAsync(500)
    expect(order).toEqual(['first start'])
    finishFirst()
    await Promise.all([first, second])
    expect(order).toEqual(['first start', 'first end', 'second'])
  })

  it('takes the lock over from a frozen holder after the timeout, instead of hanging', async () => {
    const { locks } = fakeLocks()
    const onTakeover = vi.fn()
    const lock = makeAuthLock({ locks, timeoutMs: 1000, onTakeover })
    lock('auth', -1, frozen).catch(() => {}) // the frozen tab loses its lock
    await vi.advanceTimersByTimeAsync(0)

    const waiting = lock('auth', -1, async () => 'recovered')
    await vi.advanceTimersByTimeAsync(999)
    expect(onTakeover).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await expect(waiting).resolves.toBe('recovered')
    expect(onTakeover).toHaveBeenCalledWith('auth')
  })

  it('"only if free" (0) still fails at once when the lock is held', async () => {
    const { locks } = fakeLocks()
    const lock = makeAuthLock({ locks, timeoutMs: 1000 })
    lock('auth', -1, frozen).catch(() => {})
    await vi.advanceTimersByTimeAsync(0)
    await expect(lock('auth', 0, async () => 'ran')).rejects.toMatchObject({ isAcquireTimeout: true })
  })

  it('an explicit wait (>0) fails with a timeout error rather than taking over', async () => {
    const { locks } = fakeLocks()
    const onTakeover = vi.fn()
    const lock = makeAuthLock({ locks, timeoutMs: 1000, onTakeover })
    lock('auth', -1, frozen).catch(() => {})
    await vi.advanceTimersByTimeAsync(0)
    const waiting = lock('auth', 200, async () => 'ran')
    const settled = expect(waiting).rejects.toMatchObject({ isAcquireTimeout: true })
    await vi.advanceTimersByTimeAsync(200)
    await settled
    expect(onTakeover).not.toHaveBeenCalled()
  })

  it('passes an error from the work itself through, without taking over', async () => {
    const { locks, isHeld } = fakeLocks()
    const onTakeover = vi.fn()
    const lock = makeAuthLock({ locks, timeoutMs: 1000, onTakeover })
    await expect(lock('auth', -1, async () => { throw new Error('refresh failed') })).rejects.toThrow('refresh failed')
    expect(onTakeover).not.toHaveBeenCalled()
    expect(isHeld()).toBe(false)
  })

  it('runs without locking where the browser has no Web Locks', async () => {
    const lock = makeAuthLock({ locks: undefined })
    await expect(lock('auth', -1, async () => 'ok')).resolves.toBe('ok')
  })
})
