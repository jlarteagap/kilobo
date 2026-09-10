// src/repositories/account-balance-history.repository.ts
import { Timestamp, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase.admin'
import { AccountBalanceChangeData, AccountBalanceChange, BalanceChangeSource } from '@/types/account'

const changesCol = () => adminDb.collection('account_balance_changes')

// Normaliza el documento de un cambio a la forma tipada que consume el API,
// convirtiendo cualquier representación de timestamp a una Date.
function mapChangeDoc(doc: QueryDocumentSnapshot): AccountBalanceChange {
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
}

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

    return mapChangeDoc(doc)
  },

  // Devuelve los `limit` cambios más recientes de una cuenta (newest-first).
  // Usado por el historial reciente del diálogo de la tarjeta.
  async listRecent(
    accountId: string,
    userId: string,
    limit: number
  ): Promise<AccountBalanceChange[]> {
    const snapshot = await changesCol()
      .where('user_id', '==', userId)
      .where('account_id', '==', accountId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    return snapshot.docs.map(mapChangeDoc)
  },

  // Fallback del ancla cuando la cuenta no tiene ningún cambio anterior al inicio
  // del periodo (ej. hoy es su primer día de actividad y aún no hay ancla sembrada).
  // Reconstruye el balance de apertura del día: balance actual − Σ deltas del día.
  // Con el índice (user_id, account_id, createdAt DESC) ya desplegado consume solo
  // los cambios de hoy (newest-first) y revierte sus deltas.
  async findDayOpening(
    accountId: string,
    userId: string,
    from: Date
  ): Promise<AccountBalanceChange | null> {
    const snapshot = await changesCol()
      .where('user_id', '==', userId)
      .where('account_id', '==', accountId)
      .where('createdAt', '>=', from)
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get()

    if (snapshot.empty) return null

    const changes = snapshot.docs.map(mapChangeDoc)
    const sumDelta = changes.reduce((sum, change) => sum + change.delta, 0)
    const latest = changes[0]
    const earliest = changes[changes.length - 1]
    const openingBalance = latest.new_balance - sumDelta

    // Pseudo-ancla: su updated/new_balance es el balance de apertura del día,
    // así el cliente calcula delta = balance actual − apertura (= Σ deltas del día).
    return {
      id: earliest.id,
      user_id: userId,
      account_id: accountId,
      previous_balance: openingBalance,
      new_balance: openingBalance,
      delta: 0,
      source: earliest.source,
      createdAt: earliest.createdAt,
    }
  },
}
