'use client'

interface ZellePaymentOptionProps {
  selected: boolean
  onSelect: () => void
  disabled?: boolean
}

export function ZellePaymentOption({
  selected,
  onSelect,
  disabled = false,
}: ZellePaymentOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`
        w-full p-4 rounded-lg border-2 transition-all text-left
        ${selected
          ? 'border-[#FF9933] bg-[#FF9933]/5'
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Radio Circle */}
        <div
          className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${selected ? 'border-[#FF9933]' : 'border-gray-300'}
          `}
        >
          {selected && <div className="w-3 h-3 rounded-full bg-[#FF9933]" />}
        </div>

        {/* Zelle Icon */}
        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          Z
        </div>

        {/* Label */}
        <div className="flex-1">
          <p className="font-medium text-gray-900">Pay with Zelle</p>
          <p className="text-sm text-gray-500">
            Send directly from your bank
          </p>
        </div>
      </div>

      {selected && (
        <div className="mt-3 ml-8 pl-5 border-l-2 border-[#FF9933]/30">
          <p className="text-sm text-gray-600">
            You&apos;ll receive instructions to complete the Zelle payment from your bank app.
            No processing fees!
          </p>
        </div>
      )}
    </button>
  )
}
