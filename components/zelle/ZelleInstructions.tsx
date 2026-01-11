'use client'

import { useState } from 'react'
import { formatAmount } from '@/lib/zelle'

interface ZelleInstructionsProps {
  zelleEmail?: string
  zellePhone?: string
  referenceCode: string
  amount: number
  purpose: string
  instructions?: string
  showCopyAll?: boolean
}

export function ZelleInstructions({
  zelleEmail,
  zellePhone,
  referenceCode,
  amount,
  purpose,
  instructions,
  showCopyAll = true,
}: ZelleInstructionsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const copyAllDetails = async () => {
    const details = [
      `Amount: ${formatAmount(amount)}`,
      zelleEmail ? `Zelle to: ${zelleEmail}` : `Zelle to: ${zellePhone}`,
      `Reference: ${referenceCode}`,
      `Purpose: ${purpose}`,
    ].join('\n')

    await copyToClipboard(details, 'all')
  }

  return (
    <div className="space-y-4">
      {/* Amount */}
      <div className="bg-[#FF9933]/10 border border-[#FF9933]/30 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
        <p className="text-3xl font-bold text-[#FF9933]">{formatAmount(amount)}</p>
        <p className="text-sm text-gray-500 mt-1">{purpose}</p>
      </div>

      {/* Zelle Recipient */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Send Zelle Payment To:
        </label>
        {zelleEmail && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-4 py-2.5 font-mono text-gray-900">
              {zelleEmail}
            </div>
            <button
              onClick={() => copyToClipboard(zelleEmail, 'email')}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700 min-w-[80px]"
            >
              {copiedField === 'email' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
        {zellePhone && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-4 py-2.5 font-mono text-gray-900">
              {zellePhone}
            </div>
            <button
              onClick={() => copyToClipboard(zellePhone, 'phone')}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700 min-w-[80px]"
            >
              {copiedField === 'phone' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Reference Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Include This Reference in Memo:
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-yellow-50 border-2 border-yellow-400 rounded-md px-4 py-3 font-mono text-lg font-bold text-gray-900 text-center">
            {referenceCode}
          </div>
          <button
            onClick={() => copyToClipboard(referenceCode, 'reference')}
            className="px-4 py-3 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700 min-w-[80px]"
          >
            {copiedField === 'reference' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded border border-yellow-200">
          This reference code helps us match your payment to your account. Please include it in the Zelle memo field.
        </p>
      </div>

      {/* Custom Instructions */}
      {instructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">{instructions}</p>
        </div>
      )}

      {/* Copy All Button */}
      {showCopyAll && (
        <button
          onClick={copyAllDetails}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
        >
          {copiedField === 'all' ? (
            <span className="text-green-600 font-medium">All Details Copied!</span>
          ) : (
            <span>Copy All Payment Details</span>
          )}
        </button>
      )}
    </div>
  )
}
