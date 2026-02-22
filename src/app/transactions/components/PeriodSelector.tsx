// features/transactions/components/PeriodSelector.tsx
import { cn } from "@/lib/utils"
import { Period } from "@/features/transactions/hooks/useTransactionMetrics"

const PERIODS: { value: Period; label: string }[] = [
  { value: '1W',  label: '1 Sem' },
  { value: '1M',  label: '1 Mes' },
  { value: '3M',  label: '3 Mes' },
  { value: 'ALL', label: 'Todo'  },
]

interface PeriodSelectorProps {
  value:    Period
  onChange: (period: Period) => void
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
      {PERIODS.map((period) => (
        <button
          key={period.value}
          type="button"
          onClick={() => onChange(period.value)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200',
            value === period.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}