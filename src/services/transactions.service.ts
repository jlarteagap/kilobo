import { transactionsRepository } from '@/repositories/transactions.repository'
import { CreateTransactionData, Transaction } from "@/types/transaction"

export const transactionService = {
  async getTransactions(userId: string): Promise<Transaction[]> {
    return transactionsRepository.findAll(userId)
  },

  async createTransaction(data: CreateTransactionData, userId: string): Promise<Transaction> {
    return transactionsRepository.create(data, userId)
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

  async deleteTransaction(transactionId: string, userId: string): Promise<void> {
    const transaction = await transactionsRepository.findById(transactionId, userId)
    if (!transaction) {
      throw new Error('Transacción no encontrada o no autorizada.')
    }

    return transactionsRepository.delete(transactionId)
  },
}