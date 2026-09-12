// src/repositories/driver-deposit.repository.ts
import { adminDb } from '@/lib/firebase.admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { DriverDeposit, DepositInput, DRIVER_APPS } from '@/types/driver'

const depositsCollection = adminDb.collection('driver_deposits')

function normalizeDeposit(data: Record<string, unknown>): DriverDeposit {
  return {
    id: data.id as string,
    user_id: (data.user_id as string) ?? '',
    app: DRIVER_APPS.includes(data.app as DriverDeposit['app']) ? (data.app as DriverDeposit['app']) : 'UBER',
    date: (data.date as string) ?? '',
    grossAmount: typeof data.grossAmount === 'number' ? (data.grossAmount as number) : 0,
    commission: typeof data.commission === 'number' ? (data.commission as number) : 0,
    netAmount: typeof data.netAmount === 'number' ? (data.netAmount as number) : 0,
    notes: (data.notes as string | null) ?? null,
    createdAt: (data.createdAt as string) ?? '',
    updatedAt: (data.updatedAt as string) ?? '',
  }
}

function monthBounds(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const to = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
  return { from, to }
}

export const driverDepositRepository = {
  async findAllByUser(userId: string, opts?: { year?: number; month?: number; limit?: number }): Promise<DriverDeposit[]> {
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = depositsCollection
      .where('user_id', '==', userId)

    if (opts?.year != null && opts?.month != null) {
      const { from, to } = monthBounds(opts.year, opts.month)
      query = query.where('date', '>=', from).where('date', '<', to)
    }

    query = query.orderBy('date', 'desc')

    if (opts?.limit != null) {
      query = query.limit(Math.min(opts.limit, 200))
    } else {
      query = query.limit(200)
    }

    const snapshot = await query.get()
    return snapshot.docs.map((doc) => normalizeDeposit({ ...doc.data(), id: doc.id }))
  },

  async findById(id: string, userId: string): Promise<DriverDeposit | null> {
    const doc = await depositsCollection.doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()
    if (!data || data.user_id !== userId) return null
    return normalizeDeposit({ id: doc.id, ...data })
  },

  async create(data: DepositInput & { netAmount: number }, userId: string): Promise<DriverDeposit> {
    const now = Timestamp.now()
    const payload = {
      user_id: userId,
      app: data.app,
      date: data.date,
      grossAmount: data.grossAmount,
      commission: data.commission,
      netAmount: data.netAmount,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await depositsCollection.add(payload)
    return normalizeDeposit({ id: docRef.id, ...payload })
  },

  async update(id: string, data: Partial<Omit<DriverDeposit, 'id' | 'user_id' | 'createdAt'>>): Promise<DriverDeposit> {
    const docRef = depositsCollection.doc(id)
    await docRef.update({ ...data, updatedAt: FieldValue.serverTimestamp() })
    const doc = await docRef.get()
    return normalizeDeposit({ id: docRef.id, ...doc.data() })
  },

  async delete(id: string): Promise<void> {
    await depositsCollection.doc(id).delete()
  },
}