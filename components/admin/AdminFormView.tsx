'use client'

/**
 * The office console's create/edit form archetype.
 *
 * 11 admin routes are the same shape: a titled header with Cancel/Save, an
 * error or success alert, one or more grouped field sections, and a sticky
 * save bar. They render this and supply their fields as children.
 *
 * Presentation only. Every page keeps its own form state and mutations.
 *
 * Exemplar: design-kit/pages/admin/AdminMemberForm.tsx
 */

import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { SaveIcon } from 'lucide-react'
import { AppLink } from '@/components/nav/Nav'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Tone } from '@/utils/tones'

export interface AdminFormViewProps {
  eyebrow?: string
  title: string
  description?: string
  /** Where Cancel goes back to. */
  backHref: string
  backLabel?: string
  onSubmit: (e: React.FormEvent) => void
  saving: boolean
  saveLabel?: string
  /** Blocks the save button; explain why in `disabledReason`. */
  disabled?: boolean
  disabledReason?: string
  error?: string | null
  success?: string | null
  /** Shows skeletons instead of the form. */
  loading?: boolean
  children: React.ReactNode
}

export function AdminFormView({
  eyebrow,
  title,
  description,
  backHref,
  backLabel = 'Cancel',
  onSubmit,
  saving,
  saveLabel = 'Save',
  disabled = false,
  disabledReason,
  error,
  success,
  loading = false,
  children,
}: AdminFormViewProps) {
  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Loading…</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap gap-2">
            <AppLink to={backHref}>
              <Button type="button" variant="secondary">
                {backLabel}
              </Button>
            </AppLink>
            <Button type="submit" icon={SaveIcon} loading={saving} disabled={disabled}>
              {saveLabel}
            </Button>
          </div>
        }
      />

      {error && (
        <Alert tone="danger" title="That didn't save">
          {error}
        </Alert>
      )}
      {success && (
        <Alert tone="success" title="Saved">
          {success}
        </Alert>
      )}

      {children}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
        {disabled && disabledReason && (
          <p className="mr-auto text-[13.5px] text-ink-3">{disabledReason}</p>
        )}
        <AppLink to={backHref}>
          <Button type="button" variant="secondary">
            {backLabel}
          </Button>
        </AppLink>
        <Button type="submit" size="lg" icon={SaveIcon} loading={saving} disabled={disabled}>
          {saveLabel}
        </Button>
      </div>
    </form>
  )
}

/**
 * A titled group of fields inside a form. Mirrors the section pattern the
 * member profile form uses, so both halves of the portal group fields the
 * same way.
 */
export function FormSection({
  icon,
  tone = 'saffron',
  title,
  description,
  children,
}: {
  icon?: LucideIcon
  tone?: Tone
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <div className="mb-5 flex items-center gap-3">
        {icon && <IconTile icon={icon} tone={tone} size="md" shape="arch" />}
        <CardHeader title={title} description={description} className="mb-0" />
      </div>
      {children}
    </Card>
  )
}
