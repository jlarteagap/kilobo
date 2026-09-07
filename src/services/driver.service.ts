// src/services/driver.service.ts
import { driverRepository } from '@/repositories/driver.repository'
import { driverConfigRepository } from '@/repositories/driver-config.repository'
import { carSharingRepository } from '@/repositories/car-sharing.repository'
import { transactionService } from '@/services/transactions.service'
import {
  DriverShift,
  DriverApp,
  PaymentMethod,
  DriverConfig,
  DriverAnalytics,
  DriverAnalyticsSummary,
  DriverAppBreakdown,
  ShiftInput,
  DRIVER_APPS,
  DRIVER_APP_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/types/driver'
import type { CreateTransactionData } from '@/types/transaction'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Servicio ──────────────────────────────────────────────────────────────────

// ─── Helper: procesar transacciones + km para create/update ───────────────────
async function processShiftTransactions(
  config: DriverConfig,
  data: ShiftInput,
  userId: string,
) {
  const totalEarnings = sum(DRIVER_APPS.flatMap((app) => Object.values(data.earnings[app])))
  const totalBonuses = sum(Object.values(data.bonuses))
  const totalCommissions = sum(Object.values(data.commissions))
  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0)
  const grossEarnings = totalEarnings + totalBonuses

  const cardEarnings = sum(DRIVER_APPS.map((app) => data.earnings[app].CARD))
  const pendingAmount = cardEarnings + totalBonuses

  const cashEarnings = sum(DRIVER_APPS.map((app) => data.earnings[app].CASH))
  const qrEarnings = sum(DRIVER_APPS.map((app) => data.earnings[app].QR))
  const liquidEarnings = cashEarnings + qrEarnings - totalCommissions - totalExpenses

  const endKm3 = data.endKm != null ? data.endKm % 1000 : null
  const startKm3 = data.startKm != null ? data.startKm % 1000 : null
  let totalKm: number | null = null
  if (endKm3 != null && startKm3 != null) {
    totalKm = endKm3 >= startKm3 ? endKm3 - startKm3 : 1000 + endKm3 - startKm3
  }

  const createdTxIds: string[] = []
  const shiftDate = data.date || todayDateStr()

  const createTx = async (tx: CreateTransactionData) => {
    const result = await transactionService.createWithBalance(tx, userId)
    createdTxIds.push(result.id)
  }

  for (const app of DRIVER_APPS) {
    const subtype = app === 'UBER' ? config.subtypeMapping.uber
      : app === 'YANGO' ? config.subtypeMapping.yango
      : config.subtypeMapping.indrive

    if (data.earnings[app].CASH > 0) {
      await createTx({
        account_id: config.incomeCashAccountId,
        project_id: config.projectId,
        subtype, type: 'INCOME',
        amount: data.earnings[app].CASH,
        date: shiftDate,
        description: `${DRIVER_APP_LABELS[app]} efectivo`,
      })
    }
    if (data.earnings[app].QR > 0) {
      await createTx({
        account_id: config.incomeQrAccountId,
        project_id: config.projectId,
        subtype, type: 'INCOME',
        amount: data.earnings[app].QR,
        date: shiftDate,
        description: `${DRIVER_APP_LABELS[app]} QR`,
      })
    }
  }

  for (const app of DRIVER_APPS) {
    if (data.commissions[app] > 0) {
      await createTx({
        account_id: config.commissionAccountId,
        project_id: config.projectId,
        subtype: config.subtypeMapping.commission,
        type: 'EXPENSE',
        amount: data.commissions[app],
        date: shiftDate,
        description: `Comisión ${DRIVER_APP_LABELS[app]}`,
      })
    }
  }

  const expenseSubtypeMap: Record<string, string> = {
    TOLL: config.subtypeMapping.toll,
    GAS: config.subtypeMapping.gas,
    MAINTENANCE: config.subtypeMapping.maintenance,
    OTHER: config.subtypeMapping.other,
  }

  for (const expense of data.expenses) {
    if (expense.amount <= 0) continue
    await createTx({
      account_id: expense.paymentMethod === 'CASH' ? config.expenseCashAccountId : config.expenseQrAccountId,
      project_id: config.projectId,
      subtype: expenseSubtypeMap[expense.type] ?? config.subtypeMapping.other,
      type: 'EXPENSE',
      amount: expense.amount,
      date: shiftDate,
      description: `${expense.type === 'TOLL' ? 'Peaje' : expense.type === 'GAS' ? 'Gasolina' : expense.type === 'MAINTENANCE' ? 'Mantenimiento' : 'Varios'} (${PAYMENT_METHOD_LABELS[expense.paymentMethod]})`,
    })
  }

  let gasolinaTripCreatedAt: number | null = null
  if (endKm3 != null && startKm3 != null) {
    try {
      gasolinaTripCreatedAt = await carSharingRepository.addTrip({
        userName: 'Jorge',
        initialKm: startKm3,
        finalKm: endKm3,
        clientDateStr: shiftDate,
      })
    } catch {
      console.warn('No se pudo registrar el trip en Gasolina')
    }
  }

  return {
    date: shiftDate,
    hoursWorked: data.hoursWorked ?? 0,
    startKm: startKm3,
    endKm: endKm3,
    totalKm,
    earnings: data.earnings,
    bonuses: data.bonuses,
    commissions: data.commissions,
    expenses: data.expenses,
    totalEarnings,
    totalBonuses,
    totalCommissions,
    totalExpenses,
    grossEarnings,
    pendingAmount,
    liquidEarnings,
    generatedTransactionIds: createdTxIds,
    gasolinaTripCreatedAt,
    notes: data.notes ?? null,
  } satisfies Partial<DriverShift>
}

export const driverService = {
  // ── Crear turno (registro manual) ─────────────────────────────────────────────
  async createShift(userId: string, data: ShiftInput): Promise<DriverShift> {
    const config = await driverConfigRepository.findByUserId(userId)
    if (!config) throw new Error(
      'Configuración no encontrada. Ve a /conductor/settings y configura tus cuentas primero.'
    )

    const result = await processShiftTransactions(config, data, userId)

    return driverRepository.create(result, userId)
  },

  // ── Update (re-procesar un turno ya registrado) ─────────────────────────────
  async updateShift(userId: string, id: string, data: ShiftInput): Promise<DriverShift> {
    const shift = await driverRepository.findById(id, userId)
    if (!shift) throw new Error('Turno no encontrado.')

    const config = await driverConfigRepository.findByUserId(userId)
    if (!config) throw new Error(
      'Configuración no encontrada. Ve a /conductor/settings y configura tus cuentas primero.'
    )

    // 1. Eliminar transacciones anteriores
    for (const txId of shift.generatedTransactionIds) {
      try { await transactionService.deleteWithBalance(txId, userId) } catch {}
    }

    // 2. Eliminar trip anterior en Gasolina
    if (shift.gasolinaTripCreatedAt) {
      try { await carSharingRepository.deleteTrip(shift.gasolinaTripCreatedAt) } catch {}
    }

    // 3. Reprocesar con los nuevos datos
    const result = await processShiftTransactions(config, data, userId)

    return driverRepository.update(id, {
      ...result,
    })
  },

  // ── Lecturas ─────────────────────────────────────────────────────────────────
  async getShifts(userId: string, opts?: { year?: number; month?: number }): Promise<DriverShift[]> {
    if (opts?.year != null && opts?.month != null) {
      return driverRepository.findByMonth(userId, opts.year, opts.month)
    }
    return driverRepository.findAll(userId)
  },

  async getShiftsByMonth(userId: string, year: number, month: number): Promise<DriverShift[]> {
    return driverRepository.findByMonth(userId, year, month)
  },

  async getShiftById(userId: string, id: string): Promise<DriverShift | null> {
    return driverRepository.findById(id, userId)
  },

  // ── Delete ──────────────────────────────────────────────────────────────────
  async deleteShift(userId: string, id: string): Promise<void> {
    const shift = await driverRepository.findById(id, userId)
    if (!shift) throw new Error('Turno no encontrado.')

    // 1. Eliminar transacciones generadas (reversión de balance incluida)
    for (const txId of shift.generatedTransactionIds) {
      try {
        await transactionService.deleteWithBalance(txId, userId)
      } catch {
        console.warn(`No se pudo eliminar la transacción ${txId}`)
      }
    }

    // 2. Eliminar trip en Gasolina si se registró
    if (shift.gasolinaTripCreatedAt) {
      try {
        await carSharingRepository.deleteTrip(shift.gasolinaTripCreatedAt)
      } catch {
        console.warn('No se pudo eliminar el trip de Gasolina')
      }
    }

    // 3. Eliminar el turno
    await driverRepository.delete(id)
  },

  // ── Analytics ────────────────────────────────────────────────────────────────
  async getAnalytics(userId: string, opts?: { year?: number; month?: number }): Promise<DriverAnalytics> {
    const shifts = opts?.year != null && opts?.month != null
      ? await driverRepository.findByMonth(userId, opts.year, opts.month)
      : await driverRepository.findAll(userId)

    if (shifts.length === 0) {
      const empty = { grossEarnings: 0, pendingAmount: 0, liquidEarnings: 0, totalBonuses: 0, totalCommissions: 0, totalExpenses: 0, totalHours: 0, liquidBsPerHour: 0, grossBsPerHour: 0, avgPerShift: 0, totalKm: 0, margin: 0, shiftCount: 0 }
      return {
        summary: empty,
        byApp: DRIVER_APPS.map((app) => ({ app, cash: 0, card: 0, qr: 0, bonuses: 0, commissions: 0, totalGross: 0 })),
        dailyTrend: [],
      }
    }

    // Summary
    const grossEarnings = shifts.reduce((s, sh) => s + sh.grossEarnings, 0)
    const pendingAmount = shifts.reduce((s, sh) => s + sh.pendingAmount, 0)
    const liquidEarnings = shifts.reduce((s, sh) => s + sh.liquidEarnings, 0)
    const totalBonuses = shifts.reduce((s, sh) => s + sh.totalBonuses, 0)
    const totalCommissions = shifts.reduce((s, sh) => s + sh.totalCommissions, 0)
    const totalExpenses = shifts.reduce((s, sh) => s + sh.totalExpenses, 0)
    const totalHours = shifts.reduce((s, sh) => s + (sh.hoursWorked ?? 0), 0)
    const totalKm = shifts.reduce((s, sh) => s + (sh.totalKm ?? 0), 0)
    const liquidBsPerHour = totalHours > 0 ? liquidEarnings / totalHours : 0
    const grossBsPerHour = totalHours > 0 ? grossEarnings / totalHours : 0
    const avgPerShift = shifts.length > 0 ? liquidEarnings / shifts.length : 0
    const margin = grossEarnings > 0 ? ((liquidEarnings / grossEarnings) * 100) : 0

    // Per app breakdown
    const byApp: DriverAppBreakdown[] = DRIVER_APPS.map((app) => {
      const cash = shifts.reduce((s, sh) => s + ((sh.earnings[app]?.CASH ?? 0)), 0)
      const card = shifts.reduce((s, sh) => s + ((sh.earnings[app]?.CARD ?? 0)), 0)
      const qr = shifts.reduce((s, sh) => s + ((sh.earnings[app]?.QR ?? 0)), 0)
      const bonuses = shifts.reduce((s, sh) => s + (sh.bonuses[app] ?? 0), 0)
      const commissions = shifts.reduce((s, sh) => s + (sh.commissions[app] ?? 0), 0)
      return {
        app,
        cash, card, qr,
        bonuses,
        commissions,
        totalGross: cash + card + qr + bonuses,
      }
    })

    // Daily trend (last 14 days)
    const dailyMap = new Map<string, { liquidEarnings: number; grossEarnings: number; hours: number }>()
    for (const sh of shifts) {
      const day = sh.date?.slice(0, 10)
      if (!day) continue
      const prev = dailyMap.get(day) ?? { liquidEarnings: 0, grossEarnings: 0, hours: 0 }
      dailyMap.set(day, {
        liquidEarnings: prev.liquidEarnings + (sh.liquidEarnings ?? 0),
        grossEarnings: prev.grossEarnings + (sh.grossEarnings ?? 0),
        hours: prev.hours + (sh.hoursWorked ?? 0),
      })
    }

    const dailyTrend = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, data]) => ({
        date,
        liquidBsPerHour: data.hours > 0 ? data.liquidEarnings / data.hours : 0,
        grossBsPerHour: data.hours > 0 ? data.grossEarnings / data.hours : 0,
        liquidEarnings: data.liquidEarnings,
      }))

    return {
      summary: {
        grossEarnings: grossEarnings ?? 0,
        pendingAmount: pendingAmount ?? 0,
        liquidEarnings: liquidEarnings ?? 0,
        totalBonuses: totalBonuses ?? 0,
        totalCommissions: totalCommissions ?? 0,
        totalExpenses: totalExpenses ?? 0,
        totalHours: totalHours ?? 0,
        liquidBsPerHour: liquidBsPerHour ?? 0,
        grossBsPerHour: grossBsPerHour ?? 0,
        avgPerShift: avgPerShift ?? 0,
        totalKm: totalKm ?? 0,
        margin: margin ?? 0,
        shiftCount: shifts.length,
      },
      byApp: byApp.map((a) => ({
        app: a.app,
        cash: a.cash ?? 0,
        card: a.card ?? 0,
        qr: a.qr ?? 0,
        bonuses: a.bonuses ?? 0,
        commissions: a.commissions ?? 0,
        totalGross: (a.totalGross ?? 0),
      })),
      dailyTrend: dailyTrend.map((d) => ({
        date: d.date,
        liquidBsPerHour: d.liquidBsPerHour ?? 0,
        grossBsPerHour: d.grossBsPerHour ?? 0,
        liquidEarnings: d.liquidEarnings ?? 0,
      })),
    }
  },
}
