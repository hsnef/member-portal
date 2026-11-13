'use client'

/**
 * Portal Settings: the office alert list. Everyone on it is emailed when
 * something needs the office (a Zelle payment sent, a registration or booking
 * awaiting approval). Admins and Office Managers keep it up to date,
 * themselves included. Spec: docs/architecture/payments.md, "Office alerts".
 */

import { useEffect, useState } from 'react'
import { BellIcon, PlusIcon, SaveIcon, XIcon } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { createClient } from '@/lib/supabase/client'
import { isEmailAddress, normaliseAlertEmails, OFFICE_ALERTS_KEY } from '@/lib/notify/alertList'

export function OfficeAlertsCard() {
  const supabase = createClient()
  const [emails, setEmails] = useState<string[]>([])
  const [saved, setSaved] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)

  useEffect(() => {
    supabase
      .from('portal_settings')
      .select('setting_value')
      .eq('setting_key', OFFICE_ALERTS_KEY)
      .maybeSingle()
      .then(({ data }) => {
        const list = normaliseAlertEmails((data?.setting_value as { value?: unknown } | null)?.value)
        setEmails(list)
        setSaved(list)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const add = () => {
    setMessage(null)
    if (!isEmailAddress(draft)) {
      setMessage({ tone: 'danger', text: 'That does not look like an email address.' })
      return
    }
    setEmails(normaliseAlertEmails([...emails, draft]))
    setDraft('')
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)
    const list = normaliseAlertEmails(emails)
    const { error } = await supabase.from('portal_settings').update({ setting_value: { value: list } }).eq('setting_key', OFFICE_ALERTS_KEY)
    setSaving(false)
    if (error) setMessage({ tone: 'danger', text: `Could not save: ${error.message}` })
    else {
      setSaved(list)
      setMessage({ tone: 'success', text: list.length ? `Saved. ${list.length} ${list.length === 1 ? 'address gets' : 'addresses get'} office alerts.` : 'Saved. Nobody gets office alerts now.' })
    }
  }

  const changed = emails.join(',') !== saved.join(',')

  return (
    <Card>
      <div className="mb-5 flex items-center gap-3">
        <IconTile icon={BellIcon} tone="marigold" size="md" shape="arch" />
        <CardHeader
          title="Office alerts"
          description="Everyone here is emailed when something needs the office: a member says they sent a Zelle payment, or a registration or booking is waiting for approval."
          className="mb-0"
        />
      </div>

      {emails.length === 0 ? (
        <Alert tone="warning" title="Nobody gets office alerts">
          Add at least one address, or Zelle payments and approvals will wait unnoticed.
        </Alert>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {emails.map((e) => (
            <li key={e} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-[15px] text-ink">{e}</span>
              <Button type="button" size="sm" variant="ghost" icon={XIcon} onClick={() => setEmails(emails.filter((x) => x !== e))}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Field label="Add an address" className="min-w-[240px] flex-1">
          {({ id }) => (
            <Input
              id={id}
              type="email"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  add()
                }
              }}
            />
          )}
        </Field>
        <Button type="button" variant="secondary" icon={PlusIcon} className="mb-[2px]" onClick={add}>
          Add
        </Button>
        <Button type="button" icon={SaveIcon} loading={saving} disabled={!changed} className="mb-[2px]" onClick={save}>
          Save list
        </Button>
      </div>

      {message && (
        <div className="mt-4">
          <Alert tone={message.tone} title={message.tone === 'success' ? 'Saved' : "That didn't work"}>
            {message.text}
          </Alert>
        </div>
      )}
    </Card>
  )
}
