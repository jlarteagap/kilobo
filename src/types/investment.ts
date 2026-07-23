export type InvestmentTxType = 'BUY' | 'SELL'

export interface Investment {
  id: string
  user_id: string
  account_id: string
  transaction_id?: string | null
  name: string
  amount: number
  units?: number | null
  unit_price?: number | null
  currency: string
  date: string
  notes?: string | null
  created_at: Date
  updated_at: Date
}

export interface InvestmentTransaction {
  id: string
  investment_id: string
  user_id: string
  type: InvestmentTxType
  units: number
  unit_price: number
  total_amount: number
  currency: string
  date: string
  notes?: string | null
  created_at: Date
  updated_at: Date
}

export type CreateInvestmentData = Pick<Investment, 'account_id' | 'name' | 'amount' | 'currency' | 'date' | 'notes' | 'transaction_id'> & {
  units?: number | null
  unit_price?: number | null
}
export type UpdateInvestmentData = Partial<Pick<CreateInvestmentData, 'name' | 'amount' | 'currency' | 'date' | 'notes'>>

export type CreateInvestmentTxData = Pick<InvestmentTransaction, 'investment_id' | 'type' | 'units' | 'unit_price' | 'date' | 'notes'> & {
  account_id: string
  currency: string
}
