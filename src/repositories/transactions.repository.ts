// repositories/transaction.repository.ts
import { adminDb } from '@/lib/firebase.admin'
import { Transaction, CreateTransactionData } from '@/types/transaction'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

const transactionsCollection = adminDb.collection('transactions')

// ─── Helper: convierte cualquier formato de fecha a string ISO ────────────────
function toISOString(value: unknown): string {
  if (!value) return new Date().toISOString()

  // Firestore Timestamp — objeto con seconds y nanoseconds
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  // Timestamp plano — cuando llega serializado desde Firestore Admin
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    return new Date((value as any)._seconds * 1000).toISOString()
  }

  // Ya es string ISO — documentos viejos
  if (typeof value === 'string') return value

  // Date nativo
  if (value instanceof Date) return value.toISOString()

  return new Date().toISOString()
}

// ─── Mapper: doc de Firestore → Transaction tipada ────────────────────────────
function mapTransaction(id: string, data: FirebaseFirestore.DocumentData): Transaction {
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
    const payload = {
      ...data,
      status:     data.status     ?? 'COMPLETED',
      user_id:    userId,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    }

    const docRef  = await transactionsCollection.add(payload)
    const created = await docRef.get()
    return mapTransaction(docRef.id, created.data()!)
  },

  async update(
    transactionId: string,
    data: Partial<CreateTransactionData>,
    userId: string
  ): Promise<Transaction> {
    const docRef = transactionsCollection.doc(transactionId)

    await docRef.update({
      ...data,
      updated_at: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    return mapTransaction(docRef.id, updated.data()!)
  },

  async delete(transactionId: string, userId: string): Promise<void> {
    // Note: The service layer should pre-verify ownership using findById
    await transactionsCollection.doc(transactionId).delete()
  },
}