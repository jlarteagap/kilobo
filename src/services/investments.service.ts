import { investmentsRepository } from '@/repositories/investments.repository'
import { accountsRepository } from '@/repositories/accounts.repository'
import { CreateInvestmentInput, UpdateInvestmentInput } from '@/lib/validations/investment.schema'
import { adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'
import { Investment } from '@/types/investment'

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

    // Si NO está vinculada a una transacción, se debe verificar y descontar saldo
    if (!isLinkedToTransaction && account.balance < data.amount) {
      throw new Error('Saldo insuficiente en la cuenta para esta inversión.')
    }

    const batch = adminDb.batch()
    const currency = data.currency ?? account.currency
    const payloadData = {
      ...data,
      currency,
    }

    // Usar helper del repositorio para registrar en el batch
    const { ref, payload } = investmentsRepository.createInBatch(batch, payloadData, userId)

    if (isLinkedToTransaction) {
      // Si está vinculada, actualizar la transacción para apuntar a la inversión
      batch.update(adminDb.collection('transactions').doc(data.transaction_id!), {
        investment_id: ref.id,
        updated_at: FieldValue.serverTimestamp(),
      })
    } else {
      // Si NO está vinculada, descontar el saldo de la cuenta
      batch.update(adminDb.collection('accounts').doc(data.account_id), {
        balance: FieldValue.increment(-data.amount),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()

    // Retornar el objeto inversión mapeado con su ID y timestamps adecuados
    return {
      id: ref.id,
      ...payload,
      created_at: payload.created_at.toDate(),
      updated_at: payload.updated_at.toDate(),
    } as unknown as Investment
  },

  async update(id: string, data: UpdateInvestmentInput, userId: string): Promise<Investment> {
    const investment = await investmentsRepository.findById(id, userId)
    if (!investment) throw new Error('Inversión no encontrada.')

    const batch = adminDb.batch()

    // Solo ajustar saldo si el monto cambió y la inversión no está vinculada a una transacción
    // (si está vinculada a una transacción, la transacción rige el flujo de caja)
    if (data.amount !== undefined && data.amount !== investment.amount && !investment.transaction_id) {
      const diff = data.amount - investment.amount
      batch.update(adminDb.collection('accounts').doc(investment.account_id), {
        balance: FieldValue.increment(-diff),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    // Usar helper del repositorio para actualizar en batch
    investmentsRepository.updateInBatch(batch, id, data)

    await batch.commit()

    const updated = await investmentsRepository.findById(id, userId)
    return updated!
  },

  async delete(id: string, userId: string): Promise<void> {
    const investment = await investmentsRepository.findById(id, userId)
    if (!investment) throw new Error('Inversión no encontrada.')

    const batch = adminDb.batch()

    // Usar helper del repositorio para borrar en batch
    investmentsRepository.deleteInBatch(batch, id)

    if (investment.transaction_id) {
      // Si estaba vinculada a una transacción, desvincularla
      batch.update(adminDb.collection('transactions').doc(investment.transaction_id), {
        investment_id: null,
        updated_at: FieldValue.serverTimestamp(),
      })
    } else {
      // Si NO estaba vinculada, devolver el monto al saldo de la cuenta
      batch.update(adminDb.collection('accounts').doc(investment.account_id), {
        balance: FieldValue.increment(investment.amount),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()
  },
}

