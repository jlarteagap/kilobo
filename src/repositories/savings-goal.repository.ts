import { adminDb } from '@/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'
import type { SavingsGoal, CreateSavingsGoalData, UpdateSavingsGoalData } from '@/types/savings-goal'

const collection = adminDb.collection('savings_goals')

interface SerializedTimestamp { _seconds: number; _nanoseconds: number }

function isSerializedTimestamp(val: unknown): val is SerializedTimestamp {
  return typeof val === 'object' && val !== null && '_seconds' in val && typeof (val as SerializedTimestamp)._seconds === 'number'
}

function toISOString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (isSerializedTimestamp(value)) return new Date(value._seconds * 1000).toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

function mapSavingsGoal(id: string, data: FirebaseFirestore.DocumentData): SavingsGoal {
  return {
    ...data,
    id,
    created_at: toISOString(data.created_at),
    updated_at: toISOString(data.updated_at),
  } as SavingsGoal
}

export const savingsGoalRepository = {
  async findAll(userId: string): Promise<SavingsGoal[]> {
    const snapshot = await collection.where('user_id', '==', userId).get()
    const goals = snapshot.docs.map(doc => mapSavingsGoal(doc.id, doc.data()))
    return goals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async findById(id: string, userId: string): Promise<SavingsGoal | null> {
    const doc = await collection.doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()!
    if (data.user_id !== userId) return null
    return mapSavingsGoal(doc.id, data)
  },

  async create(data: CreateSavingsGoalData, userId: string): Promise<SavingsGoal> {
    const now = Timestamp.now()
    const payload = {
      ...data,
      current_amount: 0,
      user_id: userId,
      is_active: true,
      created_at: now,
      updated_at: now,
    }
    const ref = await collection.add(payload)
    return mapSavingsGoal(ref.id, payload)
  },

  async update(id: string, data: UpdateSavingsGoalData): Promise<SavingsGoal> {
    await collection.doc(id).update({
      ...data,
      updated_at: Timestamp.now(),
    })
    const doc = await collection.doc(id).get()
    return mapSavingsGoal(doc.id, doc.data()!)
  },

  async delete(id: string): Promise<void> {
    await collection.doc(id).delete()
  },
}
