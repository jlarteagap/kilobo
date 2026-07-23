import { investmentsRepository } from '@/repositories/investments.repository'
import { accountsRepository } from '@/repositories/accounts.repository'
import { CreateInvestmentInput, UpdateInvestmentInput, BuyInvestmentInput, SellInvestmentInput } from '@/lib/validations/investment.schema'
import { adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'
import { Investment, CreateInvestmentTxData } from '@/types/investment'

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

    await batch.commit()

    await investmentsRepository.recalculatePosition(data.investment_id, userId)
  },

  async getTransactions(investmentId: string, userId: string) {
    return investmentsRepository.findTransactions(investmentId, userId)
  },

  async update(id: string, data: UpdateInvestmentInput, userId: string): Promise<Investment> {
    const investment = await investmentsRepository.findById(id, userId)
    if (!investment) throw new Error('Inversión no encontrada.')

    const batch = adminDb.batch()

    if (data.amount !== undefined && data.amount !== investment.amount && !investment.transaction_id) {
      const diff = data.amount - investment.amount
      batch.update(adminDb.collection('accounts').doc(investment.account_id), {
        balance: FieldValue.increment(-diff),
        updatedAt: FieldValue.serverTimestamp(),
      })
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
      batch.update(adminDb.collection('accounts').doc(investment.account_id), {
        balance: FieldValue.increment(investment.amount),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()
  },
}
