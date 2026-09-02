'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { createClient } from '@/lib/supabase/client'
import { formatPhoneNumber } from '@/lib/utils/formatters'
import { AdminFormView, FormSection } from '@/components/admin/AdminFormView'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Alert'
import { WalletIcon, SettingsIcon, MailIcon } from 'lucide-react'

interface ZelleSettingsData {
  enabled: boolean
  email: string
  phone: string
  autoConfirmThreshold: number
  expiryHours: number
  instructions: string
}

export default function ZelleSettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [settings, setSettings] = useState<ZelleSettingsData>({
    enabled: false,
    email: '',
    phone: '',
    autoConfirmThreshold: 50,
    expiryHours: 48,
    instructions: 'Please send your Zelle payment and include the reference code in the memo field.',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    checkAccessAndLoadSettings()
  }, [])

  async function checkAccessAndLoadSettings() {
    try {
      // Check if user has Admin or Office Manager role
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      const isAdminOrManager = roles?.some(r =>
        r.role === 'Admin' || r.role === 'Office Manager'
      )

      if (!isAdminOrManager) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      setHasAccess(true)

      // Load settings
      const { data: settingsData } = await supabase
        .from('portal_settings')
        .select('setting_key, setting_value, setting_type')
        .in('setting_key', [
          'zelle_enabled',
          'zelle_email',
          'zelle_phone',
          'zelle_auto_confirm_threshold',
          'zelle_request_expiry_hours',
          'zelle_instructions',
        ])

      if (settingsData) {
        const newSettings = { ...settings }

        for (const row of settingsData) {
          const value = row.setting_type === 'boolean'
            ? row.setting_value?.enabled === true
            : row.setting_value?.value

          switch (row.setting_key) {
            case 'zelle_enabled':
              newSettings.enabled = value === true
              break
            case 'zelle_email':
              newSettings.email = value || ''
              break
            case 'zelle_phone':
              newSettings.phone = value || ''
              break
            case 'zelle_auto_confirm_threshold':
              newSettings.autoConfirmThreshold = typeof value === 'number' ? value : 50
              break
            case 'zelle_request_expiry_hours':
              newSettings.expiryHours = typeof value === 'number' ? value : 48
              break
            case 'zelle_instructions':
              newSettings.instructions = value || settings.instructions
              break
          }
        }

        setSettings(newSettings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)

    try {
      // Validate: if enabled, must have at least email or phone
      if (settings.enabled && !settings.email && !settings.phone) {
        setMessage({ type: 'error', text: 'Please provide at least a Zelle email or phone number' })
        setSaving(false)
        return
      }

      // Update all settings
      const updates = [
        {
          key: 'zelle_enabled',
          value: { enabled: settings.enabled },
        },
        {
          key: 'zelle_email',
          value: { value: settings.email },
        },
        {
          key: 'zelle_phone',
          value: { value: settings.phone },
        },
        {
          key: 'zelle_auto_confirm_threshold',
          value: { value: settings.autoConfirmThreshold },
        },
        {
          key: 'zelle_request_expiry_hours',
          value: { value: settings.expiryHours },
        },
        {
          key: 'zelle_instructions',
          value: { value: settings.instructions },
        },
      ]

      for (const update of updates) {
        const { error } = await supabase
          .from('portal_settings')
          .update({ setting_value: update.value })
          .eq('setting_key', update.key)

        if (error) {
          throw error
        }
      }

      setMessage({ type: 'success', text: 'Zelle settings saved successfully!' })
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  if (!hasAccess) {
    return (
      <ProtectedRoute requiredRoles={['Office Manager', 'Admin']}>
        <div />
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['Office Manager', 'Admin']}>
      <AdminFormView
        eyebrow="Settings"
        title="Zelle payments"
        description="Members transfer straight to the temple's bank. The office confirms each one."
        backHref="/admin/zelle"
        backLabel="Back to the queue"
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
        saving={saving}
        saveLabel="Save settings"
        loading={loading}
        error={message?.type === 'error' ? message.text : null}
        success={message?.type === 'success' ? message.text : null}
        disabled={settings.enabled && !settings.email.trim() && !settings.phone.trim()}
        disabledReason="Add a Zelle email or phone number before turning this on."
      >
        <FormSection icon={WalletIcon} tone="tulsi" title="Availability">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-line-strong text-saffron focus:ring-saffron-ring"
            />
            <span>
              <span className="block text-[15px] text-ink">Offer Zelle at checkout</span>
              <span className="block text-[13.5px] text-ink-3">
                Members see Zelle alongside card payment when donating or paying an invoice.
              </span>
            </span>
          </label>

          {settings.enabled && !settings.email.trim() && !settings.phone.trim() && (
            <div className="mt-4">
              <Alert tone="warning" title="Members cannot pay yet">
                Zelle is switched on but there is no email or phone for them to send to. Add at
                least one below.
              </Alert>
            </div>
          )}
        </FormSection>

        <FormSection
          icon={MailIcon}
          tone="kumkum"
          title="Where members send payment"
          description="At least one is required. Both are shown to the member if provided."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Zelle email">
              {({ id }) => (
                <Input
                  id={id}
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
              )}
            </Field>
            <Field label="Zelle phone">
              {({ id }) => (
                <Input
                  id={id}
                  type="tel"
                  className="tnum"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
              )}
            </Field>
          </div>
        </FormSection>

        <FormSection icon={SettingsIcon} tone="sandal" title="How requests behave">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Auto-confirm under"
              hint="Transfers below this amount are confirmed without the office checking. Set 0 to always check."
            >
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  step="1"
                  className="tnum"
                  value={settings.autoConfirmThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, autoConfirmThreshold: Number(e.target.value) })
                  }
                />
              )}
            </Field>
            <Field
              label="Reference expires after (hours)"
              hint="How long a member has to send the transfer before the reference lapses."
            >
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  step="1"
                  className="tnum"
                  value={settings.expiryHours}
                  onChange={(e) =>
                    setSettings({ ...settings, expiryHours: Number(e.target.value) })
                  }
                />
              )}
            </Field>
            <Field
              label="Instructions for members"
              className="sm:col-span-2"
              hint="Shown with the reference code. Say clearly that the code must go in the memo."
            >
              {({ id }) => (
                <Textarea
                  id={id}
                  rows={3}
                  value={settings.instructions}
                  onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
                />
              )}
            </Field>
          </div>
        </FormSection>
      </AdminFormView>
    </ProtectedRoute>
  )
}
