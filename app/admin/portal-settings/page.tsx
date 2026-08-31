'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  getAllSettings,
  updateSetting,
  getMembershipPricing,
  updateMembershipPricing,
  type PortalSetting,
  type MembershipPricing,
} from '@/lib/utils/portalSettings'

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
        <AdminLayout>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-orange-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading settings...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Portal Settings</h1>
            <p className="mt-2 text-gray-600">
              Configure portal-wide settings and features
            </p>
          </div>

          {/* Status Message */}
          {message && (
            <div
              className={`p-4 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {/* Settings by Category */}
          {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
            <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">
                  {categoryNames[category] || category}
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {categorySettings.map((setting) => {
                  const value =
                    setting.setting_type === 'boolean'
                      ? setting.setting_value.enabled === true
                      : setting.setting_value.value

                  return (
                    <div key={setting.id} className="px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {setting.display_name}
                          </h3>
                          {setting.description && (
                            <p className="mt-1 text-sm text-gray-600">
                              {setting.description}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            Setting key: <code className="bg-gray-100 px-1 py-0.5 rounded">{setting.setting_key}</code>
                          </p>
                        </div>

                        <div className="flex-shrink-0">
                          {setting.setting_type === 'boolean' ? (
                            // Toggle Switch for Boolean Settings
                            <button
                              onClick={() =>
                                handleToggleSetting(
                                  setting.setting_key,
                                  value,
                                  setting.setting_type
                                )
                              }
                              disabled={saving === setting.setting_key}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                                value ? 'bg-orange-600' : 'bg-gray-200'
                              } ${saving === setting.setting_key ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  value ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          ) : (
                            // Text Input for String/Number Settings
                            <div className="w-64">
                              <input
                                type={setting.setting_type === 'number' ? 'number' : 'text'}
                                value={value || ''}
                                onChange={(e) => {
                                  // Update local state immediately for UX
                                  const updatedSettings = settings.map((s) =>
                                    s.id === setting.id
                                      ? {
                                          ...s,
                                          setting_value: { value: e.target.value },
                                        }
                                      : s
                                  )
                                  setSettings(updatedSettings)
                                }}
                                onBlur={(e) => {
                                  // Save on blur
                                  if (e.target.value !== value) {
                                    handleUpdateTextSetting(
                                      setting.setting_key,
                                      e.target.value,
                                      setting.setting_type
                                    )
                                  }
                                }}
                                disabled={saving === setting.setting_key}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Current Value Display */}
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">Current value: </span>
                        {setting.setting_type === 'boolean' ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              value
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {value ? 'Enabled' : 'Disabled'}
                          </span>
                        ) : (
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {value || '(empty)'}
                          </code>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Membership Pricing Section */}
          {pricing && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Membership Pricing</h2>
              </div>

              <div className="px-6 py-6 space-y-6">
                <p className="text-sm text-gray-600">
                  Configure pricing for each membership level. The display price is shown to users on the /join page.
                </p>

                {/* Community Pricing */}
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Community Membership</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (USD)
                      </label>
                      <input
                        type="number"
                        value={pricing.community.price}
                        onChange={(e) => handlePricingChange('community', 'price', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        disabled={savingPricing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Price
                      </label>
                      <input
                        type="text"
                        value={pricing.community.displayPrice}
                        onChange={(e) => handlePricingChange('community', 'displayPrice', e.target.value)}
                        placeholder="e.g., Free"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        disabled={savingPricing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={pricing.community.description}
                        onChange={(e) => handlePricingChange('community', 'description', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        disabled={savingPricing}
                      />
                    </div>
                  </div>
                </div>

                {/* Annual Pricing */}
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Annual Membership</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (USD)
                      </label>
                      <input
                        type="number"
                        value={pricing.annual.price}
                        onChange={(e) => handlePricingChange('annual', 'price', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        disabled={savingPricing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Price
                      </label>
                      <input
                        type="text"
                        value={pricing.annual.displayPrice}
                        onChange={(e) => handlePricingChange('annual', 'displayPrice', e.target.value)}
                        placeholder="e.g., $101/year"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        disabled={savingPricing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={pricing.annual.description}
                        onChange={(e) => handlePricingChange('annual', 'description', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        disabled={savingPricing}
                      />
                    </div>
                  </div>
                </div>

                {/* Lifetime Pricing */}
                <div className="border-l-4 border-purple-500 pl-4 py-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Lifetime Membership</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (USD)
                      </label>
                      <input
                        type="number"
                        value={pricing.lifetime.price}
                        onChange={(e) => handlePricingChange('lifetime', 'price', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        disabled={savingPricing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Price
                      </label>
                      <input
                        type="text"
                        value={pricing.lifetime.displayPrice}
                        onChange={(e) => handlePricingChange('lifetime', 'displayPrice', e.target.value)}
                        placeholder="e.g., $1,008 (one-time)"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        disabled={savingPricing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={pricing.lifetime.description}
                        onChange={(e) => handlePricingChange('lifetime', 'description', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        disabled={savingPricing}
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSavePricing}
                    disabled={savingPricing}
                    className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-md font-semibold hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    {savingPricing ? 'Saving...' : 'Save Pricing Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              About Portal Settings
            </h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>Enable Traditional Login:</strong> When enabled, users can register and login with email/password in addition to Magic Link and Google OAuth. Default: OFF
              </p>
              <p>
                <strong>Require Office Approval:</strong> When enabled, member applications via /join require office review before member records are created. When disabled, applications are auto-approved and member accounts are created immediately. Default: OFF (Auto-approval ON)
              </p>
              <p>
                <strong>Membership Pricing:</strong> Configure the prices shown on the /join page for each membership level. The "Display Price" field is what users see (e.g., "$100/year" or "Free"). Changes apply immediately to the registration page.
              </p>
              <p className="mt-4 text-xs text-blue-600">
                Changes take effect immediately. Test the changes in an incognito/private browser window to see how they affect public pages.
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
