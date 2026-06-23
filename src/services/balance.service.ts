import { adminDb } from '@/lib/firebase.admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import type { Transaction } from '@/types/transaction'
import { convertToBOB, getExchangeRate } from '@/lib/config/exchange-rates'

const accountsCol = () => adminDb.collection('accounts')

export const balanceService = {
  applyForCreate(
    batch: FirebaseFirestore.WriteBatch,
    data: { type: string; account_id: string; to_account_id?: string | null; amount: number; currency?: string },
    accounts: { id: string; balance: number; currency: string }[]
  ): void {
    const source = accounts.find((a) => a.id === data.account_id)
    if (!source) return

    const now = Timestamp.now()

    if (data.type === 'INCOME') {
      batch.update(accountsCol().doc(data.account_id), {
        balance: source.balance + data.amount,
        updatedAt: now,
      })
      return
    }

    // ── Deducción de cuenta origen ─────────────────────────────────────────
    batch.update(accountsCol().doc(data.account_id), {
      balance: source.balance - data.amount,
      updatedAt: now,
    })

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

        batch.update(accountsCol().doc(data.to_account_id!), {
          balance: dest.balance + destAmount,
          updatedAt: now,
        })
      }
    }
  },

  applyForDelete(
    batch: FirebaseFirestore.WriteBatch,
    tx: Transaction
  ): void {
    const now = Timestamp.now()

    if (tx.type === 'INCOME') {
      batch.update(accountsCol().doc(tx.account_id), {
        balance: FieldValue.increment(-tx.amount),
        updatedAt: now,
      })
      return
    }

    // Revertir deducción de origen
    batch.update(accountsCol().doc(tx.account_id), {
      balance: FieldValue.increment(tx.amount),
      updatedAt: now,
    })

    if (tx.to_account_id) {
      // Usar el monto convertido si existe (cross-currency)
      const destAmount = tx.converted_amount ?? tx.amount
      batch.update(accountsCol().doc(tx.to_account_id), {
        balance: FieldValue.increment(-destAmount),
        updatedAt: now,
      })
    }
  },
}
