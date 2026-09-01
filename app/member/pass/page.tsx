'use client'

import { useEffect, useState } from 'react'
import { MembershipPass } from '@/components/member/MembershipPass'
import { AppLink } from '@/components/nav/Nav'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { IdCardIcon, PrinterIcon, UserXIcon } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { Member, FamilyMember } from '@/types/database'

export default function MemberPassPage() {
  const { user, member: authMember } = useAuth()
  const [member, setMember] = useState<Member | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [qrToken, setQrToken] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchMemberData = async () => {
      if (!user || !authMember) {
        setLoading(false)
        return
      }

      try {
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('id', authMember.id)
          .single()

        if (memberError) throw memberError
        setMember(memberData)

        if (memberData.member_class === 'Personal') {
          const { data: familyData } = await supabase
            .from('family_members')
            .select('*')
            .eq('member_id', memberData.id)
            .order('created_at', { ascending: false })

          setFamilyMembers(familyData || [])
        }

        // Generate QR token via API (server-side only)
        try {
          const qrResponse = await fetch(`/api/members/${memberData.id}/qr-token`)
          if (qrResponse.ok) {
            const qrData = await qrResponse.json()
            setQrToken(qrData.token)
          }
        } catch (qrError) {
          console.error('Error fetching QR token:', qrError)
        }

      } catch (err) {
        console.error('Error fetching member data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMemberData()
  }, [user, authMember, supabase])

  if (loading) {
    return (
      <div className="mx-auto max-w-xl space-y-5" role="status" aria-live="polite">
        <span className="sr-only">Loading your pass…</span>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[420px] w-full rounded-3xl" />
      </div>
    )
  }

  if (!member) {
    return (
      <EmptyState
        icon={UserXIcon}
        title="No membership found"
        description="Your account is not yet linked to a membership, so there is no pass to show."
        action={
          <AppLink to="/member">
            <Button>Back to my portal</Button>
          </AppLink>
        }
      />
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="hs-no-print">
        <PageHeader
          eyebrow="Show this at the desk"
          title="My membership pass"
          description="Staff scan the code to check you in. It refreshes each time you open this page."
          actions={
            <Button
              variant="secondary"
              icon={PrinterIcon}
              onClick={() => window.print()}
            >
              Print
            </Button>
          }
        />
      </div>

      <MembershipPass member={member} familyMembers={familyMembers} qrToken={qrToken} />

      <Card tone="sunk" className="hs-no-print flex items-start gap-3">
        <IdCardIcon className="mt-0.5 h-5 w-5 shrink-0 text-saffron" aria-hidden="true" />
        <p className="text-[14.5px] leading-relaxed text-ink-2">
          Add this page to your home screen for quick access at the temple. If the code will not
          scan, reload the page to issue a fresh one.
        </p>
      </Card>
    </div>
  )
}
