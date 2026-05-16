import { cn } from "@/lib/utils"

export type ProgressVariant = 'default' | 'success' | 'danger' | 'warning'

interface ProgressBarProps {
  value: number
  max: number
  variant?: ProgressVariant
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showExtra?: boolean
  className?: string
}

const variantStyles: Record<ProgressVariant, string> = {
  default: 'bg-gray-900',
  success: 'bg-emerald-400',
  danger:  'bg-rose-400',
  warning: 'bg-orange-400',
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

export function ProgressBar({
  value,
  max,
  variant = 'default',
  size = 'sm',
  showLabel = false,
  showExtra = false,
  className,
}: ProgressBarProps) {
  const percent = max > 0 ? (value / max) * 100 : 0
  const clamped = Math.min(percent, 100)

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className={cn('w-full bg-gray-100 rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-700', variantStyles[variant])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            {percent.toFixed(0)}% completado
          </span>
          {showExtra && percent > 100 && (
            <span className="text-[11px] text-emerald-500 font-medium">
              +{(percent - 100).toFixed(0)}% extra
            </span>
          )}
        </div>
      )}
    </div>
  )
}
