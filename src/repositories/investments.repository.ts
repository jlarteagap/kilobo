import { adminDb } from '@/lib/firebase.admin'
import { Investment, CreateInvestmentData, UpdateInvestmentData } from '@/types/investment'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'

const collection = adminDb.collection('investments')

function mapInvestment(id: string, data: FirebaseFirestore.DocumentData): Investment {
  return { id, ...data } as unknown as Investment
}

function buildPayload(data: CreateInvestmentData, userId: string) {
  const now = Timestamp.now()
  return {
    ...data,
    user_id: userId,
    currency: data.currency ?? 'BOB',
    notes: data.notes ?? null,
    transaction_id: data.transaction_id ?? null,
    created_at: now,
    updated_at: now,
  }
}

export const investmentsRepository = {
  async findAll(userId: string): Promise<Investment[]> {
    const snapshot = await collection
      .where('user_id', '==', userId)
      .orderBy('date', 'desc')
      .get()

    return snapshot.docs.map((doc) => mapInvestment(doc.id, doc.data()))
  },

  async findByAccount(accountId: string, userId: string): Promise<Investment[]> {
    const snapshot = await collection
      .where('account_id', '==', accountId)
      .where('user_id', '==', userId)
      .orderBy('date', 'desc')
      .get()

    return snapshot.docs.map((doc) => mapInvestment(doc.id, doc.data()))
  },

  async findById(id: string, userId: string): Promise<Investment | null> {
    const doc = await collection.doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()!
    if (data.user_id !== userId) return null
    return mapInvestment(doc.id, data)
  },

  async create(data: CreateInvestmentData, userId: string): Promise<Investment> {
    const payload = buildPayload(data, userId)
    const ref = await collection.add(payload)
    return mapInvestment(ref.id, payload)
  },

  createInBatch(
    batch: FirebaseFirestore.WriteBatch,
    data: CreateInvestmentData,
    userId: string
  ): { ref: FirebaseFirestore.DocumentReference; payload: ReturnType<typeof buildPayload> } {
    const payload = buildPayload(data, userId)
    const ref = collection.doc()
    batch.set(ref, payload)
    return { ref, payload }
  },

  updateInBatch(
    batch: FirebaseFirestore.WriteBatch,
    id: string,
    data: UpdateInvestmentData
  ): void {
    batch.update(collection.doc(id), {
      ...data,
      updated_at: FieldValue.serverTimestamp(),
    })
  },

  deleteInBatch(
    batch: FirebaseFirestore.WriteBatch,
    id: string
  ): void {
    batch.delete(collection.doc(id))
  },

  async update(id: string, data: UpdateInvestmentData): Promise<Investment> {
    await collection.doc(id).update({
      ...data,
      updated_at: FieldValue.serverTimestamp(),
    })
    const doc = await collection.doc(id).get()
    return mapInvestment(doc.id, doc.data()!)
  },

  async delete(id: string): Promise<void> {
    await collection.doc(id).delete()
  },
}

