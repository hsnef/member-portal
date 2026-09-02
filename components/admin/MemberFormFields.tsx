'use client'

/**
 * The member record's fields, shared by /admin/members/new and
 * /admin/members/[id]/edit.
 *
 * Both pages use react-hook-form + zod, so this takes `register` and `errors`
 * rather than owning any state. Keeping one copy means the two forms cannot
 * drift apart — previously they were ~660 lines each, largely duplicated.
 *
 * Exemplar: design-kit/pages/admin/AdminMemberForm.tsx
 */

import React from 'react'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { BuildingIcon, HomeIcon, MailIcon, UserIcon, UsersIcon } from 'lucide-react'
import { FormSection } from '@/components/admin/AdminFormView'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { NAKSHATRAS } from '@/lib/constants/nakshatras'

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface MemberFormFieldsProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  /** Watched value, so the form can show Personal or Business fields. */
  memberClass: 'Personal' | 'Business'
}

export function MemberFormFields({ register, errors, memberClass }: MemberFormFieldsProps) {
  const isPersonal = memberClass === 'Personal'
  const err = (name: string) => (errors?.[name]?.message as string | undefined) ?? undefined

  return (
    <>
      <FormSection icon={UserIcon} tone="kumkum" title="Membership">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Member class" required>
            {({ id }) => (
              <Select id={id} {...register('member_class')}>
                <option value="Personal">Personal</option>
                <option value="Business">Business</option>
              </Select>
            )}
          </Field>
          <Field label="Level" required>
            {({ id }) => (
              <Select id={id} {...register('current_level')}>
                <option value="Community">Community</option>
                <option value="Annual">Annual</option>
                <option value="Lifetime">Lifetime</option>
              </Select>
            )}
          </Field>
          <label className="flex items-center gap-3 sm:col-span-2">
            <input
              type="checkbox"
              {...register('is_founding_member')}
              className="h-4 w-4 rounded border-line-strong text-saffron focus:ring-saffron-ring"
            />
            <span className="text-[15px] text-ink">Founding member</span>
          </label>
        </div>
      </FormSection>

      {isPersonal ? (
        <FormSection icon={UserIcon} tone="saffron" title="Primary member">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First name" required error={err('first_name')}>
              {({ id, invalid }) => (
                <Input id={id} invalid={invalid} {...register('first_name')} />
              )}
            </Field>
            <Field label="Last name" required error={err('last_name')}>
              {({ id, invalid }) => (
                <Input id={id} invalid={invalid} {...register('last_name')} />
              )}
            </Field>
            <Field label="Profile name" hint="How the family is known at the temple.">
              {({ id }) => <Input id={id} {...register('profile_name')} />}
            </Field>
            <Field label="Nakshatra">
              {({ id }) => (
                <Select id={id} {...register('nakshatra')}>
                  <option value="">Not specified</option>
                  {NAKSHATRAS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Family gotra" className="sm:col-span-2">
              {({ id }) => <Input id={id} {...register('family_gotra')} />}
            </Field>
          </div>
        </FormSection>
      ) : (
        <FormSection icon={BuildingIcon} tone="kumkum" title="Business">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Business name" required error={err('business_name')}>
              {({ id, invalid }) => (
                <Input id={id} invalid={invalid} {...register('business_name')} />
              )}
            </Field>
            <Field label="EIN">
              {({ id }) => <Input id={id} className="tnum" {...register('business_ein')} />}
            </Field>
          </div>
        </FormSection>
      )}

      <FormSection icon={MailIcon} tone="tulsi" title="Contact">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Email address"
            required
            className="sm:col-span-2"
            error={err('primary_email')}
            hint="Used for the portal invitation and all receipts."
          >
            {({ id, invalid }) => (
              <Input id={id} type="email" invalid={invalid} {...register('primary_email')} />
            )}
          </Field>
          <Field label="Phone">
            {({ id }) => (
              <Input id={id} type="tel" className="tnum" {...register('primary_phone')} />
            )}
          </Field>
          <Field label="Alternate phone">
            {({ id }) => (
              <Input id={id} type="tel" className="tnum" {...register('primary_phone_2')} />
            )}
          </Field>
        </div>
      </FormSection>

      {isPersonal && (
        <FormSection icon={UsersIcon} tone="lotus" title="Spouse or partner">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First name">
              {({ id }) => <Input id={id} {...register('secondary_first_name')} />}
            </Field>
            <Field label="Last name">
              {({ id }) => <Input id={id} {...register('secondary_last_name')} />}
            </Field>
            <Field label="Email address" error={err('secondary_email')}>
              {({ id, invalid }) => (
                <Input id={id} type="email" invalid={invalid} {...register('secondary_email')} />
              )}
            </Field>
            <Field label="Phone">
              {({ id }) => (
                <Input id={id} type="tel" className="tnum" {...register('secondary_phone')} />
              )}
            </Field>
            <Field label="Nakshatra">
              {({ id }) => (
                <Select id={id} {...register('secondary_nakshatra')}>
                  <option value="">Not specified</option>
                  {NAKSHATRAS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        </FormSection>
      )}

      <FormSection
        icon={HomeIcon}
        tone="sandal"
        title="Address"
        description="Appears on donation receipts, so it matters for the member's tax records."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Address line 1" className="sm:col-span-2">
            {({ id }) => <Input id={id} {...register('address_line_1')} />}
          </Field>
          <Field label="Address line 2" className="sm:col-span-2">
            {({ id }) => <Input id={id} {...register('address_line_2')} />}
          </Field>
          <Field label="City">{({ id }) => <Input id={id} {...register('city')} />}</Field>
          <Field label="State">{({ id }) => <Input id={id} {...register('state')} />}</Field>
          <Field label="ZIP code">
            {({ id }) => <Input id={id} className="tnum" {...register('zip')} />}
          </Field>
          <Field label="Country">{({ id }) => <Input id={id} {...register('country')} />}</Field>
          <Field
            label="Mailing address"
            className="sm:col-span-2"
            hint="Only if post should go somewhere other than the address above."
          >
            {({ id }) => <Textarea id={id} rows={2} {...register('mailing_address')} />}
          </Field>
        </div>
      </FormSection>
    </>
  )
}
