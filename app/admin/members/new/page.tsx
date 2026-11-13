'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { PhoneInput, EINInput, ZipInput } from '@/components/ui/FormattedInputs'
import type { MemberClass, MembershipLevel, Nakshatra } from '@/types/database'
import { AdminFormView, FormSection } from '@/components/admin/AdminFormView'
import { MemberFormFields } from '@/components/admin/MemberFormFields'
import { CreditCardIcon, MailIcon } from 'lucide-react'
import { Field, Input, Select } from '@/components/ui/Field'
import { paymentMethodLabel } from '@/lib/payments/labels'
import type { OfficeMethod } from '@/lib/payments/office'

// Validation schema
const memberSchema = z.object({
  member_class: z.enum(['Personal', 'Business']),
  current_level: z.enum(['Community', 'Annual', 'Lifetime']),
  is_founding_member: z.boolean(),

  // Personal fields
  first_name: z.string().min(1, 'First name is required').optional().or(z.literal('')),
  last_name: z.string().min(1, 'Last name is required').optional().or(z.literal('')),
  profile_name: z.string().optional().or(z.literal('')),
  nakshatra: z.string().optional().or(z.literal('')),
  family_gotra: z.string().optional().or(z.literal('')),

  // Secondary/spouse fields
  secondary_first_name: z.string().optional().or(z.literal('')),
  secondary_last_name: z.string().optional().or(z.literal('')),
  secondary_nakshatra: z.string().optional().or(z.literal('')),
  secondary_email: z.string().email('Invalid email').optional().or(z.literal('')),
  secondary_phone: z.string().optional().or(z.literal('')),

  // Business fields
  business_name: z.string().optional().or(z.literal('')),
  business_ein: z.string().optional().or(z.literal('')),

  // Contact
  primary_email: z.string().email('Invalid email'),
  primary_phone: z.string().optional().or(z.literal('')),
  primary_phone_2: z.string().optional().or(z.literal('')),

  // Address
  address_line_1: z.string().optional().or(z.literal('')),
  address_line_2: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  zip: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('US')),
  mailing_address: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    // All members must have first and last name
    return data.first_name && data.last_name
  },
  {
    message: 'First and last name are required',
    path: ['first_name'],
  }
).refine(
  (data) => {
    // Business members must have business name
    if (data.member_class === 'Business') {
      return data.business_name
    }
    return true
  },
  {
    message: 'Business name is required for Business members',
    path: ['business_name'],
  }
)

type MemberFormData = z.infer<typeof memberSchema>

const NAKSHATRAS: Nakshatra[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshta',
  'Moola', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
]

export default function NewMemberPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendInvitation, setSendInvitation] = useState(true)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      member_class: 'Personal',
      current_level: 'Community',
      is_founding_member: false,
      state: 'FL',
      country: 'US',
    },
  })

  const memberClass = watch('member_class')
  const joiningAs = watch('current_level')
  const [payment, setPayment] = useState({
    when: 'now' as 'now' | 'later',
    method: 'Cash' as OfficeMethod,
    checkNumber: '',
    reference: '',
  })
  const [createdMemberId, setCreatedMemberId] = useState<string | null>(null)
  // One per form: saving twice cannot record the payment twice.
  const [submissionId] = useState(() => crypto.randomUUID())

  const onSubmit = async (data: MemberFormData) => {
    if (createdMemberId) {
      router.push(`/admin/members/${createdMemberId}`)
      return
    }
    try {
      setLoading(true)
      setError(null)

      const paidLevel = data.current_level === 'Community' ? null : data.current_level
      const payingNow = paidLevel !== null && payment.when === 'now'
      if (data.is_founding_member && !(paidLevel === 'Lifetime' && payingNow)) {
        throw new Error('A founding member is a Lifetime member: choose Lifetime and record the payment now.')
      }
      if (payingNow && payment.method === 'Check' && !payment.checkNumber.trim()) {
        throw new Error('Enter the cheque number.')
      }

      // Create member record
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert({
          // The database assigns the number (next in the Community series),
          // under its lock. Everyone starts as Community: a paid level starts
          // when it is paid, and gives a number in that level's series.
          membership_id: '',
          member_class: data.member_class,
          current_level: 'Community',
          requested_level: paidLevel,
          is_founding_member: false,

          // Personal fields
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          member_profile_name: data.profile_name || null,
          nakshatra: (data.nakshatra as Nakshatra) || null,
          family_gotra: data.family_gotra || null,

          // Secondary/spouse
          secondary_first_name: data.secondary_first_name || null,
          secondary_last_name: data.secondary_last_name || null,
          secondary_nakshatra: (data.secondary_nakshatra as Nakshatra) || null,
          secondary_email: data.secondary_email || null,
          secondary_phone: data.secondary_phone || null,

          // Business fields
          business_name: data.business_name || null,
          business_ein: data.business_ein || null,

          // Contact
          primary_email: data.primary_email,
          primary_phone: data.primary_phone || null,
          primary_phone_2: data.primary_phone_2 || null,

          // Address
          address_line_1: data.address_line_1 || null,
          address_line_2: data.address_line_2 || null,
          city: data.city || null,
          state: data.state || null,
          zip: data.zip || null,
          country: data.country || 'US',
          mailing_address: data.mailing_address || null,

          member_since: new Date().toISOString(),
        })
        .select()
        .single()

      if (memberError) throw memberError

      // Paying at the counter: recorded through the same step as any payment,
      // so the level, dates, new number and receipt all follow.
      if (payingNow && paidLevel) {
        const res = await fetch('/api/admin/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            memberId: memberData.id,
            method: payment.method,
            item: { kind: 'membership', level: paidLevel },
            checkNumber: payment.checkNumber,
            reference: payment.reference,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          // The member exists; only the payment needs doing again. Stay here
          // so the office sees why, and make saving again open the member
          // rather than create them twice.
          setCreatedMemberId(memberData.id)
          setError(
            `The member was added (as Community), but the ${paidLevel} payment was not recorded: ${body.error ?? 'unknown error'}. Record it under Payments, Record a payment.`,
          )
          return
        }
        if (data.is_founding_member) {
          await supabase.from('members').update({ is_founding_member: true }).eq('id', memberData.id)
        }
      }

      // Send invitation email if requested
      if (sendInvitation) {
        try {
          await fetch('/api/members/send-invitation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberId: memberData.id,
            }),
          })
        } catch (emailError) {
          console.warn('Failed to send invitation email:', emailError)
        }
      }

      // Redirect to member detail page
      router.push(`/admin/members/${memberData.id}`)
    } catch (err) {
      console.error('Error creating member:', err)
      setError(err instanceof Error ? err.message : 'Failed to create member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminFormView
      eyebrow="Members"
      title="Add a member"
      description="Creates the membership record and, optionally, invites them to the portal."
      backHref="/admin/members"
      onSubmit={handleSubmit(onSubmit)}
      saving={loading}
      saveLabel={createdMemberId ? 'Open the member' : 'Create member'}
      error={error}
    >
      <MemberFormFields register={register} errors={errors} memberClass={memberClass} level={{ mode: 'choose' }} />

      {joiningAs !== 'Community' && (
        <FormSection icon={CreditCardIcon} tone="saffron" title={`${joiningAs} membership payment`}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="When are they paying?" required className="sm:col-span-2">
              {({ id }) => (
                <Select
                  id={id}
                  value={payment.when}
                  onChange={(e) => setPayment({ ...payment, when: e.target.value as 'now' | 'later' })}
                >
                  <option value="now">Now, at the counter</option>
                  <option value="later">Later (online, or at the office)</option>
                </Select>
              )}
            </Field>
            {payment.when === 'now' ? (
              <>
                <Field label="How they paid" required>
                  {({ id }) => (
                    <Select
                      id={id}
                      value={payment.method}
                      onChange={(e) => setPayment({ ...payment, method: e.target.value as OfficeMethod })}
                    >
                      {(['Cash', 'Check', 'Zelle', 'Card'] as const).map((m) => (
                        <option key={m} value={m}>
                          {paymentMethodLabel(m)}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                {payment.method === 'Check' ? (
                  <Field label="Cheque number" required>
                    {({ id }) => (
                      <Input id={id} className="tnum" value={payment.checkNumber} onChange={(e) => setPayment({ ...payment, checkNumber: e.target.value })} />
                    )}
                  </Field>
                ) : payment.method !== 'Cash' ? (
                  <Field label={payment.method === 'Zelle' ? 'Zelle confirmation number' : 'Card machine receipt number'}>
                    {({ id }) => (
                      <Input id={id} className="tnum" value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} />
                    )}
                  </Field>
                ) : null}
                <p className="text-[13.5px] text-ink-3 sm:col-span-2">
                  The membership starts as soon as you save: they get their {joiningAs} number and an emailed
                  receipt. The amount is the {joiningAs} price in Portal Settings.
                </p>
              </>
            ) : (
              <p className="text-[13.5px] text-ink-3 sm:col-span-2">
                They start as a Community member. Their portal asks them to complete their {joiningAs}{' '}
                membership, and the office can record the payment at any time.
              </p>
            )}
          </div>
        </FormSection>
      )}

      <FormSection icon={MailIcon} tone="tulsi" title="Portal access">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={sendInvitation}
            onChange={(e) => setSendInvitation(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-line-strong text-saffron focus:ring-saffron-ring"
          />
          <span>
            <span className="block text-[15px] text-ink">
              Email a portal invitation when this member is created
            </span>
            <span className="block text-[13.5px] text-ink-3">
              They can set up their own sign-in and see their pass, payments and bookings. You can
              always send it later from the member record.
            </span>
          </span>
        </label>
      </FormSection>
    </AdminFormView>
  )
}
