import { cn } from "@/lib/utils"

interface ChipSelectorProps {
  items: string[]
  value: string | null | undefined
  onChange: (value: string | null) => void
  clearLabel?: string
}

function ChipSelector({ items, value, onChange, clearLabel = "Ninguna" }: ChipSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "px-3 py-1 rounded-full text-xs font-medium transition-all duration-150",
          !value
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        )}
      >
        {clearLabel}
      </button>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-all duration-150",
            value === item
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          )}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export { ChipSelector }
export type { ChipSelectorProps }
