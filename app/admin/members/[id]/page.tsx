'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FamilyMembersSection } from '@/components/admin/FamilyMembersSection'
import { createClient } from '@/lib/supabase/client'
import type { Member, FamilyMember, Membership } from '@/types/database'
import { AppLink } from '@/components/nav/Nav'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { EmptyState } from '@/components/ui/EmptyState'
import { RecordHeader } from '@/components/ui/RecordHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  UserIcon,
  PencilIcon,
  MailIcon,
  FileClockIcon,
  ShieldCheckIcon,
  UserXIcon,
} from 'lucide-react'
import { formatDate } from '@/utils/format'

export default function MemberDetailPage() {
  const params = useParams()
  const memberId = params.id as string

  const [member, setMember] = useState<Member | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClient()

  const fetchMemberData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single()

      if (memberError) throw memberError
      setMember(memberData)

      // Fetch family members (if Personal)
      if (memberData.member_class === 'Personal') {
        const { data: familyData } = await supabase
          .from('family_members')
          .select('*')
          .eq('member_id', memberId)
          .order('created_at', { ascending: false })

        setFamilyMembers(familyData || [])
      }

      // Fetch membership history
      const { data: membershipData } = await supabase
        .from('memberships')
        .select('*')
        .eq('member_id', memberId)
        .order('start_date', { ascending: false })

      setMemberships(membershipData || [])

    } catch (err) {
      console.error('Error fetching member:', err)
      setError(err instanceof Error ? err.message : 'Failed to load member')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemberData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Lifetime':
        return 'bg-saffron text-white'
      case 'Annual':
        return 'bg-blue-500 text-white'
      case 'Community':
        return 'bg-transparent0 text-white'
      default:
        return 'bg-gray-200 text-gray-800'
    }
  }

  const handleSendInvitation = async () => {
    if (!member) return

    try {
      setSendingEmail(true)
      setEmailMessage(null)

      const response = await fetch('/api/members/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setEmailMessage({ type: 'success', text: 'Invitation email sent successfully!' })

      // Clear message after 5 seconds
      setTimeout(() => setEmailMessage(null), 5000)
    } catch (err) {
      console.error('Error sending invitation:', err)
      setEmailMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to send invitation email'
      })
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Loading this member...</span>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !member) {
    return (
      <EmptyState
        icon={UserXIcon}
        title="Member not found"
        description={error ?? 'This member may have been removed.'}
        action={
          <AppLink to="/admin/members">
            <Button>Back to the directory</Button>
          </AppLink>
        }
      />
    )
  }

  const isPersonal = member.member_class === 'Personal'
  const displayName = isPersonal
    ? [member.first_name, member.last_name].filter(Boolean).join(' ') || member.membership_id
    : member.business_name || member.membership_id

  const levelTone: Record<string, 'kumkum' | 'saffron' | 'tulsi' | 'neutral'> = {
    Lifetime: 'kumkum',
    Annual: 'saffron',
    Community: 'tulsi',
  }

  return (
    <div className="space-y-7">
      <RecordHeader
        crumbs={[{ label: 'Members', to: '/admin/members' }, { label: displayName }]}
        icon={UserIcon}
        tone="kumkum"
        eyebrow={member.member_class}
        title={displayName}
        meta={
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={levelTone[member.current_level] ?? 'neutral'}>
              {member.current_level}
            </Badge>
            {member.is_founding_member && <Badge tone="marigold">Founding member</Badge>}
            <span className="tnum text-[14px] text-ink-3">{member.membership_id}</span>
          </div>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <AppLink to={`/admin/members/${member.id}/audit-log`}>
              <Button variant="secondary" icon={FileClockIcon}>
                History
              </Button>
            </AppLink>
            <AppLink to={`/admin/members/${member.id}/edit`}>
              <Button icon={PencilIcon}>Edit</Button>
            </AppLink>
          </div>
        }
      />

      {emailMessage && (
        <Alert
          tone={emailMessage.type === 'success' ? 'success' : 'danger'}
          title={emailMessage.type === 'success' ? 'Sent' : "That didn't send"}
        >
          {emailMessage.text}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader title={isPersonal ? 'Member details' : 'Business details'} />
            <DescriptionList
              columns={2}
              items={
                isPersonal
                  ? [
                      { label: 'First name', value: member.first_name ?? '\—' },
                      { label: 'Last name', value: member.last_name ?? '\—' },
                      { label: 'Profile name', value: member.member_profile_name ?? '\—' },
                      { label: 'Nakshatra', value: member.nakshatra ?? '\—' },
                      { label: 'Family gotra', value: member.family_gotra ?? '\—' },
                      {
                        label: 'Member since',
                        value: member.member_since ? formatDate(member.member_since) : '\—',
                        numeric: true,
                      },
                    ]
                  : [
                      { label: 'Business name', value: member.business_name ?? '\—' },
                      { label: 'EIN', value: member.business_ein ?? '\—', numeric: true },
                      {
                        label: 'Member since',
                        value: member.member_since ? formatDate(member.member_since) : '\—',
                        numeric: true,
                      },
                    ]
              }
            />
          </Card>

          <Card>
            <CardHeader title="Contact" />
            <DescriptionList
              columns={2}
              items={[
                { label: 'Email', value: member.primary_email },
                { label: 'Phone', value: member.primary_phone ?? '\—', numeric: true },
                ...(member.primary_phone_2
                  ? [{ label: 'Alternate phone', value: member.primary_phone_2, numeric: true }]
                  : []),
              ]}
            />

            {isPersonal && (member.secondary_first_name || member.secondary_email) && (
              <div className="mt-5 rounded-2xl border border-line bg-surface-sunk p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">
                  Spouse or partner
                </p>
                <div className="mt-3">
                  <DescriptionList
                    columns={2}
                    items={[
                      {
                        label: 'Name',
                        value:
                          [member.secondary_first_name, member.secondary_last_name]
                            .filter(Boolean)
                            .join(' ') || '\—',
                      },
                      { label: 'Email', value: member.secondary_email ?? '\—' },
                      {
                        label: 'Phone',
                        value: member.secondary_phone ?? '\—',
                        numeric: true,
                      },
                      { label: 'Nakshatra', value: member.secondary_nakshatra ?? '\—' },
                    ]}
                  />
                </div>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Address" />
            <DescriptionList
              columns={2}
              items={[
                { label: 'Line 1', value: member.address_line_1 ?? '\—' },
                { label: 'Line 2', value: member.address_line_2 ?? '\—' },
                { label: 'City', value: member.city ?? '\—' },
                { label: 'State', value: member.state ?? '\—' },
                { label: 'ZIP', value: member.zip ?? '\—', numeric: true },
                { label: 'Country', value: member.country ?? '\—' },
              ]}
            />
          </Card>

          {isPersonal && (
            <Card>
              <FamilyMembersSection
                memberId={member.id}
                familyMembers={familyMembers}
                onRefresh={fetchMemberData}
              />
            </Card>
          )}

          <Card>
            <CardHeader title="Membership history" />
            {memberships.length === 0 ? (
              <p className="text-[15px] text-ink-2">No membership records yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {memberships.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-4 py-3.5">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{m.level}</p>
                      <p className="tnum mt-0.5 text-[13px] text-ink-3">
                        {m.start_date ? formatDate(m.start_date) : '\—'}
                        {m.end_date ? ` \→ ${formatDate(m.end_date)}` : ''}
                      </p>
                    </div>
                    <Badge tone={m.status === 'Active' ? 'tulsi' : 'neutral'}>{m.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Rail */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <Card spine="saffron" className="pl-7">
            <CardHeader title="At a glance" />
            <DescriptionList
              items={[
                { label: 'Membership', value: member.membership_id, numeric: true },
                { label: 'Level', value: member.current_level },
                { label: 'Class', value: member.member_class },
                {
                  label: 'Portal access',
                  value: member.auth_user_id ? 'Linked' : 'Not linked',
                },
                { label: 'Household', value: String(familyMembers.length + 1), numeric: true },
              ]}
            />
          </Card>

          <Card>
            <CardHeader title="Actions" />
            <div className="space-y-2.5">
              <Button
                variant="secondary"
                fullWidth
                icon={MailIcon}
                loading={sendingEmail}
                onClick={handleSendInvitation}
              >
                {member.auth_user_id ? 'Resend portal invitation' : 'Send portal invitation'}
              </Button>
              <AppLink to={`/admin/members/${member.id}/login-activity`} className="block">
                <Button variant="secondary" fullWidth icon={ShieldCheckIcon}>
                  Sign-in history
                </Button>
              </AppLink>
              <AppLink to={`/admin/members/${member.id}/audit-log`} className="block">
                <Button variant="secondary" fullWidth icon={FileClockIcon}>
                  Change history
                </Button>
              </AppLink>
            </div>
          </Card>

          <Card tone="sunk">
            <CardHeader title="Record" />
            <DescriptionList
              items={[
                {
                  label: 'Created',
                  value: member.created_at ? formatDate(member.created_at) : '\—',
                  numeric: true,
                },
                {
                  label: 'Updated',
                  value: member.updated_at ? formatDate(member.updated_at) : '\—',
                  numeric: true,
                },
                ...(member.legacy_id
                  ? [{ label: 'Legacy id', value: member.legacy_id, numeric: true }]
                  : []),
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
