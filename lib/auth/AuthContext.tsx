'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { UserRole, Member } from '@/types/database'

interface AuthContextType {
  user: User | null
  member: Member | null              // Active member (backward compatibility)
  members: Member[]                  // All linked members
  activeMemberId: string | null      // Currently active member ID
  roles: UserRole[]
  loading: boolean
  signOut: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  refreshMember: () => Promise<void>
  setActiveMember: (memberId: string) => void  // Switch between memberships
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create supabase client outside component to avoid recreating on every render
const supabase = createClient()

// localStorage key for persisting active membership selection
const ACTIVE_MEMBER_STORAGE_KEY = 'hsnef_active_member_id'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch member(s) and roles for the authenticated user
  // Supports multiple memberships per email
  const fetchMemberAndRoles = async (userId: string, userEmail?: string) => {
    try {
      // Fetch ALL members linked to this auth_user_id
      let membersResult = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', userId)

      // Did the link attempt come back with a definitive "this address has no
      // member record"? Only a real 404 counts. A network failure or a 500 must
      // never be treated as an answer -- see the eviction check below.
      let linkDefinitelyFoundNothing = false

      // If no members found, try to auto-link by email via server API
      if ((!membersResult.data || membersResult.data.length === 0) && userEmail) {
        console.log('[AuthContext] No members found by auth_user_id, trying server-side auto-link')

        try {
          // Call server API to link member(s) (bypasses RLS)
          const linkResponse = await fetch('/api/auth/link-member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })

          if (linkResponse.ok) {
            const linkData = await linkResponse.json()
            console.log('[AuthContext] Server auto-link response:', linkData)

            if (linkData.success) {
              // Re-fetch all members with updated auth_user_id
              membersResult = await supabase
                .from('members')
                .select('*')
                .eq('auth_user_id', userId)
              console.log('[AuthContext] Re-fetched members after linking:', membersResult.data?.length)
            }
          } else {
            const errorData = await linkResponse.json().catch(() => ({}))
            console.warn('[AuthContext] Server auto-link failed:', linkResponse.status, errorData)
            // 404 is the route's way of saying no member record exists for this
            // address. Any other status is a fault, not a verdict.
            if (linkResponse.status === 404) linkDefinitelyFoundNothing = true
          }
        } catch (linkError) {
          console.error('[AuthContext] Error calling link-member API:', linkError)
        }
      }

      // Fetch roles (always do this regardless of member status)
      const rolesResult = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)

      // Handle members result
      if (membersResult.error || !membersResult.data || membersResult.data.length === 0) {
        console.log('[AuthContext] No members found')
        setMembers([])
        setMember(null)
        setActiveMemberId(null)
      } else {
        const allMembers = membersResult.data
        setMembers(allMembers)

        // Determine active member:
        // 1. Check localStorage for saved preference
        // 2. Fall back to first member
        let savedMemberId: string | null = null
        try {
          savedMemberId = localStorage.getItem(ACTIVE_MEMBER_STORAGE_KEY)
        } catch {
          // localStorage may not be available (SSR)
        }

        const savedMember = savedMemberId
          ? allMembers.find(m => m.id === savedMemberId)
          : null

        const activeM = savedMember || allMembers[0]
        setActiveMemberId(activeM.id)
        setMember(activeM)  // backward compatibility

        console.log('[AuthContext] Loaded', allMembers.length, 'member(s), active:', activeM.membership_id)
      }

      // Handle roles result
      if (rolesResult.error) {
        console.error('[AuthContext] Error fetching roles:', rolesResult.error)
        setRoles([])
      } else {
        setRoles(rolesResult.data.map((r: { role: UserRole }) => r.role))
      }

      // Evict an account that belongs to nobody.
      //
      // /login refuses an unknown address before sending a sign-in link, but
      // Google sign-in cannot be gated that way: the flow goes to Google and the
      // address only comes back afterwards. Without this, any Google account
      // could sign in and hold a permanent account that no membership will ever
      // claim -- exactly the stranded state /login now prevents.
      //
      // Every one of these must hold before signing anyone out, because the cost
      // of a false positive is ejecting a real member:
      //   - the member lookup SUCCEEDED and genuinely returned nothing
      //   - the roles lookup SUCCEEDED and genuinely returned nothing, so staff
      //     who hold a role but no member row are never touched
      //   - link-member answered 404 specifically. A network error or a 500 is a
      //     fault, not a verdict, and leaves the session alone.
      const noMembers = !membersResult.error && (membersResult.data?.length ?? 0) === 0
      const noRoles = !rolesResult.error && (rolesResult.data?.length ?? 0) === 0

      if (noMembers && noRoles && linkDefinitelyFoundNothing) {
        console.warn('[AuthContext] Account has no membership and no role; signing out')
        await supabase.auth.signOut()
        setUser(null)
        setMembers([])
        setMember(null)
        setActiveMemberId(null)
        setRoles([])
        if (typeof window !== 'undefined') {
          window.location.href = '/login?reason=no-membership'
        }
        return
      }
    } catch (error) {
      console.error('[AuthContext] Error in fetchMemberAndRoles:', error)
      setMembers([])
      setMember(null)
      setActiveMemberId(null)
      setRoles([])
    }
  }

  // Initialize auth state
  useEffect(() => {
    // Add final timeout to prevent infinite loading
    const finalTimeoutId = setTimeout(() => {
      console.error('[AuthContext] Auth timeout after 15s - forcing loading to false')
      setLoading(false)
    }, 15000)

    // Get initial session
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        clearTimeout(finalTimeoutId)

        if (error) {
          console.error('[AuthContext] Session error:', error)
          setUser(null)
          setLoading(false)
          return
        }

        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchMemberAndRoles(session.user.id, session.user.email)
        }
        setLoading(false)
      })
      .catch((err) => {
        clearTimeout(finalTimeoutId)
        console.error('[AuthContext] getSession() error:', err)
        setUser(null)
        setLoading(false)
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchMemberAndRoles(session.user.id, session.user.email)
      } else {
        setMember(null)
        setMembers([])
        setActiveMemberId(null)
        setRoles([])
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setMember(null)
      setMembers([])
      setActiveMemberId(null)
      setRoles([])
      // Clear saved membership selection
      try {
        localStorage.removeItem(ACTIVE_MEMBER_STORAGE_KEY)
      } catch {
        // localStorage may not be available
      }
      // Redirect to home page after sign out
      window.location.href = '/'
    } catch (error) {
      console.error('[AuthContext] Sign out error:', error)
      // Clear state and localStorage even on error
      try {
        localStorage.removeItem(ACTIVE_MEMBER_STORAGE_KEY)
      } catch {
        // localStorage may not be available
      }
      // Still redirect even if there's an error
      window.location.href = '/'
    }
  }

  // Switch to a different membership
  const setActiveMember = (memberId: string) => {
    const newActive = members.find(m => m.id === memberId)
    if (newActive) {
      setActiveMemberId(memberId)
      setMember(newActive)  // backward compatibility
      try {
        localStorage.setItem(ACTIVE_MEMBER_STORAGE_KEY, memberId)
      } catch {
        // localStorage may not be available
      }
      console.log('[AuthContext] Switched to member:', newActive.membership_id)
    }
  }

  // Check if user has specific role
  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role)
  }

  // Check if user has any of the specified roles
  const hasAnyRole = (checkRoles: UserRole[]): boolean => {
    return checkRoles.some((role) => roles.includes(role))
  }

  // Manually refresh member data (useful after profile updates)
  const refreshMember = async () => {
    if (user) {
      await fetchMemberAndRoles(user.id, user.email)
    }
  }

  const value: AuthContextType = {
    user,
    member,
    members,
    activeMemberId,
    roles,
    loading,
    signOut,
    hasRole,
    hasAnyRole,
    refreshMember,
    setActiveMember,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
