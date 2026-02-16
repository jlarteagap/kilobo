export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'SAVING' | 'DEBT'
export type PaymentMethod = 'CASH' | 'QR' | 'CARD' | 'TRANSFER' | 'OTHER'

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  to_account_id: string | null
  category_id: string | null
  type: TransactionType
  amount: number
  currency: string
  date: string
  description: string | null
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  payment_method: PaymentMethod | null
  is_recurring: boolean
  recurrence_interval: string | null
  created_at: string
  updated_at: string
  // Joins
  category?: {
    id: string
    name: string
    icon: string | null
  } | null
  account?: {
    id: string
    name: string
  } | null
  to_account?: {
    id: string
    name: string
  } | null
}

export interface CreateTransactionData {
  account_id: string
  to_account_id?: string | null
  category_id?: string | null
  type: TransactionType
  amount: number
  date: string
  description?: string | null
  payment_method?: PaymentMethod | null
  is_recurring?: boolean
  currency?: string
}
