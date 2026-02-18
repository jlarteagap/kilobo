import { transactionsRepository } from '@/repositories/transactions.repository'
import { CreateTransactionData, Transaction } from "@/types/transaction"

export const transactionService = {
  async getTransactions(): Promise<Transaction[]> {
    return transactionsRepository.findAll()
  },

  async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    return transactionsRepository.create(data)
  },

  async updateTransaction(
    transactionId: string,
    data: Partial<CreateTransactionData>
  ): Promise<Transaction> {
    const transaction = await transactionsRepository.findById(transactionId)
    if (!transaction) {
      throw new Error('Transacción no encontrada.')
    }

    return transactionsRepository.update(transactionId, data)
  },

  async deleteTransaction(transactionId: string): Promise<void> {
    const transaction = await transactionsRepository.findById(transactionId)
    if (!transaction) {
      throw new Error('Transacción no encontrada.')
    }

    return transactionsRepository.delete(transactionId)
  },
}