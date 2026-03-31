// types/transaction.ts

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'SAVING'
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  to_account_id: string | null
  category_id: string | null
  tag?: string | null          // ← nuevo, tag específico dentro de la categoría
  type: TransactionType
  amount: number
  currency: string
  date: string
  description: string | null
  status: TransactionStatus
  is_recurring: boolean
  recurrence_interval: string | null
  created_at: string
  updated_at: string
  // Joins opcionales — para mostrar en UI sin llamadas extra
  category?: {
    id: string
    name: string
    icon: string | null
    color: string | null       // ← añadido para mostrar acento de color
    tags: string[]             // ← añadido para mostrar tags disponibles
  } | null
  account?: {
    id: string
    name: string
  } | null
  to_account?: {
    id: string
    name: string
  } | null

  project_id?: string | null    // null = gasto personal sin proyecto
  subtype?:    string | null    // "gasolina", "hosting", etc.
}

export interface CreateTransactionData {
  account_id: string
  to_account_id?: string | null
  category_id?: string | null
  tag?: string | null          // ← nuevo
  type: TransactionType
  amount: number
  date: string
  description?: string | null
  is_recurring?: boolean
  currency?: string
  status?: TransactionStatus
  user_id?: string

  project_id?: string | null
  subtype?:    string | null
}

export type UpdateTransactionData = Partial<CreateTransactionData>

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface CategoryData {
  name: string
  value: number
  categoryId: string
  color: string
  income: number
  expense: number
  percentage: number
}

export interface ChartDataPoint {
  date: string
  income: number
  expense: number
  label: string
}