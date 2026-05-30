// repositories/transaction.repository.ts
import { adminDb } from '@/lib/firebase.admin'
import { Transaction, CreateTransactionData } from '@/types/transaction'
import { Timestamp } from 'firebase-admin/firestore'

const transactionsCollection = adminDb.collection('transactions')

interface SerializedTimestamp { _seconds: number; _nanoseconds: number }

function isSerializedTimestamp(val: unknown): val is SerializedTimestamp {
  return (
    typeof val === 'object' &&
    val !== null &&
    '_seconds' in val &&
    typeof (val as SerializedTimestamp)._seconds === 'number'
  )
}

function toISOString(value: unknown): string {
  if (!value) return new Date().toISOString()

  // Firestore Timestamp — objeto con seconds y nanoseconds
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  // Timestamp plano — cuando llega serializado desde Firestore Admin
  if (isSerializedTimestamp(value)) {
    return new Date(value._seconds * 1000).toISOString()
  }

  // Ya es string ISO — documentos viejos
  if (typeof value === 'string') return value

  // Date nativo
  if (value instanceof Date) return value.toISOString()

  return new Date().toISOString()
}

// ─── Mapper: doc de Firestore → Transaction tipada ────────────────────────────
export function mapTransaction(id: string, data: FirebaseFirestore.DocumentData): Transaction {
  return {
    ...data,
    id,
    created_at: toISOString(data.created_at),
    updated_at: toISOString(data.updated_at),
    // Normalizar date — siempre "yyyy-MM-dd"
    date: typeof data.date === 'string'
      ? data.date.split('T')[0]   // por si acaso viene con hora
      : toISOString(data.date).split('T')[0],
  } as Transaction
}

function buildPayload(data: CreateTransactionData, userId: string) {
  const now = Timestamp.now()
  return {
    ...data,
    status:     data.status ?? 'COMPLETED',
    user_id:    userId,
    created_at: now,
    updated_at: now,
  }
}

export const transactionsRepository = {
  async findAll(userId: string): Promise<Transaction[]> {
    const snapshot = await transactionsCollection
      .where('user_id', '==', userId)
      .get()

    const transactions = snapshot.docs.map((doc) => mapTransaction(doc.id, doc.data()))
    
    return transactions.sort((a, b) => b.date.localeCompare(a.date));
  },

  async findById(transactionId: string, userId: string): Promise<Transaction | null> {
    const doc = await transactionsCollection.doc(transactionId).get()
    if (!doc.exists) return null
    const data = doc.data()!
    if (data.user_id !== userId) return null
    return mapTransaction(doc.id, data)
  },

  async create(data: CreateTransactionData, userId: string): Promise<Transaction> {
    const payload = buildPayload(data, userId)
    const docRef = await transactionsCollection.add(payload)
    return mapTransaction(docRef.id, payload)
  },

  createInBatch(
    batch: FirebaseFirestore.WriteBatch,
    data: CreateTransactionData,
    userId: string
  ): { ref: FirebaseFirestore.DocumentReference; payload: ReturnType<typeof buildPayload> } {
    const payload = buildPayload(data, userId)
    const ref = transactionsCollection.doc()
    batch.set(ref, payload)
    return { ref, payload }
  },

  async update(
    transactionId: string,
    data: Partial<CreateTransactionData>
  ): Promise<Transaction> {
    const docRef = transactionsCollection.doc(transactionId)

    await docRef.update({
      ...data,
      updated_at: Timestamp.now(),
    })

    const updated = await docRef.get()
    return mapTransaction(docRef.id, updated.data()!)
  },

  async delete(transactionId: string): Promise<void> {
    // Note: The service layer should pre-verify ownership using findById
    await transactionsCollection.doc(transactionId).delete()
  },
}