// types/debt.ts
export type DebtType    = 'GIVEN' | 'RECEIVED'
export type DebtStatus  = 'ACTIVE' | 'PAID' | 'CANCELLED'

export interface Debt {
  id:            string
  user_id:       string
  type:          DebtType       // GIVEN = presté, RECEIVED = me prestaron
  contact_name:  string
  amount:        number         // monto original
  paid_amount:   number         // acumulado de pagos
  currency:      string
  account_id:    string         // cuenta que se movió al crear
  description?:  string | null
  status:        DebtStatus
  created_at:    string
  updated_at:    string
  // Join opcional
  account?: { id: string; name: string } | null
}

export interface CreateDebtData {
  type:          DebtType
  contact_name:  string
  amount:        number
  currency:      string
  account_id:    string
  description?:  string | null
}

export interface DebtPayment {
  id:         string
  debt_id:    string
  amount:     number
  account_id: string
  notes?:     string | null
  date:       string
  created_at: string
}

export interface CreateDebtPaymentData {
  amount:     number
  account_id: string
  notes?:     string | null
  date:       string
}

// Derivados útiles para UI
export interface DebtSummary {
  totalGiven:        number  // total prestado
  totalReceived:     number  // total que me deben
  pendingGiven:      number  // pendiente por cobrar
  pendingReceived:   number  // pendiente por pagar
}