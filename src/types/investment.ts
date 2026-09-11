export type InvestmentTxType = 'BUY' | 'SELL'

export type InvestmentRecurrenceFrequency = 'WEEKLY'

export interface InvestmentRecurrence {
  enabled: boolean
  frequency: InvestmentRecurrenceFrequency
  /** 0 = Domingo … 6 = Sábado (convención date-fns getDay) */
  day_of_week: number
  /** Monto fijo por periodo, en la moneda de la inversión */
  amount: number
  currency: string
  account_id: string
  /** Fecha programada 'yyyy-MM-dd' — es "due" cuando date <= hoy */
  next_due: string | null
  last_executed: string | null
}

export interface Investment {
  id: string
  user_id: string
  account_id: string
  transaction_id?: string | null
  name: string
  amount: number
  currency: string
  date: string
  notes?: string | null
  /** Plan de compra recurrente semanal (opcional) */
  recurrence?: InvestmentRecurrence | null
  created_at: Date
  updated_at: Date
}

export interface InvestmentTransaction {
  id: string
  investment_id: string
  user_id: string
  type: InvestmentTxType
  amount: number
  currency: string
  date: string
  notes?: string | null
  created_at: Date
  updated_at: Date
}

export type CreateInvestmentData = Pick<Investment, 'account_id' | 'name' | 'amount' | 'currency' | 'date' | 'notes' | 'transaction_id'>
export type UpdateInvestmentData = Partial<Pick<CreateInvestmentData, 'name' | 'amount' | 'currency' | 'date' | 'notes'>> & {
  recurrence?: InvestmentRecurrence | null
}

export type CreateInvestmentTxData = Pick<InvestmentTransaction, 'investment_id' | 'type' | 'amount' | 'date' | 'notes'> & {
  account_id: string
  currency: string
}
