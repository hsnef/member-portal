'use client'

/**
 * Book a service — presentation only.
 *
 * app/member/bookings/new/page.tsx owns the fetches, the pricing rules, the
 * cart operations and the submit.
 *
 * Exemplar: design-kit/pages/BookingWizard.tsx
 */

import React from 'react'
import {
  CalendarPlusIcon,
  FlameIcon,
  PlusIcon,
  ShoppingBasketIcon,
  Trash2Icon,
} from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { IconTile } from '@/components/ui/IconTile'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatCurrency, formatDate } from '@/utils/format'

export interface WizardService {
  id: string
  name: string
  display_name?: string
  description?: string
  category: string
  price_member_temple?: number
  price_community_temple?: number
  price_member_external?: number
  price_community_external?: number
  duration_minutes?: number
  preparation_notes?: string
  is_temple_only: boolean
}

export interface WizardPurohit {
  id: string
  name: string
  specialties?: string
}

export interface WizardCartItem {
  id: string
  service_id: string
  service_name: string
  service_date: string
  service_time: string
  location_type: 'Temple' | 'External'
  location_address: string
  purohit_id: string
  purohit_name: string
  notes: string
  price: number
}

export interface BookingWizardViewProps {
  services: WizardService[]
  purohits: WizardPurohit[]
  cart: WizardCartItem[]
  total: number
  submitting: boolean
  error?: string | null

  selectedServiceId: string
  onServiceChange: (id: string) => void
  serviceDate: string
  onDateChange: (v: string) => void
  serviceTime: string
  onTimeChange: (v: string) => void
  locationType: 'Temple' | 'External'
  onLocationTypeChange: (v: 'Temple' | 'External') => void
  locationAddress: string
  onLocationAddressChange: (v: string) => void
  selectedPurohitId: string
  onPurohitChange: (id: string) => void
  itemNotes: string
  onItemNotesChange: (v: string) => void
  onAddToCart: () => void
  onRemoveFromCart: (id: string) => void

  requesterName: string
  onRequesterNameChange: (v: string) => void
  requesterPhone: string
  onRequesterPhoneChange: (v: string) => void
  requesterEmail: string
  onRequesterEmailChange: (v: string) => void
  additionalNotes: string
  onAdditionalNotesChange: (v: string) => void
  onSubmit: () => void

  /* --- optional slots, used by the office console's version of this wizard --- */
  eyebrow?: string
  title?: string
  description?: string
  /** Rendered above the service picker, e.g. choosing which member this is for. */
  leadingSection?: React.ReactNode
  /** Rendered below the contact card, e.g. staff-only options. */
  trailingSection?: React.ReactNode
  /** Label for the submit button. */
  submitLabel?: string
  /** Blocks submit; explain why. */
  submitDisabled?: boolean
  submitDisabledReason?: string
  /** Footnote under the submit button. */
  submitNote?: React.ReactNode
}

export function BookingWizardView(props: BookingWizardViewProps) {
  const {
    services,
    purohits,
    cart,
    total,
    submitting,
    error,
    selectedServiceId,
    onServiceChange,
    serviceDate,
    onDateChange,
    serviceTime,
    onTimeChange,
    locationType,
    onLocationTypeChange,
    locationAddress,
    onLocationAddressChange,
    selectedPurohitId,
    onPurohitChange,
    itemNotes,
    onItemNotesChange,
    onAddToCart,
    onRemoveFromCart,
    requesterName,
    onRequesterNameChange,
    requesterPhone,
    onRequesterPhoneChange,
    requesterEmail,
    onRequesterEmailChange,
    additionalNotes,
    onAdditionalNotesChange,
    onSubmit,
    eyebrow = 'Book a service',
    title = 'Request a puja or service',
    description = 'Add one or more services, then send the request. The temple office confirms and invoices you.',
    leadingSection,
    trailingSection,
    submitLabel = 'Send request',
    submitDisabled = false,
    submitDisabledReason,
    submitNote,
  } = props

  const selectedService = services.find((s) => s.id === selectedServiceId)
  const templeOnly = Boolean(selectedService?.is_temple_only)

  return (
    <div className="space-y-7">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      {error && (
        <Alert tone="danger" title="That didn't send">
          {error}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="space-y-6">
          {leadingSection}

          {/* ---- Add a service ---- */}
          <Card>
            <CardHeader
              title="Choose a service"
              description="Add as many as you need — they are requested together."
            />

            <div className="space-y-5">
              <Field label="Service" required>
                {({ id }) => (
                  <Select
                    id={id}
                    value={selectedServiceId}
                    onChange={(e) => onServiceChange(e.target.value)}
                  >
                    <option value="">Select a service…</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.display_name || s.name}
                        {s.category ? ` · ${s.category}` : ''}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              {selectedService?.description && (
                <p className="-mt-1 text-[14px] leading-relaxed text-ink-2">
                  {selectedService.description}
                </p>
              )}
              {selectedService?.preparation_notes && (
                <Alert tone="info" title="Please prepare">
                  {selectedService.preparation_notes}
                </Alert>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Date" required>
                  {({ id }) => (
                    <Input
                      id={id}
                      type="date"
                      className="tnum"
                      value={serviceDate}
                      onChange={(e) => onDateChange(e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Time" required>
                  {({ id }) => (
                    <Input
                      id={id}
                      type="time"
                      className="tnum"
                      value={serviceTime}
                      onChange={(e) => onTimeChange(e.target.value)}
                    />
                  )}
                </Field>
              </div>

              <Field
                label="Where"
                hint={templeOnly ? 'This service is performed at the temple only.' : undefined}
              >
                {({ id }) => (
                  <Select
                    id={id}
                    value={locationType}
                    disabled={templeOnly}
                    onChange={(e) => onLocationTypeChange(e.target.value as 'Temple' | 'External')}
                  >
                    <option value="Temple">At the temple</option>
                    {!templeOnly && <option value="External">At my home or another venue</option>}
                  </Select>
                )}
              </Field>

              {locationType === 'External' && (
                <Field label="Address" required>
                  {({ id }) => (
                    <Input
                      id={id}
                      value={locationAddress}
                      onChange={(e) => onLocationAddressChange(e.target.value)}
                      placeholder="Street, city, ZIP"
                    />
                  )}
                </Field>
              )}

              <Field label="Preferred purohit" hint="Optional — the office will assign one if you have no preference.">
                {({ id }) => (
                  <Select
                    id={id}
                    value={selectedPurohitId}
                    onChange={(e) => onPurohitChange(e.target.value)}
                  >
                    <option value="">No preference</option>
                    {purohits.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.specialties ? ` · ${p.specialties}` : ''}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field label="Notes for this service">
                {({ id }) => (
                  <Textarea
                    id={id}
                    rows={3}
                    value={itemNotes}
                    onChange={(e) => onItemNotesChange(e.target.value)}
                    placeholder="Anything the purohit should know — names for sankalpam, access details…"
                  />
                )}
              </Field>

              <Button
                type="button"
                icon={PlusIcon}
                fullWidth
                disabled={!selectedServiceId || !serviceDate || !serviceTime}
                onClick={onAddToCart}
              >
                Add to my request
              </Button>
            </div>
          </Card>

          {/* ---- Contact ---- */}
          <Card>
            <CardHeader
              title="Your contact details"
              description="So the office can reach you about this booking."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" required className="sm:col-span-2">
                {({ id }) => (
                  <Input
                    id={id}
                    value={requesterName}
                    onChange={(e) => onRequesterNameChange(e.target.value)}
                  />
                )}
              </Field>
              <Field label="Phone" required>
                {({ id }) => (
                  <Input
                    id={id}
                    type="tel"
                    className="tnum"
                    value={requesterPhone}
                    onChange={(e) => onRequesterPhoneChange(e.target.value)}
                  />
                )}
              </Field>
              <Field label="Email" required>
                {({ id }) => (
                  <Input
                    id={id}
                    type="email"
                    value={requesterEmail}
                    onChange={(e) => onRequesterEmailChange(e.target.value)}
                  />
                )}
              </Field>
              <Field label="Anything else?" className="sm:col-span-2">
                {({ id }) => (
                  <Textarea
                    id={id}
                    rows={3}
                    value={additionalNotes}
                    onChange={(e) => onAdditionalNotesChange(e.target.value)}
                  />
                )}
              </Field>
            </div>
          </Card>
          {trailingSection}
        </div>

        {/* ---- Request summary ---- */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <Card spine="copper" className="pl-7">
            <CardHeader title="Your request" />

            {cart.length === 0 ? (
              <EmptyState
                icon={ShoppingBasketIcon}
                title="Nothing added yet"
                description="Choose a service on the left and add it to build your request."
              />
            ) : (
              <>
                <ul className="divide-y divide-line">
                  {cart.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 py-3.5 first:pt-0">
                      <IconTile icon={FlameIcon} tone="copper" size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{item.service_name}</p>
                        <p className="tnum mt-0.5 text-[13px] text-ink-3">
                          {item.service_date ? formatDate(item.service_date) : ''}
                          {item.service_time ? ` · ${item.service_time}` : ''}
                        </p>
                        <p className="mt-0.5 text-[13px] text-ink-3">
                          {item.location_type === 'Temple' ? 'At the temple' : 'At my venue'}
                          {item.purohit_name ? ` · ${item.purohit_name}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="tnum font-semibold text-ink">
                          {formatCurrency(item.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveFromCart(item.id)}
                          aria-label={`Remove ${item.service_name}`}
                          className="rounded-lg p-1 text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2Icon className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                  <p className="font-serif text-[21px] text-ink">Total</p>
                  <p className="tnum font-serif text-[30px] leading-none text-ink">
                    {formatCurrency(total, true)}
                  </p>
                </div>
              </>
            )}

            <Button
              type="button"
              size="lg"
              fullWidth
              icon={CalendarPlusIcon}
              loading={submitting}
              disabled={
                submitDisabled ||
                cart.length === 0 ||
                !requesterName ||
                !requesterPhone ||
                !requesterEmail
              }
              className="mt-5"
              onClick={onSubmit}
            >
              {submitLabel}
            </Button>

            <p className="mt-3 text-[13px] leading-snug text-ink-3">
              {submitDisabled && submitDisabledReason
                ? submitDisabledReason
                : (submitNote ??
                  'Nothing is charged now. The office reviews your request and sends an invoice once it is approved.')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
