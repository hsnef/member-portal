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
  const fetchMemberAndRoles = async (userId: string) => {
    try {
      console.log('[AuthContext] fetchMemberAndRoles starting for userId:', userId)

      // Fetch member record
      console.log('[AuthContext] Starting member query...')
      const memberQuery = supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', userId)
        .single()

      const memberTimeout = setTimeout(() => {
        console.error('[AuthContext] Member query timeout after 5s')
      }, 5000)

      const { data: memberData, error: memberError } = await memberQuery
      clearTimeout(memberTimeout)

      console.log('[AuthContext] Member query completed:', { hasData: !!memberData, error: memberError })

      if (memberError) {
        console.error('[AuthContext] Error fetching member:', memberError)
        setMember(null)
      } else {
        console.log('[AuthContext] Member found:', memberData?.membership_id)
        setMember(memberData)
      }

      // Fetch user roles
      console.log('[AuthContext] Starting roles query...')
      const rolesQuery = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)

      const rolesTimeout = setTimeout(() => {
        console.error('[AuthContext] Roles query timeout after 5s')
      }, 5000)

      const { data: rolesData, error: rolesError } = await rolesQuery
      clearTimeout(rolesTimeout)

      console.log('[AuthContext] Roles query completed:', { count: rolesData?.length, error: rolesError })

      if (rolesError) {
        console.error('[AuthContext] Error fetching roles:', rolesError)
        setRoles([])
      } else {
        console.log('[AuthContext] Roles found:', rolesData.map((r: { role: UserRole }) => r.role))
        setRoles(rolesData.map((r: { role: UserRole }) => r.role))
      }
      console.log('[AuthContext] fetchMemberAndRoles completed')
    } catch (error) {
      console.error('[AuthContext] Error in fetchMemberAndRoles:', error)
      setMember(null)
      setRoles([])
    }
  }

  // Initialize auth state
  useEffect(() => {
    console.log('[AuthContext] Initializing auth state...')

    // Add timeout to detect slow getSession (warning only)
    const warningTimeoutId = setTimeout(() => {
      console.warn('[AuthContext] getSession() taking longer than expected (5s)...')
    }, 5000)

    // Add final timeout to prevent infinite loading
    const finalTimeoutId = setTimeout(() => {
      console.error('[AuthContext] getSession() timeout after 15s - forcing loading to false')
      setLoading(false)
    }, 15000)

    // Get initial session
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        clearTimeout(warningTimeoutId)
        clearTimeout(finalTimeoutId)
        console.log('[AuthContext] Got session response:', { hasSession: !!session, error })

        if (error) {
          console.error('[AuthContext] Session error:', error)
          setUser(null)
          setLoading(false)
          return
        }

        console.log('[AuthContext] Got session:', session ? 'User logged in' : 'No user')
        setUser(session?.user ?? null)
        if (session?.user) {
          console.log('[AuthContext] Fetching member and roles for user:', session.user.id)
          await fetchMemberAndRoles(session.user.id)
        }
        console.log('[AuthContext] Setting loading to false')
        setLoading(false)
      })
      .catch((err) => {
        clearTimeout(warningTimeoutId)
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
        await fetchMemberAndRoles(session.user.id)
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
    await supabase.auth.signOut()
    setUser(null)
    setMember(null)
    setRoles([])
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
      await fetchMemberAndRoles(user.id)
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
