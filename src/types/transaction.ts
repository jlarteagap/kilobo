// types/transaction.ts

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'SAVING'
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

import { Category } from './category'
import { Project } from './project'

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
  // Para transferencias entre monedas — monto acreditado en la cuenta destino
  converted_amount?: number
  to_currency?: string
  date: string
  description: string | null
  status: TransactionStatus
  is_recurring: boolean
  recurrence_interval: string | null
  created_at: string
  updated_at: string
  // Joins opcionales — para mostrar en UI sin llamadas extra
  category?: Category | null
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
  project?: Project | null

  // Referencia a cuota de crédito pagada con esta transacción
  credit_id?:       string | null
  installment_id?:  string | null
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
  converted_amount?: number    // para transferencias cross-currency
  to_currency?: string         // moneda destino

  project_id?: string | null
  subtype?:    string | null

  // Referencia a cuota de crédito pagada con esta transacción
  credit_id?:       string | null
  installment_id?:  string | null
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
  incomeByCurrency?: Record<string, number>
  expenseByCurrency?: Record<string, number>
}