import { cn } from "@/lib/utils"

interface SegmentedControlOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentedControlOption<T>[]
  fullWidth?: boolean
  className?: string
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  fullWidth,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "flex gap-1 p-1 bg-[#F2F9E3]/40 rounded-xl",
        fullWidth ? "w-full" : "w-fit",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "text-xs font-medium rounded-lg transition-all duration-200",
            fullWidth
              ? "flex-1 py-2"
              : "px-3 py-1.5",
            value === option.value
              ? "bg-white text-foreground shadow-sm"
              : "text-[#6E6E73] hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export { SegmentedControl }
export type { SegmentedControlOption, SegmentedControlProps }
