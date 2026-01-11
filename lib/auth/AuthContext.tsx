'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { UserRole, Member } from '@/types/database'

interface AuthContextType {
  user: User | null
  member: Member | null
  roles: UserRole[]
  loading: boolean
  signOut: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  refreshMember: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create supabase client outside component to avoid recreating on every render
const supabase = createClient()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch member and roles for the authenticated user
  const fetchMemberAndRoles = async (userId: string, userEmail?: string) => {
    try {
      // First try to fetch member by auth_user_id
      let memberResult = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', userId)
        .single()

      // If no member found by auth_user_id, try to auto-link by email via server API
      if (memberResult.error && userEmail) {
        console.log('[AuthContext] No member found by auth_user_id, trying server-side auto-link')

        try {
          // Call server API to link member (bypasses RLS)
          const linkResponse = await fetch('/api/auth/link-member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })

          if (linkResponse.ok) {
            const linkData = await linkResponse.json()
            console.log('[AuthContext] Server auto-link response:', linkData)

            if (linkData.success) {
              // Re-fetch the member with updated auth_user_id
              memberResult = await supabase
                .from('members')
                .select('*')
                .eq('auth_user_id', userId)
                .single()
              console.log('[AuthContext] Re-fetched member after linking:', memberResult.data?.id)
            }
          } else {
            const errorData = await linkResponse.json().catch(() => ({}))
            console.warn('[AuthContext] Server auto-link failed:', linkResponse.status, errorData)
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

      // Handle member result
      if (memberResult.error) {
        console.error('[AuthContext] Error fetching member:', memberResult.error)
        setMember(null)
      } else {
        setMember(memberResult.data)
      }

      // Handle roles result
      if (rolesResult.error) {
        console.error('[AuthContext] Error fetching roles:', rolesResult.error)
        setRoles([])
      } else {
        setRoles(rolesResult.data.map((r: { role: UserRole }) => r.role))
      }
    } catch (error) {
      console.error('[AuthContext] Error in fetchMemberAndRoles:', error)
      setMember(null)
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
      setRoles([])
      // Redirect to home page after sign out
      window.location.href = '/'
    } catch (error) {
      console.error('[AuthContext] Sign out error:', error)
      // Still redirect even if there's an error
      window.location.href = '/'
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
    roles,
    loading,
    signOut,
    hasRole,
    hasAnyRole,
    refreshMember,
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
