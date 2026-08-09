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
            ? "bg-[#4F6A35] text-white"
            : "bg-[#F2F9E3]/40 text-[#6E6E73] hover:bg-[#F2F9E3]"
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
              ? "bg-[#4F6A35] text-white"
              : "bg-[#F2F9E3]/40 text-[#6E6E73] hover:bg-[#F2F9E3]"
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
