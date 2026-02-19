import { Period } from "@/features/transactions/hooks/useTransactionMetrics"

const PERIODS: { value: Period; label: string }[] = [
  { value: "1W", label: "1S" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
]

interface PeriodSelectorProps {
  value: Period
  onChange: (period: Period) => void
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      {PERIODS.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-all
            ${value === period.value
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-500 hover:text-gray-700"
            }
          `}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}