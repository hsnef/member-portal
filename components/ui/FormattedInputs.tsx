'use client'

import { forwardRef, InputHTMLAttributes, ChangeEvent } from 'react'
import { formatPhoneNumber, formatEIN, formatZipCode } from '@/lib/utils/formatters'

interface FormattedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  // Support both direct onChange and react-hook-form's onChange
}

/**
 * Phone number input with auto-formatting as (XXX) XXX-XXXX
 * Works with both controlled components and react-hook-form
 */
export const PhoneInput = forwardRef<HTMLInputElement, FormattedInputProps>(
  ({ onChange, className, ...props }, ref) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value)
      e.target.value = formatted

      // Call the original onChange (from react-hook-form or parent)
      if (onChange) {
        onChange(e)
      }
    }

    return (
      <input
        ref={ref}
        type="tel"
        placeholder="(555) 123-4567"
        className={className}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
PhoneInput.displayName = 'PhoneInput'

/**
 * EIN input with auto-formatting as XX-XXXXXXX
 * Works with both controlled components and react-hook-form
 */
export const EINInput = forwardRef<HTMLInputElement, FormattedInputProps>(
  ({ onChange, className, ...props }, ref) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const formatted = formatEIN(e.target.value)
      e.target.value = formatted

      if (onChange) {
        onChange(e)
      }
    }

    return (
      <input
        ref={ref}
        type="text"
        placeholder="XX-XXXXXXX"
        className={className}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
EINInput.displayName = 'EINInput'

/**
 * ZIP code input with auto-formatting as XXXXX or XXXXX-XXXX
 * Works with both controlled components and react-hook-form
 */
export const ZipInput = forwardRef<HTMLInputElement, FormattedInputProps>(
  ({ onChange, className, ...props }, ref) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const formatted = formatZipCode(e.target.value)
      e.target.value = formatted

      if (onChange) {
        onChange(e)
      }
    }

    return (
      <input
        ref={ref}
        type="text"
        placeholder="32092"
        className={className}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
ZipInput.displayName = 'ZipInput'
