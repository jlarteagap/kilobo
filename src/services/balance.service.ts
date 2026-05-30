import { adminDb } from '@/lib/firebase.admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import type { Transaction } from '@/types/transaction'

const accountsCol = () => adminDb.collection('accounts')

export const balanceService = {
  applyForCreate(
    batch: FirebaseFirestore.WriteBatch,
    data: { type: string; account_id: string; to_account_id?: string | null; amount: number },
    accounts: { id: string; balance: number }[]
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

    batch.update(accountsCol().doc(data.account_id), {
      balance: source.balance - data.amount,
      updatedAt: now,
    })

    if (data.type === 'TRANSFER' || data.type === 'SAVING') {
      const dest = data.to_account_id
        ? accounts.find((a) => a.id === data.to_account_id)
        : null
      if (dest) {
        batch.update(accountsCol().doc(data.to_account_id!), {
          balance: dest.balance + data.amount,
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

    batch.update(accountsCol().doc(tx.account_id), {
      balance: FieldValue.increment(tx.amount),
      updatedAt: now,
    })

    if (tx.to_account_id) {
      batch.update(accountsCol().doc(tx.to_account_id), {
        balance: FieldValue.increment(-tx.amount),
        updatedAt: now,
      })
    }
  },
}
