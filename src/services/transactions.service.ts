import { transactionsRepository, mapTransaction } from '@/repositories/transactions.repository'
import { accountsRepository } from '@/repositories/accounts.repository'
import { balanceService } from '@/services/balance.service'
import { adminDb } from '@/lib/firebase.admin'
import { CreateTransactionData, Transaction } from "@/types/transaction"

export const transactionService = {
  async getTransactions(userId: string): Promise<Transaction[]> {
    return transactionsRepository.findAll(userId)
  },

  async createTransaction(data: CreateTransactionData, userId: string): Promise<Transaction> {
    return transactionsRepository.create(data, userId)
  },

  async createWithBalance(data: CreateTransactionData, userId: string): Promise<Transaction> {
    const accounts = await accountsRepository.findAll(userId)

    const sourceAccount = accounts.find((a) => a.id === data.account_id)
    if (!sourceAccount) throw new Error('Cuenta origen no encontrada.')
    if (data.type === 'TRANSFER' || data.type === 'SAVING') {
      if (data.to_account_id && !accounts.find((a) => a.id === data.to_account_id)) {
        throw new Error('Cuenta destino no encontrada.')
      }
    }

    const enriched = { ...data, currency: data.currency ?? sourceAccount.currency }

    const batch = adminDb.batch()
    balanceService.applyForCreate(batch, enriched, accounts)
    const { ref, payload } = transactionsRepository.createInBatch(batch, enriched, userId)

    await batch.commit()

    return mapTransaction(ref.id, payload)
  },

  async updateTransaction(
    transactionId: string,
    data: Partial<CreateTransactionData>,
    userId: string
  ): Promise<Transaction> {
    const transaction = await transactionsRepository.findById(transactionId, userId)
    if (!transaction) {
      throw new Error('Transacción no encontrada o no autorizada.')
    }

    return transactionsRepository.update(transactionId, data)
  },

  async getTransaction(transactionId: string, userId: string): Promise<Transaction | null> {
    return transactionsRepository.findById(transactionId, userId)
  },

  async deleteTransaction(transactionId: string, userId: string): Promise<void> {
    const transaction = await transactionsRepository.findById(transactionId, userId)
    if (!transaction) {
      throw new Error('Transacción no encontrada o no autorizada.')
    }

    return transactionsRepository.delete(transactionId)
  },

  async deleteWithBalance(transactionId: string, userId: string): Promise<void> {
    const transaction = await transactionsRepository.findById(transactionId, userId)
    if (!transaction) {
      throw new Error('Transacción no encontrada o no autorizada.')
    }

    const batch = adminDb.batch()
    balanceService.applyForDelete(batch, transaction)
    batch.delete(adminDb.collection('transactions').doc(transactionId))

    await batch.commit()
  },
}
