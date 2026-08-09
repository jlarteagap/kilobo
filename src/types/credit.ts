export type CreditType =
  | 'BANK'
  | 'VEHICLE'
  | 'CREDIT_CARD'
  | 'MORTGAGE'
  | 'CONSUMER'

export type CreditStatus = 'ACTIVE' | 'PAID' | 'CANCELLED'

export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE'

export interface Credit {
  id: string
  user_id: string
  type: CreditType
  institution: string
  original_amount: number
  disbursed_amount: number
  currency: string
  annual_interest_rate: number
  total_installments: number
  paid_installments: number
  current_balance: number
  start_date: string
  first_payment_date: string
  account_id: string | null
  status: CreditStatus
  disburse_recorded: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateCreditData {
  type: CreditType
  institution: string
  original_amount: number
  disbursed_amount?: number
  currency: string
  annual_interest_rate: number
  total_installments: number
  paid_installments?: number
  current_balance?: number
  start_date: string
  first_payment_date: string
  account_id?: string | null
  disburse_recorded?: boolean
  notes?: string | null
}

export interface Installment {
  id: string
  credit_id: string
  number: number
  due_date: string
  total_amount: number
  principal: number
  interest: number
  remaining_balance: number
  status: InstallmentStatus
  paid_at: string | null
  transaction_id: string | null
  created_at: string
}

export interface PayInstallmentsData {
  installment_ids: string[]
  date: string
  notes?: string | null
}

export const CREDIT_TYPES: {
  value: CreditType
  label: string
  emoji: string
  description: string
}[] = [
  { value: 'BANK',        label: 'Bancario',        emoji: '🏦', description: 'Préstamo bancario personal o empresarial' },
  { value: 'VEHICLE',     label: 'Vehicular',       emoji: '🚗', description: 'Crédito para compra de vehículo' },
  { value: 'CREDIT_CARD', label: 'Tarjeta de crédito', emoji: '💳', description: 'Saldo de tarjeta de crédito' },
  { value: 'MORTGAGE',    label: 'Hipotecario',     emoji: '🏠', description: 'Crédito hipotecario para vivienda' },
  { value: 'CONSUMER',    label: 'De consumo',      emoji: '🛍️', description: 'Crédito de consumo personal' },
]

export const CREDIT_STATUS_CONFIG: Record<CreditStatus, { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: 'Activo',    color: 'text-[#4F6A35]', bg: 'bg-[#F2F9E3]' },
  PAID:      { label: 'Pagado',    color: 'text-[#6E6E73]', bg: 'bg-[rgba(0,0,0,0.06)]' },
  CANCELLED: { label: 'Cancelado', color: 'text-[#B5543D]', bg: 'bg-[#FAEDE9]' },
}

export const INSTALLMENT_STATUS_CONFIG: Record<InstallmentStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-amber-700', bg: 'bg-amber-50' },
  PAID:    { label: 'Pagada',    color: 'text-[#4F6A35]', bg: 'bg-[#F2F9E3]' },
  OVERDUE: { label: 'Vencida',   color: 'text-[#B5543D]', bg: 'bg-[#FAEDE9]' },
}
