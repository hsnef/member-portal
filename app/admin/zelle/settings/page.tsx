'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { formatPhoneNumber } from '@/lib/utils/formatters'

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

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['Office Manager', 'Admin']}>
        <AdminLayout>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading settings...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  if (!hasAccess) {
    return (
      <ProtectedRoute requiredRoles={['Office Manager', 'Admin']}>
        <AdminLayout>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              Only Admin and Office Manager can configure Zelle settings.
            </p>
            <button
              onClick={() => router.push('/admin/zelle')}
              className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover"
            >
              Back to Zelle Payments
            </button>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6 max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Zelle Settings</h1>
              <p className="mt-1 text-sm text-gray-600">
                Configure Zelle payment options for the portal
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/zelle')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Zelle Payments
            </button>
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

          {/* Main Settings Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Enable/Disable Toggle */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Enable Zelle Payments</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    When enabled, members can pay via Zelle for donations, memberships, and services.
                  </p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-saffron-ring focus:ring-offset-2 ${
                    settings.enabled ? 'bg-saffron' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Zelle Account Details */}
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Receiving Account</h3>
              <p className="text-sm text-gray-500 mb-4">
                Enter the email and/or phone number registered with Zelle to receive payments.
                At least one is required when Zelle is enabled.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zelle Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="temple@example.org"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zelle Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Payment Confirmation Settings */}
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Confirmation</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto-Confirm Threshold ($)
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Payments at or below this amount will be automatically confirmed when the member marks them as sent.
                    Larger payments require staff confirmation.
                  </p>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={settings.autoConfirmThreshold}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      autoConfirmThreshold: parseInt(e.target.value) || 0
                    }))}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                  />
                  <span className="ml-2 text-sm text-gray-500">USD</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Request Expiry (Hours)
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    How long a Zelle payment request remains valid before expiring.
                  </p>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.expiryHours}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      expiryHours: parseInt(e.target.value) || 48
                    }))}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                  />
                  <span className="ml-2 text-sm text-gray-500">hours</span>
                </div>
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Instructions</h3>
              <p className="text-sm text-gray-500 mb-2">
                Custom instructions shown to members when paying via Zelle.
              </p>
              <textarea
                rows={3}
                value={settings.instructions}
                onChange={(e) => setSettings(prev => ({ ...prev, instructions: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                placeholder="Enter instructions for members..."
              />
            </div>

            {/* Save Button */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => router.push('/admin/zelle')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">How Zelle Payments Work</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>1. Member initiates payment:</strong> Member chooses &quot;Pay with Zelle&quot; and receives a unique reference code.
              </p>
              <p>
                <strong>2. Member sends Zelle:</strong> Member sends payment from their bank app with the reference code in the memo.
              </p>
              <p>
                <strong>3. Member confirms:</strong> Member marks &quot;I&apos;ve sent the payment&quot; on the portal.
              </p>
              <p>
                <strong>4. Staff verifies:</strong> For payments above the threshold, staff verifies receipt in Zelle and confirms on the portal.
              </p>
              <p className="mt-3 pt-3 border-t border-blue-200">
                <strong>Tip:</strong> Set the auto-confirm threshold to $0 if you want to manually verify all Zelle payments.
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
