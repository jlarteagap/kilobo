// src/types/driver.ts

export type DriverApp = 'UBER' | 'YANGO' | 'INDRIVE'
export type PaymentMethod = 'CASH' | 'CARD' | 'QR'
export type ExpenseType = 'TOLL' | 'GAS' | 'MAINTENANCE' | 'OTHER'

export const DRIVER_APPS: DriverApp[] = ['UBER', 'YANGO', 'INDRIVE']
export const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'QR']
export const EXPENSE_TYPES: ExpenseType[] = ['TOLL', 'GAS', 'MAINTENANCE', 'OTHER']

// ─── Política del fondo de mantenimiento ────────────────────────────────────────
/** Porcentaje del líquido del turno que se aparta al fondo de mantenimiento. */
export const MAINTENANCE_RESERVE_RATE = 0.06
/**
 * Margen mínimo (líquido / bruto) que un turno debe alcanzar para que se le
 * calcule la reserva. Turnos por debajo de este umbral —tipicamente porque los
 * gastos|Consumo superaron a las ganancias— no generan ahorro.
 */
export const MAINTENANCE_MIN_MARGIN = 0.2

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
  // Cuenta aparte donde se acumula el 6% del neto de cada turno. Si es null o
  // "" la reserva se sigue registrando como gasto, como antes de esta feature.
  maintenanceSavingsAccountId?: string | null
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

// ─── Métricas del turno ────────────────────────────────────────────────────────
export type ShiftMetricsInput = Pick<
  ShiftInput,
  'earnings' | 'bonuses' | 'commissions' | 'tips' | 'expenses'
>

export interface ShiftMetrics {
  totalEarnings: number
  totalCash: number
  totalCard: number
  totalQr: number
  totalBonuses: number
  totalCommissions: number
  totalCashTips: number
  totalQrTips: number
  totalTips: number
  totalExpenses: number
  grossEarnings: number
  pendingAmount: number
  preMaintenanceLiquid: number
  margin: number
  qualifiesForMaintenance: boolean
  maintenanceReserve: number
  liquidEarnings: number
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function amount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/**
 * Única fuente de verdad para las cifras financieras de un turno.
 * La usan el servicio (que persiste y genera transacciones) y el formulario
 * (que muestra el preview), así el número que anticipa el conductor es
 * exactamente el que se guarda.
 *
 * La reserva de mantenimiento NO se calcula cuando los gastos superaron a las
 * ganancias: en ese caso `preMaintenanceLiquid` es negativo y el margen queda
 * por debajo del umbral, así que no hay ahorro que apartar.
 */
export function computeShiftMetrics(input: ShiftMetricsInput): ShiftMetrics {
  const { earnings, bonuses, commissions, tips, expenses } = input

  let totalCash = 0
  let totalCard = 0
  let totalQr = 0
  let totalBonuses = 0
  let totalCommissions = 0
  let totalCashTips = 0
  let totalQrTips = 0

  for (const app of DRIVER_APPS) {
    totalCash += amount(earnings[app]?.CASH)
    totalCard += amount(earnings[app]?.CARD)
    totalQr += amount(earnings[app]?.QR)
    totalBonuses += amount(bonuses[app])
    totalCommissions += amount(commissions[app])
    totalCashTips += amount(tips[app]?.CASH)
    totalQrTips += amount(tips[app]?.QR)
  }

  const totalTips = totalCashTips + totalQrTips
  const totalExpenses = (expenses ?? []).reduce((s, e) => s + amount(e?.amount), 0)

  const gross = totalCash + totalCard + totalQr + totalBonuses + totalTips
  const preMaintenanceLiquid = totalCash + totalQr + totalTips - totalCommissions - totalExpenses
  const margin = gross > 0 ? preMaintenanceLiquid / gross : 0

  const qualifiesForMaintenance =
    preMaintenanceLiquid > 0 && margin >= MAINTENANCE_MIN_MARGIN

  const maintenanceReserve = qualifiesForMaintenance
    ? round2(preMaintenanceLiquid * MAINTENANCE_RESERVE_RATE)
    : 0

  return {
    totalEarnings: totalCash + totalCard + totalQr,
    totalCash,
    totalCard,
    totalQr,
    totalBonuses,
    totalCommissions,
    totalCashTips,
    totalQrTips,
    totalTips,
    totalExpenses,
    grossEarnings: gross,
    pendingAmount: totalCard + totalBonuses,
    preMaintenanceLiquid,
    margin,
    qualifiesForMaintenance,
    maintenanceReserve,
    liquidEarnings: round2(preMaintenanceLiquid - maintenanceReserve),
  }
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
