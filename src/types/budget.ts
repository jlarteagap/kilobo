// types/budget.ts

export type BudgetType = 'FIXED_EXPENSE' | 'INCOME_SOURCE' | 'SAVINGS_GOAL'

export interface Budget {
  id:           string
  user_id:      string
  name:         string
  type:         BudgetType
  target_amount: number
  currency:     string
  due_day?:     number | null    // día del mes que vence (1-31), opcional
  category_ids: string[]         // categorías vinculadas para calcular progreso
  is_active:    boolean
  created_at:   string
  updated_at:   string
  project_id?:  string | null
  subtypes?:    string[]
}

export type CreateBudgetData = Omit<Budget,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

export type UpdateBudgetData = Partial<CreateBudgetData>

// ─── Progreso calculado en cliente — no se guarda en Firestore ────────────────
export interface BudgetProgress {
  budget:          Budget
  current_amount:  number   // suma de transacciones del mes vinculadas
  target_amount:   number
  percent:         number   // 0-100
  remaining:       number   // target - current (puede ser negativo)
  days_until_due:  number | null  // null si no tiene due_day
  is_overdue:      boolean        // pasó el due_day y no está completo
  status:          'ON_TRACK' | 'AT_RISK' | 'COMPLETED' | 'OVERDUE'
}

// ─── Resumen global del mes — calculado desde todos los budgets ───────────────
export interface BudgetSummaryData {
  totalIncome:       number   // suma de INCOME_SOURCE actuales
  totalFixedExpense: number   // suma de FIXED_EXPENSE target
  totalSavingsGoal:  number   // suma de SAVINGS_GOAL target
  available:         number   // totalIncome - totalFixedExpense
  isDeficit:         boolean  // available < 0
}

// ─── Constantes de presentación ──────────────────────────────────────────────
export const BUDGET_TYPES: {
  value:       BudgetType
  label:       string
  description: string
  emoji:       string
}[] = [
  {
    value:       'INCOME_SOURCE',
    label:       'Fuente de ingreso',
    description: 'Trackea cuánto estás ganando por esta fuente',
    emoji:       '💰',
  },
  {
    value:       'FIXED_EXPENSE',
    label:       'Gasto fijo',
    description: 'Un pago obligatorio que debes cubrir cada mes',
    emoji:       '📌',
  },
  {
    value:       'SAVINGS_GOAL',
    label:       'Meta de ahorro',
    description: 'Dinero que quieres acumular este mes',
    emoji:       '🎯',
  },
]

export const BUDGET_STATUS_CONFIG: Record<
  BudgetProgress['status'],
  { label: string; color: string; bg: string }
> = {
  ON_TRACK:  { label: 'En camino',  color: 'text-blue-600',    bg: 'bg-blue-50'    },
  AT_RISK:   { label: 'En riesgo',  color: 'text-orange-600',  bg: 'bg-orange-50'  },
  COMPLETED: { label: 'Completado', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  OVERDUE:   { label: 'Vencido',    color: 'text-rose-600',    bg: 'bg-rose-50'    },
}