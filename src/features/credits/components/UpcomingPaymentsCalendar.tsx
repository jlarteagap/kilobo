"use client"

import { useMemo } from "react"
import { CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { useUpcomingInstallments } from "../hooks/useCredits"
import { CREDIT_TYPES } from "@/types/credit"
import { differenceInDays, parseISO } from "date-fns"

export function UpcomingPaymentsCalendar() {
  const { data: rows = [], isLoading } = useUpcomingInstallments()

  const { overdue, upcoming } = useMemo(() => {
    const overdue: typeof rows = []
    const upcoming: typeof rows = []
    rows.forEach((row) => {
      if (row.installment.status === 'OVERDUE') overdue.push(row)
      else upcoming.push(row)
    })
    return { overdue, upcoming }
  }, [rows])

  const count = overdue.length + upcoming.length
  if (isLoading || count === 0) return null

  return (
    <div className="bg-white rounded-[22px] p-5 flex flex-col gap-4"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-[-0.01em]">
            Calendario de cuotas
          </h3>
          <p className="text-[11px] text-[#6E6E73] mt-0.5">
            {overdue.length > 0 && (
              <span className="text-[#B5543D] font-semibold">
                {overdue.length} vencida{overdue.length !== 1 ? 's' : ''}
              </span>
            )}
            {overdue.length > 0 && upcoming.length > 0 && (
              <span className="text-[#6E6E73] mx-1">·</span>
            )}
            <span>
              {upcoming.length} por vencer
            </span>
          </p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center">
          <CalendarClock className="w-4 h-4 text-[#6E6E73]" />
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {[...overdue, ...upcoming].slice(0, 6).map((row) => {
          const { credit, installment } = row
          const typeConfig = CREDIT_TYPES.find((t) => t.value === credit.type)
          const isOverdue  = installment.status === 'OVERDUE'
          const days       = differenceInDays(parseISO(installment.due_date), new Date())

          return (
            <div key={installment.id} className="flex items-center gap-3">
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0',
                isOverdue ? 'bg-[#FAEDE9]' : 'bg-[#F2F9E3]'
              )}>
                {typeConfig?.emoji ?? '🏦'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[12px] font-medium text-foreground truncate">
                    {credit.institution}
                  </p>
                  <p className={cn(
                    'text-[12px] font-semibold tabular-nums flex-shrink-0 ml-2',
                    isOverdue ? 'text-[#B5543D]' : 'text-foreground'
                  )}>
                    {formatCurrency(installment.total_amount, credit.currency)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-[#6E6E73]">
                    Cuota #{installment.number}
                  </p>
                  <span className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                    isOverdue
                      ? 'text-[#B5543D] bg-[#FAEDE9]'
                      : 'text-[#4F6A35] bg-[#F2F9E3]'
                  )}>
                    {isOverdue
                      ? `Venció hace ${Math.abs(days)}d`
                      : days === 0
                        ? 'Vence hoy'
                        : `En ${days}d`
                    }
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        {count > 6 && (
          <p className="text-[11px] text-[#6E6E73]/60 text-center pt-1">
            +{count - 6} más
          </p>
        )}
      </div>
    </div>
  )
}