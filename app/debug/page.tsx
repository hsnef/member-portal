'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugPage() {
  const [authUser, setAuthUser] = useState<any>(null)
  const [memberRecord, setMemberRecord] = useState<any>(null)
  const [rolesRecord, setRolesRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const debug = async () => {
      const supabase = createClient()

      // Get current auth user
      const { data: { user } } = await supabase.auth.getUser()
      setAuthUser(user)

      if (user) {
        // Try to find member record
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        setMemberRecord({ data: member, error: memberError })

        // Try to find roles
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)

        setRolesRecord({ data: roles, error: rolesError })
      }

      setLoading(false)
    }

    debug()
  }, [])

  if (loading) {
    return <div className="p-8">Loading debug info...</div>
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Auth Debug Page</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Auth User</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(authUser, null, 2)}
        </pre>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Member Record</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(memberRecord, null, 2)}
        </pre>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">User Roles</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(rolesRecord, null, 2)}
        </pre>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
          <li>Check if auth_user_id in member record matches user.id above</li>
          <li>Check if user_id in roles record matches user.id above</li>
          <li>If member record is null, you need to create it in Supabase</li>
          <li>If roles record is empty, you need to add Admin role in Supabase</li>
        </ol>
      </div>
    </div>
  )
}
