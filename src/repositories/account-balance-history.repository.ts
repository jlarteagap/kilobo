// src/repositories/account-balance-history.repository.ts
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase.admin'
import { AccountBalanceChangeData, AccountBalanceChange, BalanceChangeSource } from '@/types/account'

const changesCol = () => adminDb.collection('account_balance_changes')

// Helper central: calcula el delta y normaliza un cambio de balance a persistir.
// Permite registrar el cambio en un batch (atomicidad) desde cualquier origen.
export function createBalanceChangeData(
  accountId: string,
  previousBalance: number,
  newBalance: number,
  source: BalanceChangeSource,
  userId: string
): { change: AccountBalanceChangeData; delta: number } {
  const delta = newBalance - previousBalance
  return {
    change: {
      user_id: userId,
      account_id: accountId,
      previous_balance: previousBalance,
      new_balance: newBalance,
      delta,
      source,
    },
    delta,
  }
}

export const accountBalanceHistoryRepository = {
  // Agrega un registro de cambio dentro de un batch (ideal para operaciones atómicas)
  addInBatch(
    batch: FirebaseFirestore.WriteBatch,
    accountId: string,
    previousBalance: number,
    newBalance: number,
    source: BalanceChangeSource,
    userId: string
  ): void {
    const { change } = createBalanceChangeData(
      accountId,
      previousBalance,
      newBalance,
      source,
      userId
    )
    const ref = changesCol().doc()
    batch.set(ref, {
      ...change,
      createdAt: Timestamp.now(),
    })
  },

  // Devuelve el cambio de fecha más reciente estrictamente anterior a `before`
  // (ancla de la variación diaria: su new_balance es el balance al cierre del día
  // anterior al límite del periodo). O null si no hay ninguno.
  async findLastBefore(
    accountId: string,
    userId: string,
    before: Date
  ): Promise<AccountBalanceChange | null> {
    const snapshot = await changesCol()
      .where('user_id', '==', userId)
      .where('account_id', '==', accountId)
      .where('createdAt', '<', before)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get()

    const doc = snapshot.docs[0]
    if (!doc) return null

    const data = doc.data()
    const ts = data.createdAt instanceof Timestamp
      ? data.createdAt
      : typeof data.createdAt === 'object' && data.createdAt?.seconds
        ? new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds ?? 0)
        : null

    return {
      id: doc.id,
      user_id: data.user_id,
      account_id: data.account_id,
      previous_balance: data.previous_balance,
      new_balance: data.new_balance,
      delta: data.delta,
      source: data.source,
      createdAt: ts ? ts.toDate() : new Date(),
    }
  },
}
