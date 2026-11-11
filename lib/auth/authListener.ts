/**
 * The callback for `supabase.auth.onAuthStateChange`, kept synchronous.
 *
 * Supabase runs this callback while it holds its internal auth lock. Any
 * Supabase call awaited INSIDE it (a query, getSession, ...) waits for that same
 * lock, and the lock waits for the callback: a deadlock. That is what happened
 * on a fresh sign-in (2026-11-11): the member and role lookups hung, the 15 s
 * safety timeout in AuthContext fired with no roles loaded, and an Admin was
 * sent to /unauthorized. Supabase's documentation says the same: do not await
 * other Supabase calls in this callback, defer them.
 *
 * So the callback only records the user and schedules the lookups for after it
 * returns (`defer`, a zero-delay timeout in the app). Tested in
 * authListener.test.ts.
 */
export interface AuthListenerDeps<U> {
  setUser: (user: U | null) => void
  /** Load the member record(s) and roles. Runs AFTER the callback returns. */
  load: (user: U) => Promise<void>
  /** Clear member and role state on sign-out. */
  clear: () => void
  setLoading: (loading: boolean) => void
  defer?: (fn: () => void) => void
}

export function makeAuthListener<U>({
  setUser,
  load,
  clear,
  setLoading,
  defer = (fn) => setTimeout(fn, 0),
}: AuthListenerDeps<U>) {
  return (_event: string, session: { user?: U | null } | null): void => {
    const user = session?.user ?? null
    setUser(user)
    if (!user) {
      clear()
      setLoading(false)
      return
    }
    defer(() => {
      load(user)
        .catch((error) => console.error('[AuthContext] Loading member and roles failed:', error))
        .finally(() => setLoading(false))
    })
  }
}
