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
  created_at: Date
  updated_at: Date
}

export type CreateInvestmentData = Pick<Investment, 'account_id' | 'name' | 'amount' | 'currency' | 'date' | 'notes' | 'transaction_id'>
export type UpdateInvestmentData = Partial<Pick<CreateInvestmentData, 'name' | 'amount' | 'currency' | 'date' | 'notes'>>
