'use client'

/**
 * Zelle settings (Office Manager, Admin): on/off, where members send money,
 * the QR code from the temple's banking app, reminder and expiry days. Saved
 * through /api/zelle/settings, which validates them on the server.
 * Spec: docs/architecture/payments.md, "What an Admin sets".
 */

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminFormView, FormSection } from '@/components/admin/AdminFormView'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { ClockIcon, LandmarkIcon, QrCodeIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_ZELLE_SETTINGS, validateZelleSettings, type ZelleSettings } from '@/lib/zelle'

const qrUrl = (path: string) =>
  path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portal-assets/${path}` : ''

function ZelleSettingsForm() {
  const supabase = createClient()
  const [s, setS] = useState<ZelleSettings>(DEFAULT_ZELLE_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/zelle/settings?all=1')
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Could not load the settings')
        setS(d.settings)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const set = <K extends keyof ZelleSettings>(k: K, v: ZelleSettings[K]) => {
    setSuccess(null)
    setS((prev) => ({ ...prev, [k]: v }))
  }

  const upload = async (file: File) => {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 2_000_000) {
      setError('Choose a PNG, JPEG or WebP image under 2 MB.')
      return
    }
    setUploading(true)
    setError(null)
    const path = `zelle/qr-${Date.now()}.${file.type.split('/')[1]}`
    const { error: upErr } = await supabase.storage.from('portal-assets').upload(path, file, { upsert: false })
    setUploading(false)
    if (upErr) setError(`Could not upload the image: ${upErr.message}`)
    else set('qrImagePath', path)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const problems = validateZelleSettings(s)
    if (problems.length) {
      setError(problems.join(' '))
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/zelle/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: s }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not save')
      setS(d.settings)
      setSuccess(d.settings.enabled ? 'Saved. Zelle is offered at checkout.' : 'Saved. Zelle is switched off.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminFormView
      eyebrow="Zelle"
      title="Zelle settings"
      description="Members choose Zelle at checkout and send the money from their own bank. The office confirms it in the Zelle queue."
      backHref="/admin/zelle"
      backLabel="Zelle queue"
      onSubmit={save}
      saving={saving}
      saveLabel="Save settings"
      loading={loading}
      error={error}
      success={success}
    >
      <FormSection icon={LandmarkIcon} tone="tulsi" title="Where members send money">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex items-start gap-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={s.enabled}
              onChange={(e) => set('enabled', e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-line-strong text-saffron focus:ring-saffron-ring"
            />
            <span>
              <span className="block text-[15px] font-semibold text-ink">Offer Zelle at checkout</span>
              <span className="block text-[13.5px] text-ink-3">Needs a Zelle email or phone below.</span>
            </span>
          </label>
          <Field label="Zelle email" hint="The address the temple's Zelle account is registered to.">
            {({ id }) => <Input id={id} type="email" value={s.email} onChange={(e) => set('email', e.target.value)} />}
          </Field>
          <Field label="Zelle phone" hint="Or the phone number, 10 digits.">
            {({ id }) => <Input id={id} className="tnum" value={s.phone} onChange={(e) => set('phone', e.target.value)} />}
          </Field>
          <Field label="Name the bank shows" className="sm:col-span-2" hint="So members can check they are sending to the temple.">
            {({ id }) => <Input id={id} value={s.recipientName} onChange={(e) => set('recipientName', e.target.value)} />}
          </Field>
          <Field label="Extra instructions (optional)" className="sm:col-span-2">
            {({ id }) => <Textarea id={id} rows={2} value={s.instructions} onChange={(e) => set('instructions', e.target.value)} />}
          </Field>
        </div>
      </FormSection>

      <FormSection icon={QrCodeIcon} tone="saffron" title="Zelle QR code (optional)">
        <div className="flex flex-wrap items-center gap-5">
          {s.qrImagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl(s.qrImagePath)} alt="The temple's Zelle QR code" className="h-36 w-36 rounded-xl border border-line bg-white p-2" />
          ) : (
            <p className="max-w-md text-[14px] text-ink-3">
              Most banking apps can show the account&rsquo;s Zelle QR code. Save it as an image and upload it here; members
              can then scan it instead of typing the email.
            </p>
          )}
          <div className="flex gap-3">
            <label className="inline-flex">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
              <span className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-[14.5px] font-semibold text-ink hover:border-saffron-ring">
                <UploadIcon className="h-[18px] w-[18px]" aria-hidden="true" />
                {uploading ? 'Uploading…' : s.qrImagePath ? 'Replace image' : 'Upload image'}
              </span>
            </label>
            {s.qrImagePath && (
              <Button type="button" size="sm" variant="ghost" icon={Trash2Icon} onClick={() => set('qrImagePath', '')}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection icon={ClockIcon} tone="marigold" title="Reminders and expiry">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Remind after (days)" hint="One reminder to members who have not paid.">
            {({ id }) => (
              <Input id={id} type="number" min="1" max="59" className="tnum" value={s.reminderDays} onChange={(e) => set('reminderDays', Number(e.target.value))} />
            )}
          </Field>
          <Field label="Expire after (days)" hint="An unpaid request closes, and a held event place is released.">
            {({ id }) => (
              <Input id={id} type="number" min="2" max="60" className="tnum" value={s.expiryDays} onChange={(e) => set('expiryDays', Number(e.target.value))} />
            )}
          </Field>
          <p className="text-[13.5px] text-ink-3 sm:col-span-2">
            Changes apply to Zelle requests opened from now on; requests already open keep their dates. A request the
            member says they have sent never expires on its own: it waits for the office.
          </p>
        </div>
      </FormSection>
    </AdminFormView>
  )
}

export default function ZelleSettingsPage() {
  // Narrower than the admin section's default (any staff): see app/admin/layout.tsx.
  return (
    <ProtectedRoute requiredRoles={['Office Manager', 'Admin']}>
      <ZelleSettingsForm />
    </ProtectedRoute>
  )
}
