import { format, startOfDay } from 'date-fns'

import type { Budget, BudgetProgress } from '@/types/budget'
import type { Transaction } from '@/types/transaction'
import { convertToBOB } from '@/lib/config/exchange-rates'

/**
 * Progreso de un presupuesto sobre el mes en curso.
 *
 * Vive fuera de los hooks para que el servidor pueda calcularlo. Antes el
 * navegador recorría el historial completo una vez por presupuesto activo
 * (O(presupuestos × transacciones)) en cada render.
 */
export function calcBudgetProgress(
  budget: Budget,
  transactions: Transaction[],
): BudgetProgress {
  const now          = new Date()
  const currentMonth = format(now, 'yyyy-MM')

  const linked = transactions.filter((t) => {
    const txMonth = t.date.slice(0, 7)
    if (txMonth !== currentMonth) return false

    // ── Modo proyecto ────────────────────────────────────────────────────────
    if (budget.project_id) {
      if (t.project_id !== budget.project_id) return false

      // Si el budget tiene subtipos específicos, filtrar por ellos
      if (budget.subtypes && budget.subtypes.length > 0) {
        if (!t.subtype || !budget.subtypes.includes(t.subtype)) return false
      }

      // Filtrar por tipo de transacción igual que el modo personal
      if (budget.type === 'INCOME_SOURCE') return t.type === 'INCOME'
      if (budget.type === 'FIXED_EXPENSE') return t.type === 'EXPENSE'
      if (budget.type === 'SAVINGS_GOAL')  return t.type === 'INCOME'
      return false
    }

    // ── Modo personal (comportamiento original) ───────────────────────────────
    const inCats = !!t.category_id && budget.category_ids.includes(t.category_id)
    if (!inCats) return false

    if (budget.type === 'INCOME_SOURCE') return t.type === 'INCOME'
    if (budget.type === 'FIXED_EXPENSE') return t.type === 'EXPENSE'
    if (budget.type === 'SAVINGS_GOAL')  return t.type === 'INCOME'
    return false
  })

  const current_amount = linked.reduce((sum, t) => sum + convertToBOB(t.amount, t.currency), 0)
  const percent        = Math.min((current_amount / budget.target_amount) * 100, 100)
  const remaining      = budget.target_amount - current_amount

  // ── Días hasta vencimiento (sin cambios) ──────────────────────────────────
  let days_until_due: number | null = null
  let is_overdue = false

  if (budget.due_day) {
    const dueDate      = new Date(now.getFullYear(), now.getMonth(), budget.due_day)
    const today        = startOfDay(now)
    const dueDateStart = startOfDay(dueDate)

    days_until_due = Math.ceil(
      (dueDateStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    is_overdue = days_until_due < 0 && percent < 100
  }

  // ── Status (sin cambios) ──────────────────────────────────────────────────
  let status: BudgetProgress['status']

  if (percent >= 100) {
    status = 'COMPLETED'
  } else if (is_overdue) {
    status = 'OVERDUE'
  } else if (budget.due_day) {
    const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth   = now.getDate()
    const halfwayPoint = daysInMonth / 2
    status = dayOfMonth > halfwayPoint && percent < 50 ? 'AT_RISK' : 'ON_TRACK'
  } else {
    status = 'ON_TRACK'
  }

  return {
    budget,
    current_amount,
    target_amount: budget.target_amount,
    percent,
    remaining,
    days_until_due,
    is_overdue,
    status,
  }
}
