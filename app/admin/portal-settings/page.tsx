'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  getAllSettings,
  updateSetting,
  getMembershipPricing,
  updateMembershipPricing,
  type PortalSetting,
  type MembershipPricing,
} from '@/lib/utils/portalSettings'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { IconTile } from '@/components/ui/IconTile'
import { Skeleton } from '@/components/ui/Skeleton'
import { SettingsIcon, CreditCardIcon, SaveIcon } from 'lucide-react'

export default function PortalSettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<PortalSetting[]>([])
  const [pricing, setPricing] = useState<MembershipPricing | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [savingPricing, setSavingPricing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadSettings()
    loadPricing()
  }, [])

  async function loadSettings() {
    try {
      setLoading(true)
      const data = await getAllSettings()
      setSettings(data)
    } catch (error) {
      console.error('Error loading settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  async function loadPricing() {
    try {
      const membershipPricing = await getMembershipPricing()
      setPricing(membershipPricing)
    } catch (error) {
      console.error('Error loading pricing:', error)
    }
  }

  async function handleToggleSetting(settingKey: string, currentValue: any, settingType: string) {
    try {
      setSaving(settingKey)
      setMessage(null)

      // For boolean settings, toggle the value
      const newValue = settingType === 'boolean' ? !currentValue : currentValue

      const success = await updateSetting(settingKey, newValue, settingType as any)

      if (success) {
        setMessage({ type: 'success', text: 'Setting updated successfully' })
        await loadSettings() // Reload to show updated value
      } else {
        setMessage({ type: 'error', text: 'Failed to update setting' })
      }
    } catch (error) {
      console.error('Error updating setting:', error)
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setSaving(null)
    }
  }

  async function handleUpdateTextSetting(
    settingKey: string,
    newValue: string,
    settingType: string
  ) {
    try {
      setSaving(settingKey)
      setMessage(null)

      const success = await updateSetting(settingKey, newValue, settingType as any)

      if (success) {
        setMessage({ type: 'success', text: 'Setting updated successfully' })
        await loadSettings()
      } else {
        setMessage({ type: 'error', text: 'Failed to update setting' })
      }
    } catch (error) {
      console.error('Error updating setting:', error)
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setSaving(null)
    }
  }

  async function handleSavePricing() {
    if (!pricing) return

    try {
      setSavingPricing(true)
      setMessage(null)

      const success = await updateMembershipPricing(pricing)

      if (success) {
        setMessage({ type: 'success', text: 'Membership pricing updated successfully!' })
        await loadPricing()
      } else {
        setMessage({ type: 'error', text: 'Failed to update membership pricing' })
      }
    } catch (error) {
      console.error('Error updating pricing:', error)
      setMessage({ type: 'error', text: 'An error occurred while saving pricing' })
    } finally {
      setSavingPricing(false)
    }
  }

  function handlePricingChange(
    level: 'community' | 'annual' | 'lifetime',
    field: 'price' | 'displayPrice' | 'description',
    value: string | number
  ) {
    if (!pricing) return

    setPricing({
      ...pricing,
      [level]: {
        ...pricing[level],
        [field]: field === 'price' ? Number(value) : value,
      },
    })
  }

  // Group settings by category
  const settingsByCategory = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, PortalSetting[]>)

  const categoryNames: Record<string, string> = {
    authentication: 'Authentication',
    registration: 'Membership Registration',
    general: 'General Settings',
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['Office Manager', 'Admin']}>
        <>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading settings...</p>
            </div>
          </div>
        </>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['Office Manager', 'Admin']}>
        <div className="space-y-6" role="status" aria-live="polite">
          <span className="sr-only">Loading settings...</span>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </ProtectedRoute>
    )
  }

  /* Group by the category the settings table already carries, so a new
     setting lands in the right place without a code change here. */
  const grouped = settings.reduce<Record<string, PortalSetting[]>>((acc, setting) => {
    const key = setting.category || 'General'
    ;(acc[key] ||= []).push(setting)
    return acc
  }, {})

  return (
    <ProtectedRoute requiredRoles={['Office Manager', 'Admin']}>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Settings"
          title="Portal settings"
          description="How the member-facing portal behaves. Changes take effect immediately."
        />

        {message && (
          <Alert
            tone={message.type === 'success' ? 'success' : 'danger'}
            title={message.type === 'success' ? 'Saved' : "That didn't save"}
          >
            {message.text}
          </Alert>
        )}

        {Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <div className="mb-5 flex items-center gap-3">
              <IconTile icon={SettingsIcon} tone="sandal" size="md" shape="arch" />
              <CardHeader title={category} className="mb-0" />
            </div>

            <ul className="divide-y divide-line">
              {items.map((setting) => {
                const isBoolean = setting.setting_type === 'boolean'
                const boolValue = setting.setting_value?.enabled === true
                const textValue = String(setting.setting_value?.value ?? '')
                const busy = saving === setting.setting_key

                return (
                  <li key={setting.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{setting.display_name}</p>
                        {setting.description && (
                          <p className="mt-1 text-[14px] leading-relaxed text-ink-2">
                            {setting.description}
                          </p>
                        )}
                      </div>

                      {isBoolean ? (
                        <label className="flex shrink-0 items-center gap-3">
                          <input
                            type="checkbox"
                            checked={boolValue}
                            disabled={busy}
                            onChange={() =>
                              handleToggleSetting(
                                setting.setting_key,
                                setting.setting_value,
                                setting.setting_type
                              )
                            }
                            className="h-4 w-4 rounded border-line-strong text-saffron focus:ring-saffron-ring"
                          />
                          <span className="text-[14px] text-ink-2">
                            {busy ? 'Saving...' : boolValue ? 'On' : 'Off'}
                          </span>
                        </label>
                      ) : null}
                    </div>

                    {!isBoolean && (
                      <div className="mt-3 flex flex-wrap items-end gap-3">
                        <Field label={setting.display_name} className="min-w-[220px] flex-1">
                          {({ id }) => (
                            <Input
                              id={id}
                              value={textValue}
                              onChange={(e) =>
                                setSettings((prev) =>
                                  prev.map((x) =>
                                    x.id === setting.id
                                      ? { ...x, setting_value: { value: e.target.value } }
                                      : x
                                  )
                                )
                              }
                            />
                          )}
                        </Field>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={SaveIcon}
                          loading={busy}
                          className="mb-[2px]"
                          onClick={() =>
                            handleUpdateTextSetting(
                              setting.setting_key,
                              textValue,
                              setting.setting_type
                            )
                          }
                        >
                          Save
                        </Button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        ))}

        {/* ---- Membership pricing ---- */}
        {pricing && (
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <IconTile icon={CreditCardIcon} tone="tulsi" size="md" shape="arch" />
              <CardHeader
                title="Membership pricing"
                description="Shown on the join page and used when a member renews or upgrades."
                className="mb-0"
              />
            </div>

            <div className="space-y-6">
              {(['community', 'annual', 'lifetime'] as const).map((level) => (
                <div key={level} className="rounded-2xl border border-line bg-surface-sunk p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">
                    {level}
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-3">
                    <Field label="Price">
                      {({ id }) => (
                        <Input
                          id={id}
                          type="number"
                          step="0.01"
                          className="tnum"
                          value={pricing[level].price}
                          onChange={(e) =>
                            setPricing({
                              ...pricing,
                              [level]: { ...pricing[level], price: Number(e.target.value) },
                            })
                          }
                        />
                      )}
                    </Field>
                    <Field label="Display price" hint="What members read, e.g. $100/year.">
                      {({ id }) => (
                        <Input
                          id={id}
                          value={pricing[level].displayPrice}
                          onChange={(e) =>
                            setPricing({
                              ...pricing,
                              [level]: { ...pricing[level], displayPrice: e.target.value },
                            })
                          }
                        />
                      )}
                    </Field>
                    <Field label="Description">
                      {({ id }) => (
                        <Input
                          id={id}
                          value={pricing[level].description}
                          onChange={(e) =>
                            setPricing({
                              ...pricing,
                              [level]: { ...pricing[level], description: e.target.value },
                            })
                          }
                        />
                      )}
                    </Field>
                  </div>
                </div>
              ))}

              <div className="flex justify-end border-t border-line pt-4">
                <Button
                  icon={SaveIcon}
                  loading={savingPricing}
                  onClick={handleSavePricing}
                >
                  Save pricing
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}
