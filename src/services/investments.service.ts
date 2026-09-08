import { investmentsRepository } from '@/repositories/investments.repository'
import { accountsRepository } from '@/repositories/accounts.repository'
import { accountBalanceHistoryRepository } from '@/repositories/account-balance-history.repository'
import { CreateInvestmentInput, UpdateInvestmentInput, BuyInvestmentInput, SellInvestmentInput, SaveRecurringInput, ExecuteRecurringBuyInput } from '@/lib/validations/investment.schema'
import { adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'
import { Investment, CreateInvestmentTxData } from '@/types/investment'
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

    const isLinkedToTransaction = !!data.transaction_id
    const hasUnits = !!data.units && !!data.unit_price

    const amount = hasUnits
      ? data.units! * data.unit_price!
      : data.amount

    // Si NO está vinculada a una transacción, se debe verificar y descontar saldo
    if (!isLinkedToTransaction && account.balance < amount) {
      throw new Error('Saldo insuficiente en la cuenta para esta inversión.')
    }

    const batch = adminDb.batch()
    const currency = data.currency ?? account.currency

    // Si tiene units, crear una transacción BUY automática
    if (hasUnits && !isLinkedToTransaction) {
      const txData: CreateInvestmentTxData = {
        investment_id: '', // se asigna después de crear el ref
        account_id: data.account_id,
        type: 'BUY',
        units: data.units!,
        unit_price: data.unit_price!,
        currency,
        date: data.date,
        notes: data.notes ?? null,
      }

      const invData = {
        account_id: data.account_id,
        name: data.name,
        amount: amount,
        units: data.units!,
        unit_price: data.unit_price!,
        currency,
        date: data.date,
        notes: data.notes ?? null,
        transaction_id: data.transaction_id ?? null,
      }

      const { ref, payload } = investmentsRepository.createInBatch(batch, invData, userId)

      txData.investment_id = ref.id
      investmentsRepository.createTransactionInBatch(batch, txData, userId)

      // Descontar saldo
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

      await batch.commit()

      return {
        id: ref.id,
        ...payload,
        created_at: payload.created_at.toDate(),
        updated_at: payload.updated_at.toDate(),
      } as unknown as Investment
    }

    // Flujo legacy (sin units)
    const payloadData = {
      ...data,
      currency,
      amount: data.amount,
      units: null,
      unit_price: null,
    }

    const { ref, payload } = investmentsRepository.createInBatch(batch, payloadData, userId)

    if (isLinkedToTransaction) {
      batch.update(adminDb.collection('transactions').doc(data.transaction_id!), {
        investment_id: ref.id,
        updated_at: FieldValue.serverTimestamp(),
      })
    } else {
      batch.update(adminDb.collection('accounts').doc(data.account_id), {
        balance: FieldValue.increment(-data.amount),
        updatedAt: FieldValue.serverTimestamp(),
      })
      accountBalanceHistoryRepository.addInBatch(
        batch,
        data.account_id,
        account.balance,
        account.balance - data.amount,
        'INVESTMENT',
        userId
      )
    }

    await batch.commit()

    return {
      id: ref.id,
      ...payload,
      created_at: payload.created_at.toDate(),
      updated_at: payload.updated_at.toDate(),
    } as unknown as Investment
  },

  async buy(data: BuyInvestmentInput, userId: string): Promise<void> {
    const investment = await investmentsRepository.findById(data.investment_id, userId)
    if (!investment) throw new Error('Inversión no encontrada.')

    const account = await accountsRepository.findById(data.account_id, userId)
    if (!account) throw new Error('Cuenta no encontrada.')

    const totalAmount = data.units * data.unit_price

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

    const currentUnits = investment.units ?? 0
    if (currentUnits < data.units) {
      throw new Error(`No tienes suficientes unidades. Disponibles: ${currentUnits}`)
    }

    const totalAmount = data.units * data.unit_price

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

  // ─── Plan de compra recurrente ————————————————————————————————

  /**
   * Crea o actualiza el plan de compra recurrente de una inversión.
   * Se requiere que la inversión tenga posición (units) para programar.
   */
  async saveRecurring(investmentId: string, input: SaveRecurringInput, userId: string): Promise<void> {
    const investment = await investmentsRepository.findById(investmentId, userId)
    if (!investment) throw new Error('Inversión no encontrada.')
    if (!investment.units || !investment.unit_price) {
      throw new Error('La inversión necesita tener unidades (posición) para programar compras.')
    }

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
   * Valida plan activo y vencido, calcula units = monto / precio, reusa buy()
   * (descuenta saldo, crea InvestmentTransaction, recalcula posición) y avanza next_due.
   */
  async executeRecurringBuy(investmentId: string, data: ExecuteRecurringBuyInput, userId: string): Promise<void> {
    const investment = await investmentsRepository.findById(investmentId, userId)
    if (!investment) throw new Error('Inversión no encontrada.')

    const plan = investment.recurrence
    if (!plan || !plan.enabled) throw new Error('La inversión no tiene un plan recurrente activo.')

    const today = new Date()
    if (!isPlanDue(plan, today)) throw new Error('No hay una compra pendiente para esta inversión.')

    const units = plan.amount / data.unit_price
    if (!(units > 0)) throw new Error('El precio debe ser menor al monto para comprar unidades.')

    await this.buy({
      investment_id: investmentId,
      account_id: plan.account_id,
      units,
      unit_price: data.unit_price,
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

    if (data.amount !== undefined && data.amount !== investment.amount && !investment.transaction_id) {
      const diff = data.amount - investment.amount
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
