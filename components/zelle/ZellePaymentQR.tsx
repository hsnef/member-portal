'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { formatAmount } from '@/lib/zelle'

interface ZellePaymentQRProps {
  referenceCode: string
  amount: number
  purpose?: string
  showAmount?: boolean
  size?: number
  baseUrl?: string
}

export function ZellePaymentQR({
  referenceCode,
  amount,
  purpose,
  showAmount = true,
  size = 250,
  baseUrl,
}: ZellePaymentQRProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const generateQR = async () => {
      try {
        const base = baseUrl || window.location.origin
        const paymentUrl = `${base}/pay/${referenceCode}`

        const dataURL = await QRCode.toDataURL(paymentUrl, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        setQrCodeDataURL(dataURL)
      } catch (err) {
        console.error('Error generating QR code:', err)
      } finally {
        setLoading(false)
      }
    }

    generateQR()
  }, [referenceCode, size, baseUrl])

  const downloadQR = () => {
    if (qrCodeDataURL) {
      const link = document.createElement('a')
      link.download = `zelle-payment-${referenceCode}.png`
      link.href = qrCodeDataURL
      link.click()
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* QR Code Container */}
      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
        {loading ? (
          <div
            className="flex items-center justify-center bg-gray-100 rounded-lg"
            style={{ width: size, height: size }}
          >
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
          </div>
        ) : qrCodeDataURL ? (
          <img
            src={qrCodeDataURL}
            alt="Zelle Payment QR Code"
            className="rounded-lg"
            style={{ width: size, height: size }}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-gray-100 rounded-lg text-gray-500"
            style={{ width: size, height: size }}
          >
            Failed to generate QR
          </div>
        )}
      </div>

      {/* Amount Display */}
      {showAmount && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">Scan to pay</p>
          <p className="text-2xl font-bold text-saffron">{formatAmount(amount)}</p>
          {purpose && <p className="text-sm text-gray-600">{purpose}</p>}
        </div>
      )}

      {/* Reference Code */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">Reference Code</p>
        <p className="text-lg font-mono font-bold text-gray-900">{referenceCode}</p>
      </div>

      {/* Download Button */}
      <button
        onClick={downloadQR}
        disabled={!qrCodeDataURL}
        className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Download QR Code
      </button>
    </div>
  )
}
