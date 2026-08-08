// features/budgets/components/BudgetCard.tsx
"use client"

import { Pencil, Archive, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { BUDGET_TYPES, BUDGET_STATUS_CONFIG } from "@/types/budget"
import type { BudgetProgress } from "@/types/budget"
import { ProgressBar } from "@/components/ui/progress-bar"
import type { ProgressVariant } from "@/components/ui/progress-bar"

interface BudgetCardProps {
  progress:  BudgetProgress
  onEdit:    (progress: BudgetProgress) => void
  onArchive: (progress: BudgetProgress) => void
  onDelete:  (progress: BudgetProgress) => void
}

const statusToVariant: Record<BudgetProgress['status'], ProgressVariant> = {
  COMPLETED: 'success',
  OVERDUE:   'danger',
  AT_RISK:   'warning',
  ON_TRACK:  'default',
}

// ─── Badge de días ────────────────────────────────────────────────────────────
function DueDayBadge({ days }: { days: number | null }) {
  if (days === null) return null

  const isToday    = days === 0
  const isPast     = days < 0
  const isUrgent   = days > 0 && days <= 3

  return (
    <span className={cn(
      'text-[11px] font-medium px-2 py-0.5 rounded-full',
      isPast    ? 'bg-[#FAEDE9] text-[#B5543D]'     :
      isToday   ? 'bg-orange-50 text-orange-500' :
      isUrgent  ? 'bg-orange-50 text-orange-500' :
      'bg-[rgba(0,0,0,0.06)] text-[#6E6E73]'
    )}>
      {isPast
        ? `Venció hace ${Math.abs(days)}d`
        : isToday
          ? 'Vence hoy'
          : `${days}d restantes`
      }
    </span>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function BudgetCard({
  progress,
  onEdit,
  onArchive,
  onDelete,
}: BudgetCardProps) {
  const { budget, current_amount, target_amount, percent, remaining, days_until_due, status } = progress

  const typeConfig   = BUDGET_TYPES.find((t) => t.value === budget.type)!
  const statusConfig = BUDGET_STATUS_CONFIG[status]
  const isActive     = budget.is_active
  const isCompleted  = status === 'COMPLETED'

  // Colores de fondo por tipo
  const typeBg =
    budget.type === 'INCOME_SOURCE' ? 'bg-[#F2F9E3]' :
    budget.type === 'FIXED_EXPENSE' ? 'bg-[#FAEDE9]'    :
    'bg-blue-50'

  return (
    <div
      className={cn(
        'bg-white rounded-[22px] p-5 flex flex-col gap-4 transition-all duration-200 group',
        isActive ? '' : 'opacity-60'
      )}
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Icono tipo */}
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0',
            typeBg
          )}>
            {typeConfig.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {budget.name}
            </p>
            <p className="text-[11px] text-[#6E6E73]">
              {typeConfig.label}
            </p>
          </div>
        </div>

        {/* Acciones en hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
          {isActive && (
            <>
              <button
                onClick={() => onEdit(progress)}
                title="Editar"
                className="p-1.5 rounded-lg text-[#6E6E73] hover:text-blue-500 hover:bg-blue-50 transition-all duration-150"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onArchive(progress)}
                title="Archivar"
                className="p-1.5 rounded-lg text-[#6E6E73] hover:text-orange-500 hover:bg-orange-50 transition-all duration-150"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {!isActive && (
            <button
              onClick={() => onDelete(progress)}
              title="Eliminar"
              className="p-1.5 rounded-lg text-[#6E6E73] hover:text-[#B5543D] hover:bg-[#FAEDE9] transition-all duration-150"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Montos ── */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[11px] text-[#6E6E73] mb-0.5">
            {budget.type === 'INCOME_SOURCE' ? 'Ingresado' : 'Ejecutado'}
          </p>
          <p className="text-xl font-semibold tracking-tight text-foreground">
            {formatCurrency(current_amount, budget.currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[#6E6E73] mb-0.5">Meta</p>
          <p className="text-sm font-medium text-[#6E6E73]">
            {formatCurrency(target_amount, budget.currency)}
          </p>
        </div>
      </div>

      {/* ── Barra de progreso ── */}
      <ProgressBar
        value={current_amount}
        max={target_amount}
        variant={statusToVariant[status]}
        showLabel
        showExtra
      />

      {/* ── Footer: status + días ── */}
      <div className="flex items-center justify-between pt-1 border-t border-[rgba(0,0,0,0.06)]">
        <span className={cn(
          'text-[11px] font-semibold px-2.5 py-1 rounded-full',
          statusConfig.color,
          statusConfig.bg,
        )}>
          {statusConfig.label}
        </span>

        <div className="flex items-center gap-2">
          {/* Faltante o excedente */}
          {!isCompleted && remaining > 0 && (
            <span className="text-[11px] text-[#6E6E73]">
              Faltan {formatCurrency(remaining, budget.currency)}
            </span>
          )}
          {isCompleted && (
            <span className="text-[11px] text-[#4F6A35] font-medium">
              ✓ Completado
            </span>
          )}
          <DueDayBadge days={days_until_due} />
        </div>
      </div>
    </div>
  )
}