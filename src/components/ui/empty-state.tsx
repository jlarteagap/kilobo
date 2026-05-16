import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface EmptyStateProps {
  icon?: string
  title: string
  subtitle?: string
  className?: string
  children?: ReactNode
}

function EmptyState({ icon, title, subtitle, className, children }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-12", className)}>
      {icon && <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xl">{icon}</div>}
      <p className="text-[13px] text-gray-400">{title}</p>
      {subtitle && <p className="text-[11px] text-gray-300">{subtitle}</p>}
      {children}
    </div>
  )
}

export { EmptyState }
