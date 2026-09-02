'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { verifyQRToken } from '@/lib/qr-token'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import type { Member, FamilyMember } from '@/types/database'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select } from '@/components/ui/Field'
import { FilterTabs } from '@/components/ui/FilterTabs'
import { IconTile } from '@/components/ui/IconTile'
import { formatDate } from '@/utils/format'
import {
  QrCodeIcon,
  CameraIcon,
  SearchIcon,
  UserIcon,
  UsersIcon,
  CheckIcon,
  RotateCcwIcon,
} from 'lucide-react'

function ScanQRContent() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  const [scanning, setScanning] = useState(false)
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera')
  const [cameraError, setCameraError] = useState<string | null>(null)

  const [verifying, setVerifying] = useState(false)
  const [member, setMember] = useState<Member | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [error, setError] = useState<string | null>(null)

  const [manualInput, setManualInput] = useState('')
  const [manualSearchType, setManualSearchType] = useState<'id' | 'name' | 'email' | 'phone'>('id')

  const supabase = createClient()

  // Start camera scanning
  const startScanning = async () => {
    try {
      setCameraError(null)
      setError(null)

      if (!videoRef.current) return

      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader

      const videoInputDevices = await codeReader.listVideoInputDevices()

      if (videoInputDevices.length === 0) {
        setCameraError('No camera found. Please use manual lookup.')
        return
      }

      // Prefer back camera on mobile
      const selectedDevice = videoInputDevices.find(device =>
        device.label.toLowerCase().includes('back')
      ) || videoInputDevices[0]

      setScanning(true)

      codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        async (result, err) => {
          if (result) {
            const text = result.getText()
            // Extract token from URL (format: .../verify-qr?token=xxx)
            const tokenMatch = text.match(/token=([^&]+)/)
            if (tokenMatch) {
              await verifyMember(tokenMatch[1])
              stopScanning()
            }
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error('Scan error:', err)
          }
        }
      )
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError('Unable to access camera. Please check permissions or use manual lookup.')
      setScanning(false)
    }
  }

  // Stop camera scanning
  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }
    setScanning(false)
  }

  // Verify member from QR token
  const verifyMember = async (token: string) => {
    setVerifying(true)
    setError(null)
    setMember(null)

    try {
      // Verify the JWT token
      const payload = verifyQRToken(token)

      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', payload.memberId)
        .single()

      if (memberError) throw memberError
      setMember(memberData)

      // Fetch family members if Personal
      if (memberData.member_class === 'Personal') {
        const { data: familyData } = await supabase
          .from('family_members')
          .select('*')
          .eq('member_id', memberData.id)
          .order('created_at', { ascending: false })

        setFamilyMembers(familyData || [])
      }
    } catch (err) {
      console.error('Error verifying QR:', err)
      setError(err instanceof Error ? err.message : 'Failed to verify member')
    } finally {
      setVerifying(false)
    }
  }

  // Manual lookup
  const handleManualSearch = async () => {
    if (!manualInput.trim()) return

    setVerifying(true)
    setError(null)
    setMember(null)

    try {
      let query = supabase.from('members').select('*')

      switch (manualSearchType) {
        case 'id':
          query = query.eq('membership_id', manualInput.trim())
          break
        case 'email':
          query = query.eq('primary_email', manualInput.trim())
          break
        case 'phone':
          query = query.eq('primary_phone', manualInput.trim())
          break
        case 'name':
          // Search in both first_name/last_name and business_name
          query = query.or(`first_name.ilike.%${manualInput.trim()}%,last_name.ilike.%${manualInput.trim()}%,business_name.ilike.%${manualInput.trim()}%`)
          break
      }

      const { data: memberData, error: memberError } = await query.single()

      if (memberError) {
        if (memberError.code === 'PGRST116') {
          throw new Error('No member found with that information')
        }
        throw memberError
      }

      setMember(memberData)

      // Fetch family members if Personal
      if (memberData.member_class === 'Personal') {
        const { data: familyData } = await supabase
          .from('family_members')
          .select('*')
          .eq('member_id', memberData.id)
          .order('created_at', { ascending: false })

        setFamilyMembers(familyData || [])
      }
    } catch (err) {
      console.error('Error searching member:', err)
      setError(err instanceof Error ? err.message : 'Failed to find member')
    } finally {
      setVerifying(false)
    }
  }

  // Reset to scan again
  const resetScan = () => {
    setMember(null)
    setFamilyMembers([])
    setError(null)
    setManualInput('')
    if (scanMode === 'camera') {
      startScanning()
    }
  }

  // Record check-in
  const recordCheckIn = async () => {
    if (!member) return

    try {
      // The table is `ledger_entries`; `activity_log` does not exist, so this
      // insert always failed. `activity_type` is a Postgres enum whose values
      // are Visit | Puja | Event | Donation | Service | Membership -- "Temple
      // Visit" was not one of them -- and the column is `description`, not
      // `notes`, and it is NOT NULL.
      const { error } = await supabase
        .from('ledger_entries')
        .insert({
          member_id: member.id,
          activity_type: 'Visit',
          activity_date: new Date().toISOString(),
          description: 'Checked in at the temple (QR scan)',
        })

      if (error) throw error

      alert('Check-in recorded successfully!')
      resetScan()
    } catch (err) {
      console.error('Check-in error:', err)
      alert('Failed to record check-in')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  // Auto-start camera on mount if camera mode
  useEffect(() => {
    if (scanMode === 'camera') {
      startScanning()
    }
    return () => {
      stopScanning()
    }
  }, [scanMode])

  const getMembershipColor = () => {
    if (!member) return 'bg-transparent0'
    switch (member.current_level) {
      case 'Lifetime': return 'bg-amber-500'
      case 'Annual': return 'bg-blue-500'
      case 'Community': return 'bg-green-500'
      default: return 'bg-transparent0'
    }
  }

  const displayName = member?.member_class === 'Personal'
    ? `${member.first_name} ${member.last_name}`
    : member?.business_name

  const levelTone: Record<string, 'kumkum' | 'saffron' | 'tulsi' | 'neutral'> = {
    Lifetime: 'kumkum',
    Annual: 'saffron',
    Community: 'tulsi',
  }

  const memberName = member
    ? member.member_class === 'Business'
      ? member.business_name || member.membership_id
      : [member.first_name, member.last_name].filter(Boolean).join(' ') || member.membership_id
    : ''

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Office console"
        title="Check a member in"
        description="Scan their pass, or look them up by name, email or phone."
      />

      {error && (
        <Alert tone="danger" title="Could not verify that">
          {error}
        </Alert>
      )}

      {/* ---- Result ---- */}
      {member ? (
        <div className="space-y-6">
          <Card spine="tulsi" className="pl-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <IconTile icon={UserIcon} tone="tulsi" size="lg" shape="arch" />
                <div className="min-w-0">
                  <p className="truncate font-serif text-[30px] leading-tight text-ink">
                    {memberName}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone={levelTone[member.current_level] ?? 'neutral'}>
                      {member.current_level}
                    </Badge>
                    <span className="tnum text-[14px] text-ink-3">{member.membership_id}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" icon={RotateCcwIcon} onClick={resetScan}>
                  Scan another
                </Button>
                <Button icon={CheckIcon} onClick={recordCheckIn}>
                  Check in
                </Button>
              </div>
            </div>

            <div className="mt-6">
              <DescriptionList
                columns={2}
                items={[
                  { label: 'Email', value: member.primary_email ?? '\—' },
                  {
                    label: 'Phone',
                    value: member.primary_phone ?? '\—',
                    numeric: true,
                  },
                  { label: 'Class', value: member.member_class },
                  {
                    label: 'Member since',
                    value: member.member_since ? formatDate(member.member_since) : '\—',
                    numeric: true,
                  },
                ]}
              />
            </div>
          </Card>

          {familyMembers.length > 0 && (
            <Card>
              <CardHeader
                title="Household"
                description="Everyone covered by this membership."
              />
              <ul className="grid gap-3 sm:grid-cols-2">
                {familyMembers.map((fm) => (
                  <li key={fm.id} className="flex items-center gap-3">
                    <IconTile icon={UsersIcon} tone="lotus" size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">
                        {fm.first_name} {fm.last_name}
                      </p>
                      <p className="truncate text-[13px] text-ink-3">{fm.relationship}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <Card>
            <CardHeader title="How would you like to find them?" />

            <FilterTabs
              label="Lookup method"
              options={['camera', 'manual']}
              value={scanMode}
              onChange={(v) => setScanMode(v as 'camera' | 'manual')}
              renderLabel={(v) => (v === 'camera' ? 'Scan a pass' : 'Look them up')}
            />

            {scanMode === 'camera' ? (
              <div className="mt-5">
                {cameraError ? (
                  <Alert tone="warning" title="No camera available">
                    {cameraError} You can still look the member up by name, email or phone.
                  </Alert>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-line bg-ink">
                    <video ref={videoRef} className="h-auto w-full" />
                  </div>
                )}
                <p className="mt-3 flex items-center gap-2 text-[13.5px] text-ink-3">
                  <CameraIcon className="h-4 w-4" aria-hidden="true" />
                  {scanning
                    ? 'Point the camera at the QR code on their pass.'
                    : 'Starting the camera...'}
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <Field label="Search by">
                  {({ id }) => (
                    <Select
                      id={id}
                      value={manualSearchType}
                      onChange={(e) =>
                        setManualSearchType(
                          e.target.value as 'id' | 'name' | 'email' | 'phone'
                        )
                      }
                    >
                      <option value="id">Membership number</option>
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                    </Select>
                  )}
                </Field>

                <Field label="Details">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleManualSearch()
                        }
                      }}
                      className={manualSearchType === 'name' ? undefined : 'tnum'}
                    />
                  )}
                </Field>

                <Button
                  icon={SearchIcon}
                  fullWidth
                  loading={verifying}
                  disabled={!manualInput.trim()}
                  onClick={handleManualSearch}
                >
                  Find member
                </Button>
              </div>
            )}
          </Card>

          <Card tone="sunk">
            <EmptyState
              icon={QrCodeIcon}
              title="Nobody scanned yet"
              description="Once a pass is scanned or a member found, their details and household appear here so you can check them in."
            />
          </Card>
        </div>
      )}
    </div>
  )
}

export default function ScanQRPage() {
  return <ScanQRContent />
}
