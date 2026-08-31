'use client'

import { useState } from 'react'

interface ZelleConfirmationFormProps {
  referenceCode: string
  onConfirm: (zelleReference?: string) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function ZelleConfirmationForm({
  referenceCode,
  onConfirm,
  onCancel,
  loading = false,
}: ZelleConfirmationFormProps) {
  const [zelleReference, setZelleReference] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmed) return

    await onConfirm(zelleReference || undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Optional Zelle Reference */}
      <div>
        <label
          htmlFor="zelleReference"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Zelle Confirmation Number (optional)
        </label>
        <input
          type="text"
          id="zelleReference"
          value={zelleReference}
          onChange={(e) => setZelleReference(e.target.value)}
          placeholder="Enter your bank's Zelle confirmation #"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          This helps us verify your payment faster
        </p>
      </div>

      {/* Confirmation Checkbox */}
      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <input
          type="checkbox"
          id="confirmSent"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
        />
        <label htmlFor="confirmSent" className="flex-1">
          <span className="block text-sm font-medium text-green-800">
            I confirm that I have sent the Zelle payment
          </span>
          <span className="block text-xs text-green-700 mt-1">
            Reference code <strong>{referenceCode}</strong> was included in the Zelle memo
          </span>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!confirmed || loading}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            "I've Sent the Payment"
          )}
        </button>
      </div>
    </form>
  )
}
