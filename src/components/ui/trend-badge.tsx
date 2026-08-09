import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

function TrendBadge({
  trend,
  inverse = false,
  showComparison = true,
  className,
}: {
  trend: number
  inverse?: boolean
  showComparison?: boolean
  className?: string
}) {
  const isPositive = inverse ? trend < 0 : trend > 0
  const isNeutral = trend === 0

  if (isNeutral) {
    return (
      <div className={cn("flex items-center gap-1 text-[11px] font-medium text-[#6E6E73]", className)}>
        <Minus className="w-3 h-3" />
        <span>Sin cambio</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-1 text-[11px] font-medium", isPositive ? "text-[#4F6A35]" : "text-[#B5543D]", className)}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span>
        {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
        {showComparison && " vs anterior"}
      </span>
    </div>
  )
}

export { TrendBadge }
