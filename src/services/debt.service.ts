// services/debt.service.ts
import { debtRepository } from '@/repositories/debt.repository'
import { accountsRepository } from '@/repositories/accounts.repository'
import type { CreateDebtData, CreateDebtPaymentData } from '@/types/debt'

export const debtService = {
  async getDebts(userId: string) {
    return debtRepository.findAll(userId)
  },

  async createDebt(data: CreateDebtData, userId: string) {
    // 1. Verificar que la cuenta existe
    const account = await accountsRepository.findById(data.account_id, userId)
    if (!account) throw new Error('Cuenta no encontrada o no autorizada.')

    // 2. Mover balance según tipo
    //    GIVEN    → presté dinero → resta de mi cuenta
    //    RECEIVED → me prestaron  → suma a mi cuenta
    const delta = data.type === 'GIVEN' ? -data.amount : +data.amount
    await accountsRepository.update(data.account_id, {
      balance: account.balance + delta,
    })

    // 3. Crear la deuda
    return debtRepository.create(data, userId)
  },

  async registerPayment(debtId: string, data: CreateDebtPaymentData, userId: string) {
    // 1. Verificar deuda
    const debt = await debtRepository.findById(debtId, userId)
    if (!debt) throw new Error('Deuda no encontrada o no autorizada.')
    if (debt.status === 'PAID') throw new Error('La deuda ya está pagada.')

    // 2. Verificar cuenta
    const account = await accountsRepository.findById(data.account_id, userId)
    if (!account) throw new Error('Cuenta no encontrada o no autorizada.')

    // 3. Validar que el pago no supere el saldo pendiente
    const pending = debt.amount - debt.paid_amount
    if (data.amount > pending) {
      throw new Error(`El pago supera el saldo pendiente de ${pending}.`)
    }

    // 4. Mover balance según tipo de deuda
    //    GIVEN    → me están pagando → suma a mi cuenta
    //    RECEIVED → estoy pagando    → resta de mi cuenta
    const delta = debt.type === 'GIVEN' ? +data.amount : -data.amount
    await accountsRepository.update(data.account_id, {
      balance: account.balance + delta,
    })

    // 5. Registrar el pago
    const payment = await debtRepository.createPayment(debtId, data)

    // 6. Actualizar paid_amount y status en la deuda
    const newPaidAmount = debt.paid_amount + data.amount
    const newStatus     = newPaidAmount >= debt.amount ? 'PAID' : 'ACTIVE'

    await debtRepository.update(debtId, {
      paid_amount: newPaidAmount,
      status:      newStatus,
    })

    return payment
  },

  async cancelDebt(debtId: string, userId: string) {
    const debt = await debtRepository.findById(debtId, userId)
    if (!debt) throw new Error('Deuda no encontrada o no autorizada.')
    if (debt.status === 'PAID') throw new Error('La deuda ya está pagada.')

    // Revertir el balance original si no hay pagos parciales
    const account = await accountsRepository.findById(debt.account_id, userId)
    if (account) {
      const reverseDelta = debt.type === 'GIVEN'
        ? +(debt.amount - debt.paid_amount)   // devolver lo no cobrado
        : -(debt.amount - debt.paid_amount)   // devolver lo no pagado
      await accountsRepository.update(debt.account_id, {
        balance: account.balance + reverseDelta,
      })
    }

    return debtRepository.update(debtId, { status: 'CANCELLED' })
  },

  async deleteDebt(debtId: string, userId: string) {
    const debt = await debtRepository.findById(debtId, userId)
    if (!debt) throw new Error('Deuda no encontrada o no autorizada.')
    if (debt.status === 'ACTIVE') {
      throw new Error('No puedes eliminar una deuda activa. Cancélala primero.')
    }
    return debtRepository.delete(debtId)
  },
}