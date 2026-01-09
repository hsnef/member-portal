'use client'

import Link from 'next/link'

interface TermsCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  required?: boolean
  disabled?: boolean
  className?: string
}

export default function TermsCheckbox({
  checked,
  onChange,
  required = true,
  disabled = false,
  className = '',
}: TermsCheckboxProps) {
  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          id="terms-checkbox"
          name="terms-checkbox"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          disabled={disabled}
          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor="terms-checkbox" className="text-gray-700">
          I have read and agree to the{' '}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:text-orange-700 underline font-medium"
          >
            HSNEF Membership Portal Terms of Use
          </Link>
          .{required && <span className="text-red-600 ml-1">*</span>}
        </label>
      </div>
    </div>
  )
}
