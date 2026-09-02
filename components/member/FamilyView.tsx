'use client'

/**
 * Household / family members — presentation only.
 *
 * app/member/family/page.tsx owns the fetch, the add/edit/delete mutations
 * and the form state.
 *
 * Exemplar: design-kit/pages/Profile.tsx (which merges profile + household)
 */

import React from 'react'
import { PencilIcon, PlusIcon, Trash2Icon, UsersIcon } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select } from '@/components/ui/Field'
import { IconTile } from '@/components/ui/IconTile'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatDate } from '@/utils/format'
import type { FamilyMember, Nakshatra } from '@/types/database'

export interface FamilyMemberForm {
  id?: string
  first_name: string
  last_name: string
  relationship: string
  date_of_birth: string
  nakshatra: Nakshatra | ''
  email: string
}

export interface FamilyViewProps {
  familyMembers: FamilyMember[]
  loading: boolean
  relationships: readonly string[]
  nakshatras: readonly Nakshatra[]
  showForm: boolean
  editingMember: FamilyMemberForm | null
  formData: FamilyMemberForm
  saving: boolean
  message: { type: 'success' | 'error'; text: string } | null
  deleteConfirmId: string | null
  onAddNew: () => void
  onEdit: (fm: FamilyMember) => void
  onCancel: () => void
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onSubmit: (e: React.FormEvent) => void
  onRequestDelete: (id: string | null) => void
  onConfirmDelete: (id: string) => void
}

export function FamilyView({
  familyMembers,
  loading,
  relationships,
  nakshatras,
  showForm,
  editingMember,
  formData,
  saving,
  message,
  deleteConfirmId,
  onAddNew,
  onEdit,
  onCancel,
  onChange,
  onSubmit,
  onRequestDelete,
  onConfirmDelete,
}: FamilyViewProps) {
  const pendingDelete = familyMembers.find((f) => f.id === deleteConfirmId) ?? null

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Your account"
        title="Family & household"
        description="Everyone on your membership. They appear on your pass and can be included in sankalpam."
        actions={
          <Button icon={PlusIcon} onClick={onAddNew}>
            Add member
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

      {loading ? (
        <Card>
          <p className="text-[15px] text-ink-2">Loading your household…</p>
        </Card>
      ) : familyMembers.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No family members yet"
          description="Add your children or other household members so they are covered by your membership and appear on your pass."
          action={
            <Button icon={PlusIcon} onClick={onAddNew}>
              Add the first member
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {familyMembers.map((fm) => (
            <Card as="li" key={fm.id} className="flex items-start gap-4">
              <IconTile icon={UsersIcon} tone="lotus" size="md" shape="arch" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">
                  {fm.first_name} {fm.last_name}
                </p>
                <p className="mt-0.5 text-[13.5px] text-ink-3">{fm.relationship}</p>
                <dl className="mt-2 space-y-0.5 text-[13.5px] text-ink-2">
                  {fm.date_of_birth && (
                    <div className="flex gap-2">
                      <dt className="text-ink-3">Born</dt>
                      <dd className="tnum">{formatDate(fm.date_of_birth)}</dd>
                    </div>
                  )}
                  {fm.nakshatra && (
                    <div className="flex gap-2">
                      <dt className="text-ink-3">Nakshatra</dt>
                      <dd>{fm.nakshatra}</dd>
                    </div>
                  )}
                  {fm.email && (
                    <div className="flex min-w-0 gap-2">
                      <dt className="shrink-0 text-ink-3">Email</dt>
                      <dd className="truncate">{fm.email}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={PencilIcon}
                  onClick={() => onEdit(fm)}
                  aria-label={`Edit ${fm.first_name}`}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Trash2Icon}
                  onClick={() => onRequestDelete(fm.id)}
                  aria-label={`Remove ${fm.first_name}`}
                >
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      )}

      {/* Add / edit */}
      <Modal
        open={showForm}
        onClose={onCancel}
        variant="panel"
        title={editingMember ? 'Edit family member' : 'Add a family member'}
      >
        <form onSubmit={onSubmit} className="space-y-5">
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
          </div>

          <Field label="Relationship" required>
            {({ id }) => (
              <Select
                id={id}
                name="relationship"
                value={formData.relationship}
                onChange={onChange}
              >
                {relationships.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Date of birth">
            {({ id }) => (
              <Input
                id={id}
                name="date_of_birth"
                type="date"
                className="tnum"
                value={formData.date_of_birth}
                onChange={onChange}
              />
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

          <Field label="Email address" hint="Optional — for older children with their own email.">
            {({ id }) => (
              <Input
                id={id}
                name="email"
                type="email"
                value={formData.email}
                onChange={onChange}
              />
            )}
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingMember ? 'Save changes' : 'Add member'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => onRequestDelete(null)}
        title="Remove this family member?"
      >
        <p className="text-[15px] leading-relaxed text-ink-2">
          <span className="font-semibold text-ink">
            {pendingDelete?.first_name} {pendingDelete?.last_name}
          </span>{' '}
          will be removed from your membership and will no longer appear on your pass. You can add
          them again later.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => onRequestDelete(null)}>
            Keep them
          </Button>
          <Button
            variant="danger"
            loading={saving}
            onClick={() => pendingDelete && onConfirmDelete(pendingDelete.id)}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  )
}
