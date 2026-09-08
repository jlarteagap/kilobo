// services/debt.service.ts
import { debtRepository } from '@/repositories/debt.repository'
import { accountsRepository } from '@/repositories/accounts.repository'
import { accountBalanceHistoryRepository } from '@/repositories/account-balance-history.repository'
import { transactionService } from '@/services/transactions.service'
import { adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'
import type { CreateDebtData, CreateDebtPaymentData } from '@/types/debt'

export const debtService = {
  async getDebts(userId: string) {
    return debtRepository.findAll(userId)
  },

  async createDebt(data: CreateDebtData, userId: string) {
    const { is_legacy, date: clientDate, ...debtData } = data

    // 1. Verificar que la cuenta existe
    const account = await accountsRepository.findById(debtData.account_id, userId)
    if (!account) throw new Error('Cuenta no encontrada o no autorizada.')

    // 2. Crear la deuda (sin is_legacy ni date en el payload de Firestore)
    const debt = await debtRepository.create(debtData, userId)

    if (!is_legacy) {
      // 3. Mover balance según tipo
      //    GIVEN    → presté dinero → resta de mi cuenta
      //    RECEIVED → me prestaron  → suma a mi cuenta
      const delta = debtData.type === 'GIVEN' ? -debtData.amount : +debtData.amount
      const newBalance = account.balance + delta
      const batch = adminDb.batch()
      batch.update(adminDb.collection('accounts').doc(debtData.account_id), {
        balance: newBalance,
        updatedAt: FieldValue.serverTimestamp(),
      })
      accountBalanceHistoryRepository.addInBatch(
        batch,
        debtData.account_id,
        account.balance,
        newBalance,
        'DEBT',
        userId
      )
      await batch.commit()

      // 4. Crear transacción — usar fecha del cliente si viene, sino fecha local del servidor
      const txDate = clientDate || (() => {
        const d = new Date()
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${dd}`
      })()

      await transactionService.createTransaction({
        account_id:  debtData.account_id,
        type:        debtData.type === 'GIVEN' ? 'EXPENSE' : 'INCOME',
        amount:      debtData.amount,
        currency:    debtData.currency,
        date:        txDate,
        description: `Préstamo: ${debtData.contact_name}`,
        subtype:     'Préstamo',
        status:      'COMPLETED',
      }, userId)
    }

    return debt
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
    const newBalance = account.balance + delta
    const batch = adminDb.batch()
    batch.update(adminDb.collection('accounts').doc(data.account_id), {
      balance: newBalance,
      updatedAt: FieldValue.serverTimestamp(),
    })
    accountBalanceHistoryRepository.addInBatch(
      batch,
      data.account_id,
      account.balance,
      newBalance,
      'DEBT',
      userId
    )
    await batch.commit()

    // 5. Registrar el pago
    const payment = await debtRepository.createPayment(debtId, data)

    // 6. Actualizar paid_amount y status en la deuda
    const newPaidAmount = debt.paid_amount + data.amount
    const newStatus     = newPaidAmount >= debt.amount ? 'PAID' : 'ACTIVE'

    await debtRepository.update(debtId, {
      paid_amount: newPaidAmount,
      status:      newStatus,
    })

    // 7. Crear transacción del pago (siempre, legacy o no)
    await transactionService.createTransaction({
      account_id:  data.account_id,
      type:        debt.type === 'GIVEN' ? 'INCOME' : 'EXPENSE',
      amount:      data.amount,
      currency:    debt.currency,
      date:        data.date,
      description: `Pago de deuda - ${debt.contact_name}`,
      subtype:     'Pago de deuda',
      status:      'COMPLETED',
    }, userId)

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
      const newBalance = account.balance + reverseDelta
      const batch = adminDb.batch()
      batch.update(adminDb.collection('accounts').doc(debt.account_id), {
        balance: newBalance,
        updatedAt: FieldValue.serverTimestamp(),
      })
      accountBalanceHistoryRepository.addInBatch(
        batch,
        debt.account_id,
        account.balance,
        newBalance,
        'DEBT',
        userId
      )
      await batch.commit()
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