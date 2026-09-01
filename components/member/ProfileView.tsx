'use client'

/**
 * Member profile form — presentation only.
 *
 * app/member/profile/page.tsx owns the fetch, the formData state and the
 * Supabase update. This file renders the fields.
 *
 * Exemplar: design-kit/pages/Profile.tsx
 */

import React from 'react'
import { BuildingIcon, HomeIcon, MailIcon, SaveIcon, UserIcon, UsersIcon } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { IconTile } from '@/components/ui/IconTile'
import { PageHeader } from '@/components/ui/PageHeader'
import { AppLink } from '@/components/nav/Nav'
import type { Member, Nakshatra } from '@/types/database'
import type { Tone } from '@/utils/tones'

export interface ProfileFormData {
  first_name: string
  last_name: string
  primary_email: string
  primary_phone: string
  primary_phone_2: string
  nakshatra: Nakshatra | ''
  family_gotra: string
  secondary_first_name: string
  secondary_last_name: string
  secondary_email: string
  secondary_phone: string
  secondary_nakshatra: Nakshatra | ''
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  zip: string
  country: string
  business_name: string
  business_ein: string
}

export interface ProfileViewProps {
  member: Member
  formData: ProfileFormData
  nakshatras: readonly Nakshatra[]
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onSubmit: (e: React.FormEvent) => void
  saving: boolean
  message: { type: 'success' | 'error'; text: string } | null
}

export function ProfileView({
  member,
  formData,
  nakshatras,
  onChange,
  onSubmit,
  saving,
  message,
}: ProfileViewProps) {
  const isPersonal = member.member_class === 'Personal'

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <PageHeader
        eyebrow="Your account"
        title="Profile"
        description="Keep your contact details current so the temple office can reach you."
        actions={
          <Button type="submit" icon={SaveIcon} loading={saving}>
            Save changes
          </Button>
        }
      />

      {message && (
        <Alert
          tone={message.type === 'success' ? 'success' : 'danger'}
          title={message.type === 'success' ? 'Saved' : "That didn't save"}
        >
          {message.text}
        </Alert>
      )}

      {/* Membership identity — read-only */}
      <Card tone="sunk" spine="kumkum" className="pl-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <IconTile icon={UserIcon} tone="kumkum" size="md" shape="arch" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">
                Membership number
              </p>
              <p className="tnum mt-0.5 font-serif text-[24px] leading-none text-ink">
                {member.membership_id}
              </p>
            </div>
          </div>
          <p className="text-[13.5px] text-ink-2">
            {member.current_level} · {member.member_class}
            <br />
            <span className="text-ink-3">
              Contact the office to change your membership level.
            </span>
          </p>
        </div>
      </Card>

      {isPersonal ? (
        <Section icon={UserIcon} tone="saffron" title="Primary member">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First name" required>
              {({ id }) => (
                <Input id={id} name="first_name" value={formData.first_name} onChange={onChange} />
              )}
            </Field>
            <Field label="Last name" required>
              {({ id }) => (
                <Input id={id} name="last_name" value={formData.last_name} onChange={onChange} />
              )}
            </Field>
            <Field label="Nakshatra" hint="Used for sankalpam during pujas.">
              {({ id }) => (
                <Select id={id} name="nakshatra" value={formData.nakshatra} onChange={onChange}>
                  <option value="">Not specified</option>
                  {nakshatras.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Family gotra">
              {({ id }) => (
                <Input
                  id={id}
                  name="family_gotra"
                  value={formData.family_gotra}
                  onChange={onChange}
                />
              )}
            </Field>
          </div>
        </Section>
      ) : (
        <Section icon={BuildingIcon} tone="kumkum" title="Business information">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Business name" required>
              {({ id }) => (
                <Input
                  id={id}
                  name="business_name"
                  value={formData.business_name}
                  onChange={onChange}
                />
              )}
            </Field>
            <Field label="EIN">
              {({ id }) => (
                <Input
                  id={id}
                  name="business_ein"
                  className="tnum"
                  value={formData.business_ein}
                  onChange={onChange}
                />
              )}
            </Field>
          </div>
        </Section>
      )}

      <Section icon={MailIcon} tone="tulsi" title="Contact">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email address" required className="sm:col-span-2">
            {({ id }) => (
              <Input
                id={id}
                name="primary_email"
                type="email"
                autoComplete="email"
                value={formData.primary_email}
                onChange={onChange}
              />
            )}
          </Field>
          <Field label="Phone">
            {({ id }) => (
              <Input
                id={id}
                name="primary_phone"
                type="tel"
                className="tnum"
                value={formData.primary_phone}
                onChange={onChange}
              />
            )}
          </Field>
          <Field label="Alternate phone">
            {({ id }) => (
              <Input
                id={id}
                name="primary_phone_2"
                type="tel"
                className="tnum"
                value={formData.primary_phone_2}
                onChange={onChange}
              />
            )}
          </Field>
        </div>
      </Section>

      {isPersonal && (
        <Section icon={UsersIcon} tone="lotus" title="Spouse or partner">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First name">
              {({ id }) => (
                <Input
                  id={id}
                  name="secondary_first_name"
                  value={formData.secondary_first_name}
                  onChange={onChange}
                />
              )}
            </Field>
            <Field label="Last name">
              {({ id }) => (
                <Input
                  id={id}
                  name="secondary_last_name"
                  value={formData.secondary_last_name}
                  onChange={onChange}
                />
              )}
            </Field>
            <Field label="Email address">
              {({ id }) => (
                <Input
                  id={id}
                  name="secondary_email"
                  type="email"
                  value={formData.secondary_email}
                  onChange={onChange}
                />
              )}
            </Field>
            <Field label="Phone">
              {({ id }) => (
                <Input
                  id={id}
                  name="secondary_phone"
                  type="tel"
                  className="tnum"
                  value={formData.secondary_phone}
                  onChange={onChange}
                />
              )}
            </Field>
            <Field label="Nakshatra">
              {({ id }) => (
                <Select
                  id={id}
                  name="secondary_nakshatra"
                  value={formData.secondary_nakshatra}
                  onChange={onChange}
                >
                  <option value="">Not specified</option>
                  {nakshatras.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        </Section>
      )}

      <Section icon={HomeIcon} tone="sandal" title="Mailing address">
        <p className="-mt-1 mb-4 text-[13.5px] text-ink-3">
          This address appears on your donation receipts for tax purposes.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Address line 1" className="sm:col-span-2">
            {({ id }) => (
              <Input
                id={id}
                name="address_line_1"
                autoComplete="address-line1"
                value={formData.address_line_1}
                onChange={onChange}
              />
            )}
          </Field>
          <Field label="Address line 2" className="sm:col-span-2">
            {({ id }) => (
              <Input
                id={id}
                name="address_line_2"
                autoComplete="address-line2"
                value={formData.address_line_2}
                onChange={onChange}
              />
            )}
          </Field>
          <Field label="City">
            {({ id }) => (
              <Input
                id={id}
                name="city"
                autoComplete="address-level2"
                value={formData.city}
                onChange={onChange}
              />
            )}
          </Field>
          <Field label="State">
            {({ id }) => (
              <Input
                id={id}
                name="state"
                autoComplete="address-level1"
                value={formData.state}
                onChange={onChange}
              />
            )}
          </Field>
          <Field label="ZIP code">
            {({ id }) => (
              <Input
                id={id}
                name="zip"
                className="tnum"
                autoComplete="postal-code"
                value={formData.zip}
                onChange={onChange}
              />
            )}
          </Field>
          <Field label="Country">
            {({ id }) => (
              <Input
                id={id}
                name="country"
                autoComplete="country-name"
                value={formData.country}
                onChange={onChange}
              />
            )}
          </Field>
        </div>
      </Section>

      {isPersonal && (
        <Card tone="sunk" className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[14.5px] text-ink-2">
            Children and other household members are managed separately.
          </p>
          <AppLink to="/member/family">
            <Button type="button" variant="secondary" icon={UsersIcon}>
              Manage family
            </Button>
          </AppLink>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" icon={SaveIcon} loading={saving}>
          Save changes
        </Button>
      </div>
    </form>
  )
}

function Section({
  icon,
  tone,
  title,
  children,
}: {
  icon: typeof UserIcon
  tone: Tone
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <div className="mb-5 flex items-center gap-3">
        <IconTile icon={icon} tone={tone} size="md" shape="arch" />
        <CardHeader title={title} className="mb-0" />
      </div>
      {children}
    </Card>
  )
}
