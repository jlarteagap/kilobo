// src/types/driver.ts

export type DriverApp = 'UBER' | 'YANGO' | 'INDRIVE'
export type PaymentMethod = 'CASH' | 'CARD' | 'QR'
export type ExpenseType = 'TOLL' | 'GAS' | 'MAINTENANCE' | 'OTHER'

export const DRIVER_APPS: DriverApp[] = ['UBER', 'YANGO', 'INDRIVE']
export const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'QR']
export const EXPENSE_TYPES: ExpenseType[] = ['TOLL', 'GAS', 'MAINTENANCE', 'OTHER']

export type TipsByMethod = { CASH: number; QR: number }

export const DEFAULT_TIPS_PER_APP: TipsByMethod = { CASH: 0, QR: 0 }

type TipsEntry = TipsByMethod | number | undefined | null

export function emptyTips(): Record<DriverApp, TipsByMethod> {
  return {
    UBER: { ...DEFAULT_TIPS_PER_APP },
    YANGO: { ...DEFAULT_TIPS_PER_APP },
    INDRIVE: { ...DEFAULT_TIPS_PER_APP },
  }
}

export function sumAppTips(value: TipsEntry): number {
  if (value == null) return 0
  if (typeof value === 'number') return value
  return (value.CASH ?? 0) + (value.QR ?? 0)
}

export function sumTips(tips: Record<DriverApp, TipsEntry> | undefined | null): number {
  if (!tips) return 0
  return DRIVER_APPS.reduce((total, app) => total + sumAppTips(tips[app]), 0)
}

export function sumTipsByMethod(
  tips: Record<DriverApp, TipsEntry> | undefined | null,
  method: keyof TipsByMethod,
): number {
  if (!tips) return 0
  let total = 0
  for (const app of DRIVER_APPS) {
    const v = tips[app]
    if (v == null || typeof v === 'number') continue
    total += v[method] ?? 0
  }
  return total
}

export const DRIVER_APP_LABELS: Record<DriverApp, string> = {
  UBER:   'Uber',
  YANGO:  'Yango',
  INDRIVE: 'InDrive',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  QR:   'QR',
}

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  TOLL:        'Peaje',
  GAS:         'Gasolina',
  MAINTENANCE: 'Mantenimiento',
  OTHER:       'Otros',
}

// ─── Configuración del usuario ────────────────────────────────────────────────
export interface DriverConfig {
  projectId: string            // ID del proyecto/actividad (ej: "Conductor de apps")
  incomeCashAccountId: string
  incomeQrAccountId: string
  expenseCashAccountId: string // para gastos pagados en efectivo
  expenseQrAccountId: string   // para gastos pagados con QR
  commissionAccountId: string  // para comisiones (las descuenta la app)
  bonusDepositAccountId: string // cuenta donde la app deposita los bonos
  subtypeMapping: {
    uber: string
    yango: string
    indrive: string
    bonus: string
    commission: string
    toll: string
    gas: string
    maintenance: string
    other: string
  }
}

export const DEFAULT_SUBTYPE_MAPPING: DriverConfig['subtypeMapping'] = {
  uber: 'uber',
  yango: 'yango',
  indrive: 'indrive',
  bonus: 'bonos',
  commission: 'comisiones',
  toll: 'peaje',
  gas: 'gasolina',
  maintenance: 'mantenimiento',
  other: 'varios',
}

// ─── Turno ────────────────────────────────────────────────────────────────────
export interface DriverExpense {
  type: ExpenseType
  amount: number
  paymentMethod: PaymentMethod
}

export interface DriverShift {
  id: string
  user_id: string
  date: string               // Fecha del turno (YYYY-MM-DD) — la persona elige el día
  hoursWorked: number        // Horas trabajadas (manual, ej: 2.5, 6)
  startKm: number | null
  endKm: number | null
  totalKm: number | null
  earnings: Record<DriverApp, Record<PaymentMethod, number>>
  bonuses: Record<DriverApp, number>
  commissions: Record<DriverApp, number>
  tips: Record<DriverApp, TipsByMethod>
  expenses: DriverExpense[]
  totalEarnings: number
  totalBonuses: number
  totalCommissions: number
  totalExpenses: number
  totalTips: number
  grossEarnings: number
  pendingAmount: number
  liquidEarnings: number
  maintenanceReserve: number
  generatedTransactionIds: string[]
  gasolinaTripCreatedAt?: number | null  // referencia al trip creado en Gasolina al cerrar turno
  notes: string | null
  createdAt: string
  updatedAt: string
}

// Datos de entrada: crear o editar un turno (registro manual)
export interface ShiftInput {
  date: string               // YYYY-MM-DD
  hoursWorked: number
  startKm?: number | null
  endKm?: number | null
  earnings: Record<DriverApp, Record<PaymentMethod, number>>
  bonuses: Record<DriverApp, number>
  commissions: Record<DriverApp, number>
  tips: Record<DriverApp, TipsByMethod>
  expenses: DriverExpense[]
  notes?: string | null
}

// ─── Depósitos de apps ────────────────────────────────────────────────────────
export interface DriverDeposit {
  id: string
  user_id: string
  app: DriverApp
  date: string               // Fecha del depósito (YYYY-MM-DD)
  grossAmount: number        // Monto bruto depositado por la app
  commission: number         // Comisión cobrada por la app sobre bonos/tarjetas
  netAmount: number          // bruto − comisión (derivado, calculado en el service)
  notes: string | null
  createdAt: string
  updatedAt: string
}

// Datos de entrada: crear o editar un depósito
export interface DepositInput {
  app: DriverApp
  date: string               // YYYY-MM-DD
  grossAmount: number
  commission: number
  notes?: string | null
}

// Reconciliación por app: depositado vs pendiente registrado en turnos
export interface DriverDepositReconciliation {
  app: DriverApp
  deposited: number          // suma de grossAmount de depósitos
  pending: number            // suma de tarjeta + bonos de turnos
  difference: number         // deposited − pending
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface DriverAnalyticsSummary {
  grossEarnings: number
  pendingAmount: number
  liquidEarnings: number
  totalBonuses: number
  totalCommissions: number
  totalExpenses: number
  totalMaintenance: number
  totalHours: number
  liquidBsPerHour: number
  grossBsPerHour: number
  avgPerShift: number
  totalKm: number
  margin: number
  shiftCount: number
}

export interface DriverAppBreakdown {
  app: DriverApp
  cash: number
  card: number
  qr: number
  bonuses: number
  tips: number
  commissions: number
  totalGross: number
}

export interface DriverAnalytics {
  summary: DriverAnalyticsSummary
  byApp: DriverAppBreakdown[]
  dailyTrend: Array<{ date: string; liquidBsPerHour: number; liquidEarnings: number }>
}
