// src/services/driver-deposit.service.ts
import { driverDepositRepository } from '@/repositories/driver-deposit.repository'
import { driverRepository } from '@/repositories/driver.repository'
import {
  DriverDeposit,
  DepositInput,
  DriverDepositReconciliation,
  DRIVER_APPS,
} from '@/types/driver'

export const driverDepositService = {
  // ── Lecturas ─────────────────────────────────────────────────────────────────
  async getDeposits(userId: string, opts?: { year?: number; month?: number; limit?: number }): Promise<DriverDeposit[]> {
    return driverDepositRepository.findAllByUser(userId, opts)
  },

  async getReconciliation(userId: string): Promise<DriverDepositReconciliation[]> {
    const [deposits, shifts] = await Promise.all([
      driverDepositRepository.findAllByUser(userId),
      driverRepository.findByDateRange(userId, '1900-01-01', '2100-01-01'),
    ])

    return DRIVER_APPS.map((app) => {
      const deposited = deposits
        .filter((d) => d.app === app)
        .reduce((s, d) => s + d.grossAmount, 0)
      const pending = shifts.reduce(
        (s, sh) => s + ((sh.earnings?.[app]?.CARD ?? 0) + (sh.bonuses?.[app] ?? 0)),
        0,
      )
      return { app, deposited, pending, difference: deposited - pending }
    }).filter((r) => r.deposited > 0 || r.pending > 0)
  },

  // ── Escrituras con guarda de propiedad ───────────────────────────────────────
  async createDeposit(userId: string, data: DepositInput): Promise<DriverDeposit> {
    const netAmount = data.grossAmount - data.commission
    return driverDepositRepository.create({ ...data, netAmount }, userId)
  },

  async updateDeposit(userId: string, id: string, data: DepositInput): Promise<DriverDeposit> {
    const existing = await driverDepositRepository.findById(id, userId)
    if (!existing) throw new Error('Depósito no encontrado.')

    const netAmount = data.grossAmount - data.commission
    return driverDepositRepository.update(id, { ...data, netAmount })
  },

  async deleteDeposit(userId: string, id: string): Promise<void> {
    const existing = await driverDepositRepository.findById(id, userId)
    if (!existing) throw new Error('Depósito no encontrado.')

    await driverDepositRepository.delete(id)
  },
}