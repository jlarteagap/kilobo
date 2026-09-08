import { adminDb } from '@/lib/firebase.admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import type { Transaction } from '@/types/transaction'
import { convertToBOB, getExchangeRate } from '@/lib/config/exchange-rates'
import { accountBalanceHistoryRepository } from '@/repositories/account-balance-history.repository'

const accountsCol = () => adminDb.collection('accounts')

type ChangeAccount = { id: string; balance: number; currency: string }

export const balanceService = {
  applyForCreate(
    batch: FirebaseFirestore.WriteBatch,
    data: { type: string; account_id: string; to_account_id?: string | null; amount: number; currency?: string },
    accounts: ChangeAccount[],
    userId: string
  ): void {
    const source = accounts.find((a) => a.id === data.account_id)
    if (!source) return

    const now = Timestamp.now()

    if (data.type === 'INCOME') {
      const newBalance = source.balance + data.amount
      batch.update(accountsCol().doc(data.account_id), {
        balance: newBalance,
        updatedAt: now,
      })
      accountBalanceHistoryRepository.addInBatch(batch, source.id, source.balance, newBalance, 'TRANSACTION', userId)
      return
    }

    // ── Deducción de cuenta origen ─────────────────────────────────────────
    const sourceNewBalance = source.balance - data.amount
    batch.update(accountsCol().doc(data.account_id), {
      balance: sourceNewBalance,
      updatedAt: now,
    })
    accountBalanceHistoryRepository.addInBatch(batch, source.id, source.balance, sourceNewBalance, 'TRANSACTION', userId)

    if (data.type === 'TRANSFER' || data.type === 'SAVING') {
      const dest = data.to_account_id
        ? accounts.find((a) => a.id === data.to_account_id)
        : null
      if (dest) {
        // ── Conversión cross-currency ─────────────────────────────────────
        let destAmount = data.amount
        const sourceCurrency = source.currency
        const destCurrency = dest.currency

        if (sourceCurrency !== destCurrency) {
          const amountInBOB = convertToBOB(data.amount, sourceCurrency)
          destAmount = amountInBOB / getExchangeRate(destCurrency)
          // Redondear a 2 decimales y almacenar en la transacción
          destAmount = Number(destAmount.toFixed(2))
          ;(data as Record<string, unknown>).converted_amount = destAmount
          ;(data as Record<string, unknown>).to_currency = destCurrency
        }

        const destNewBalance = dest.balance + destAmount
        batch.update(accountsCol().doc(data.to_account_id!), {
          balance: destNewBalance,
          updatedAt: now,
        })
        accountBalanceHistoryRepository.addInBatch(batch, dest.id, dest.balance, destNewBalance, 'TRANSACTION', userId)
      }
    }
  },

  applyForDelete(
    batch: FirebaseFirestore.WriteBatch,
    tx: Transaction,
    accounts: ChangeAccount[],
    userId: string
  ): void {
    const source = accounts.find((a) => a.id === tx.account_id)
    if (!source) return

    const now = Timestamp.now()

    if (tx.type === 'INCOME') {
      const newBalance = source.balance - tx.amount
      batch.update(accountsCol().doc(tx.account_id), {
        balance: newBalance,
        updatedAt: now,
      })
      accountBalanceHistoryRepository.addInBatch(batch, source.id, source.balance, newBalance, 'TRANSACTION', userId)
      return
    }

    // Revertir deducción de origen
    const sourceNewBalance = source.balance + tx.amount
    batch.update(accountsCol().doc(tx.account_id), {
      balance: sourceNewBalance,
      updatedAt: now,
    })
    accountBalanceHistoryRepository.addInBatch(batch, source.id, source.balance, sourceNewBalance, 'TRANSACTION', userId)

    if (tx.to_account_id) {
      const dest = accounts.find((a) => a.id === tx.to_account_id)
      // Usar el monto convertido si existe (cross-currency)
      const destAmount = tx.converted_amount ?? tx.amount
      const destNewBalance = (dest?.balance ?? 0) - destAmount
      batch.update(accountsCol().doc(tx.to_account_id), {
        balance: FieldValue.increment(-destAmount),
        updatedAt: now,
      })
      if (dest) {
        accountBalanceHistoryRepository.addInBatch(batch, dest.id, dest.balance, destNewBalance, 'TRANSACTION', userId)
      }
    }
  },
}
