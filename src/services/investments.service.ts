import { investmentsRepository } from '@/repositories/investments.repository'
import { accountsRepository } from '@/repositories/accounts.repository'
import { accountBalanceHistoryRepository } from '@/repositories/account-balance-history.repository'
import { CreateInvestmentInput, UpdateInvestmentInput, BuyInvestmentInput, SellInvestmentInput, SaveRecurringInput, ExecuteRecurringBuyInput } from '@/lib/validations/investment.schema'
import { adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'
import { Investment, CreateInvestmentTxData, CreateInvestmentData } from '@/types/investment'
import { format } from 'date-fns'
import { nextDueString, nextDueStringAfter, isPlanDue } from '@/features/investments/utils/recurrence.utils'

export const investmentsService = {
  async getAll(userId: string): Promise<Investment[]> {
    return investmentsRepository.findAll(userId)
  },

  async getByAccount(accountId: string, userId: string): Promise<Investment[]> {
    const account = await accountsRepository.findById(accountId, userId)
    if (!account) throw new Error('Cuenta no encontrada.')
    return investmentsRepository.findByAccount(accountId, userId)
  },

  async create(data: CreateInvestmentInput, userId: string): Promise<Investment> {
    const account = await accountsRepository.findById(data.account_id, userId)
    if (!account) throw new Error('Cuenta no encontrada.')

    const currency = data.currency ?? account.currency
    const amount = data.amount
    const isLinkedToTransaction = !!data.transaction_id

    // Si NO está vinculada a una transacción, se debe verificar y descontar saldo
    if (!isLinkedToTransaction && account.balance < amount) {
      throw new Error('Saldo insuficiente en la cuenta para esta inversión.')
    }

    const existing = await investmentsRepository.findByName(data.name, data.account_id, userId)

    const batch = adminDb.batch()

    // Si ya existe una inversión con el mismo nombre en la cuenta, se agrega
    // una compra a la posición existente en lugar de crear un duplicado.
    if (existing) {
      const txData: CreateInvestmentTxData = {
        investment_id: existing.id,
        account_id: data.account_id,
        type: 'BUY',
        amount,
        currency,
        date: data.date,
        notes: data.notes ?? null,
      }
      investmentsRepository.createTransactionInBatch(batch, txData, userId)

      if (isLinkedToTransaction) {
        batch.update(adminDb.collection('transactions').doc(data.transaction_id!), {
          investment_id: existing.id,
          updated_at: FieldValue.serverTimestamp(),
        })
      } else {
        batch.update(adminDb.collection('accounts').doc(data.account_id), {
          balance: FieldValue.increment(-amount),
          updatedAt: FieldValue.serverTimestamp(),
        })
        accountBalanceHistoryRepository.addInBatch(
          batch,
          data.account_id,
          account.balance,
          account.balance - amount,
          'INVESTMENT',
          userId
        )
      }

      await batch.commit()
      await investmentsRepository.recalculatePosition(existing.id, userId)

      const updated = await investmentsRepository.findById(existing.id, userId)
      return updated!
    }

    // Nueva inversión → crear documento + transacción BUY inicial
    const invData: CreateInvestmentData = {
      account_id: data.account_id,
      name: data.name,
      amount,
      currency,
      date: data.date,
      notes: data.notes ?? null,
      transaction_id: data.transaction_id ?? null,
    }

    const { ref } = investmentsRepository.createInBatch(batch, invData, userId)

    const txData: CreateInvestmentTxData = {
      investment_id: ref.id,
      account_id: data.account_id,
      type: 'BUY',
      amount,
      currency,
      date: data.date,
      notes: data.notes ?? null,
    }
    investmentsRepository.createTransactionInBatch(batch, txData, userId)

    if (isLinkedToTransaction) {
      batch.update(adminDb.collection('transactions').doc(data.transaction_id!), {
        investment_id: ref.id,
        updated_at: FieldValue.serverTimestamp(),
      })
    } else {
      batch.update(adminDb.collection('accounts').doc(data.account_id), {
        balance: FieldValue.increment(-amount),
        updatedAt: FieldValue.serverTimestamp(),
      })
      accountBalanceHistoryRepository.addInBatch(
        batch,
        data.account_id,
        account.balance,
        account.balance - amount,
        'INVESTMENT',
        userId
      )
    }

    await batch.commit()

    const created = await investmentsRepository.findById(ref.id, userId)
    return created!
  },

  async buy(data: BuyInvestmentInput, userId: string): Promise<void> {
    const investment = await investmentsRepository.findById(data.investment_id, userId)
    if (!investment) throw new Error('Inversión no encontrada.')

    const account = await accountsRepository.findById(data.account_id, userId)
    if (!account) throw new Error('Cuenta no encontrada.')

    const totalAmount = data.amount

    if (account.balance < totalAmount) {
      throw new Error('Saldo insuficiente en la cuenta para esta compra.')
    }

    const batch = adminDb.batch()

    investmentsRepository.createTransactionInBatch(batch, {
      ...data,
      type: 'BUY',
      notes: data.notes ?? null,
    }, userId)

    batch.update(adminDb.collection('accounts').doc(data.account_id), {
      balance: FieldValue.increment(-totalAmount),
      updatedAt: FieldValue.serverTimestamp(),
    })
    accountBalanceHistoryRepository.addInBatch(
      batch,
      data.account_id,
      account.balance,
      account.balance - totalAmount,
      'INVESTMENT',
      userId
    )

    await batch.commit()

    await investmentsRepository.recalculatePosition(data.investment_id, userId)
  },

  async sell(data: SellInvestmentInput, userId: string): Promise<void> {
    const investment = await investmentsRepository.findById(data.investment_id, userId)
    if (!investment) throw new Error('Inversión no encontrada.')

    const account = await accountsRepository.findById(data.account_id, userId)
    if (!account) throw new Error('Cuenta no encontrada.')

    const available = investment.amount
    if (available < data.amount) {
      throw new Error(`No tienes suficientes fondos invertidos. Disponibles: ${available}`)
    }

    const totalAmount = data.amount

    const batch = adminDb.batch()

    investmentsRepository.createTransactionInBatch(batch, {
      ...data,
      type: 'SELL',
      notes: data.notes ?? null,
    }, userId)

    batch.update(adminDb.collection('accounts').doc(data.account_id), {
      balance: FieldValue.increment(totalAmount),
      updatedAt: FieldValue.serverTimestamp(),
    })
    accountBalanceHistoryRepository.addInBatch(
      batch,
      data.account_id,
      account.balance,
      account.balance + totalAmount,
      'INVESTMENT',
      userId
    )

    await batch.commit()

    await investmentsRepository.recalculatePosition(data.investment_id, userId)
  },

  async getTransactions(investmentId: string, userId: string) {
    return investmentsRepository.findTransactions(investmentId, userId)
  },

  /**
   * Elimina una operación (BUY/SELL) y revierte su efecto sobre el saldo.
   * - BUY: devuelve el capital a la cuenta (excepto la compra inicial de una
   *   inversión vinculada a transacción, que nunca descontó saldo).
   * - SELL: descuenta el monto revertido del balance.
   * Rechaza operaciones que dejarían la posición en negativo o el saldo
   * insuficiente para revertir una venta.
   */
  async deleteTransaction(investmentId: string, txId: string, userId: string): Promise<void> {
    const investment = await investmentsRepository.findById(investmentId, userId)
    if (!investment) throw new Error('Inversión no encontrada.')

    const tx = await investmentsRepository.findTransaction(investmentId, txId, userId)
    if (!tx) throw new Error('Operación no encontrada.')

    // La compra inicial de una inversión vinculada a transacción nunca tocó el
    // saldo (lo movió la transacción 1:1). Heurística: coincide fecha con la alta.
    const isInitialLinked =
      !!investment.transaction_id && tx.type === 'BUY' && tx.date === investment.date

    if (tx.type === 'BUY' && investment.amount < tx.amount) {
      throw new Error('No puedes eliminar esta compra: primero reduce las ventas.')
    }

    const batch = adminDb.batch()
    investmentsRepository.deleteTransactionInBatch(batch, investmentId, txId)

    if (!isInitialLinked) {
      const account = await accountsRepository.findById(investment.account_id, userId)
      if (!account) throw new Error('Cuenta no encontrada.')

      if (tx.type === 'SELL' && account.balance < tx.amount) {
        throw new Error('Saldo insuficiente para revertir la venta.')
      }

      const delta = tx.type === 'BUY' ? tx.amount : -tx.amount
      const newBalance = account.balance + delta

      batch.update(adminDb.collection('accounts').doc(investment.account_id), {
        balance: FieldValue.increment(delta),
        updatedAt: FieldValue.serverTimestamp(),
      })
      accountBalanceHistoryRepository.addInBatch(
        batch,
        investment.account_id,
        account.balance,
        newBalance,
        'INVESTMENT',
        userId
      )
    }

    await batch.commit()

    await investmentsRepository.recalculatePosition(investmentId, userId)
  },

  // ─── Plan de compra recurrente ————————————————————————————————

  /**
   * Crea o actualiza el plan de compra recurrente de una inversión.
   */
  async saveRecurring(investmentId: string, input: SaveRecurringInput, userId: string): Promise<void> {
    const investment = await investmentsRepository.findById(investmentId, userId)
    if (!investment) throw new Error('Inversión no encontrada.')

    const today = new Date()
    const prev = investment.recurrence

    const recurrence = {
      enabled: input.enabled,
      frequency: 'WEEKLY' as const,
      day_of_week: input.day_of_week,
      amount: input.amount,
      currency: investment.currency,
      account_id: investment.account_id,
      next_due: input.enabled ? nextDueString(today, input.day_of_week) : (prev?.next_due ?? null),
      last_executed: prev?.last_executed ?? null,
    }

    await investmentsRepository.update(investmentId, { recurrence })
  },

  /** Elimina el plan recurrente de la inversión. */
  async deleteRecurring(investmentId: string, userId: string): Promise<void> {
    const investment = await investmentsRepository.findById(investmentId, userId)
    if (!investment) throw new Error('Inversión no encontrada.')
    await investmentsRepository.update(investmentId, { recurrence: null })
  },

  /**
   * Ejecuta la compra pendiente del plan recurrente.
   * Reusa buy() (descuenta saldo, crea InvestmentTransaction, recalcula posición)
   * y avanza next_due.
   */
  async executeRecurringBuy(investmentId: string, data: ExecuteRecurringBuyInput, userId: string): Promise<void> {
    const investment = await investmentsRepository.findById(investmentId, userId)
    if (!investment) throw new Error('Inversión no encontrada.')

    const plan = investment.recurrence
    if (!plan || !plan.enabled) throw new Error('La inversión no tiene un plan recurrente activo.')

    const today = new Date()
    if (!isPlanDue(plan, today)) throw new Error('No hay una compra pendiente para esta inversión.')

    await this.buy({
      investment_id: investmentId,
      account_id: plan.account_id,
      amount: plan.amount,
      currency: plan.currency,
      date: data.date ?? format(today, 'yyyy-MM-dd'),
      notes: 'Compra recurrente semanal',
    }, userId)

    await investmentsRepository.update(investmentId, {
      recurrence: {
        ...plan,
        next_due: nextDueStringAfter(today, plan.day_of_week),
        last_executed: format(today, 'yyyy-MM-dd'),
      },
    })
  },

  async update(id: string, data: UpdateInvestmentInput, userId: string): Promise<Investment> {
    const investment = await investmentsRepository.findById(id, userId)
    if (!investment) throw new Error('Inversión no encontrada.')

    const batch = adminDb.batch()

    if (data.amount !== undefined && data.amount !== investment.amount) {
      const diff = data.amount - investment.amount

      // Registra una transacción compensadora (BUY/SELL) para que
      // amount == Σ(BUY) − Σ(SELL) y recalculatePosition no borre el monto.
      if (diff < 0 && investment.amount < -diff) {
        throw new Error(`No tienes suficientes fondos invertidos. Disponibles: ${investment.amount}`)
      }
      investmentsRepository.createTransactionInBatch(batch, {
        investment_id: investment.id,
        account_id: investment.account_id,
        type: diff > 0 ? 'BUY' : 'SELL',
        amount: Math.abs(diff),
        currency: investment.currency,
        date: data.date ?? investment.date ?? format(new Date(), 'yyyy-MM-dd'),
        notes: 'Ajuste de monto',
      }, userId)

      if (!investment.transaction_id) {
        const account = await accountsRepository.findById(investment.account_id, userId)
        batch.update(adminDb.collection('accounts').doc(investment.account_id), {
          balance: FieldValue.increment(-diff),
          updatedAt: FieldValue.serverTimestamp(),
        })
        if (account) {
          accountBalanceHistoryRepository.addInBatch(
            batch,
            investment.account_id,
            account.balance,
            account.balance - diff,
            'INVESTMENT',
            userId
          )
        }
      }
    }

    investmentsRepository.updateInBatch(batch, id, data)

    await batch.commit()

    const updated = await investmentsRepository.findById(id, userId)
    return updated!
  },

  async delete(id: string, userId: string): Promise<void> {
    const investment = await investmentsRepository.findById(id, userId)
    if (!investment) throw new Error('Inversión no encontrada.')

    const batch = adminDb.batch()

    investmentsRepository.deleteInBatch(batch, id)

    if (investment.transaction_id) {
      batch.update(adminDb.collection('transactions').doc(investment.transaction_id), {
        investment_id: null,
        updated_at: FieldValue.serverTimestamp(),
      })
    } else {
      const account = await accountsRepository.findById(investment.account_id, userId)
      batch.update(adminDb.collection('accounts').doc(investment.account_id), {
        balance: FieldValue.increment(investment.amount),
        updatedAt: FieldValue.serverTimestamp(),
      })
      if (account) {
        accountBalanceHistoryRepository.addInBatch(
          batch,
          investment.account_id,
          account.balance,
          account.balance + investment.amount,
          'INVESTMENT',
          userId
        )
      }
    }

    await batch.commit()
  },
}