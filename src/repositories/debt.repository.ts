// repositories/debt.repository.ts
import { adminDb } from '@/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'
import type { Debt, CreateDebtData, DebtPayment, CreateDebtPaymentData } from '@/types/debt'

const debtsCollection    = adminDb.collection('debts')
const paymentsCollection = adminDb.collection('debt_payments')

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
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (isSerializedTimestamp(value)) {
    return new Date(value._seconds * 1000).toISOString()
  }
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

function mapDebt(id: string, data: FirebaseFirestore.DocumentData): Debt {
  return {
    ...data,
    id,
    paid_amount: data.paid_amount ?? 0,
    created_at:  toISOString(data.created_at),
    updated_at:  toISOString(data.updated_at),
  } as Debt
}

function mapPayment(id: string, data: FirebaseFirestore.DocumentData): DebtPayment {
  return {
    ...data,
    id,
    created_at: toISOString(data.created_at),
  } as DebtPayment
}

export const debtRepository = {
  // ── Debts ──────────────────────────────────────────────────────────────────
  async findAll(userId: string): Promise<Debt[]> {
    const snapshot = await debtsCollection
      .where('user_id', '==', userId)
      .get()
    const debts = snapshot.docs.map((doc) => mapDebt(doc.id, doc.data()))
    return debts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async findById(id: string, userId: string): Promise<Debt | null> {
    const doc = await debtsCollection.doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()!
    if (data.user_id !== userId) return null
    return mapDebt(doc.id, data)
  },

  // ── Debts ──────────────────────────────────────────────────────────────────
  async create(data: CreateDebtData, userId: string): Promise<Debt> {
    const payload = {
      ...data,
      paid_amount: 0,
      status:      'ACTIVE',
      user_id:     userId,
      created_at:  Timestamp.now(),
      updated_at:  Timestamp.now(),
    }
    const docRef  = await debtsCollection.add(payload)
    const created = await docRef.get()
    return mapDebt(docRef.id, created.data()!)
  },

  async update(id: string, data: Partial<Debt>): Promise<Debt> {
    const docRef = debtsCollection.doc(id)
    await docRef.update({ ...data, updated_at: Timestamp.now() })
    const updated = await docRef.get()
    return mapDebt(docRef.id, updated.data()!)
  },

  async delete(id: string): Promise<void> {
    await debtsCollection.doc(id).delete()
  },

  // ── Payments ───────────────────────────────────────────────────────────────
  async findPaymentsByDebt(debtId: string): Promise<DebtPayment[]> {
    const snapshot = await paymentsCollection
      .where('debt_id', '==', debtId)
      .get()
    const payments = snapshot.docs.map((doc) => mapPayment(doc.id, doc.data()))
    return payments.sort((a, b) => {
      const dateA = a.date || a.created_at;
      const dateB = b.date || b.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  },

  async createPayment(
    debtId: string,
    data:   CreateDebtPaymentData
  ): Promise<DebtPayment> {
    const payload = {
      ...data,
      debt_id:    debtId,
      created_at: Timestamp.now(),
    }
    const docRef  = await paymentsCollection.add(payload)
    const created = await docRef.get()
    return mapPayment(docRef.id, created.data()!)
  },
}