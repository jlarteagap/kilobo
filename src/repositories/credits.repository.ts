import { adminDb } from '@/lib/firebase.admin'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import type { Credit, CreateCreditData, Installment, PayInstallmentsData } from '@/types/credit'

const creditsCollection = adminDb.collection('credits')

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

function mapCredit(id: string, data: FirebaseFirestore.DocumentData): Credit {
  return {
    ...data,
    id,
    paid_installments: data.paid_installments ?? 0,
    disburse_recorded: data.disburse_recorded ?? false,
    created_at: toISOString(data.created_at),
    updated_at: toISOString(data.updated_at),
  } as Credit
}

function mapInstallment(id: string, data: FirebaseFirestore.DocumentData): Installment {
  return {
    ...data,
    id,
    created_at: toISOString(data.created_at),
  } as Installment
}

function installmentsSub(creditId: string) {
  return creditsCollection.doc(creditId).collection('installments')
}

export const creditsRepository = {
  // ── CRUD ────────────────────────────────────────────────────────────────────
  async findAll(userId: string): Promise<Credit[]> {
    const snapshot = await creditsCollection
      .where('user_id', '==', userId)
      .get()
    const credits = snapshot.docs.map((doc) => mapCredit(doc.id, doc.data()))
    return credits.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async findById(id: string, userId: string): Promise<Credit | null> {
    const doc = await creditsCollection.doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()!
    if (data.user_id !== userId) return null
    return mapCredit(doc.id, data)
  },

  async create(data: CreateCreditData, userId: string): Promise<Credit> {
    const now = Timestamp.now()
    const payload = {
      ...data,
      paid_installments: data.paid_installments ?? 0,
      current_balance: data.current_balance ?? data.original_amount,
      disbursed_amount: data.disbursed_amount ?? data.original_amount,
      status: 'ACTIVE' as const,
      user_id: userId,
      created_at: now,
      updated_at: now,
    }
    const docRef = await creditsCollection.add(payload)
    return { ...payload, id: docRef.id } as unknown as Credit
  },

  async update(id: string, data: Partial<Credit>): Promise<Credit> {
    const docRef = creditsCollection.doc(id)
    await docRef.update({ ...data, updated_at: Timestamp.now() })
    const updated = await docRef.get()
    return mapCredit(docRef.id, updated.data()!)
  },

  async delete(id: string): Promise<void> {
    const batch = adminDb.batch()

    const installmentsSnap = await installmentsSub(id).get()
    installmentsSnap.docs.forEach((doc) => batch.delete(doc.ref))
    batch.delete(creditsCollection.doc(id))

    await batch.commit()
  },

  // ── Installments ────────────────────────────────────────────────────────────
  async findInstallments(creditId: string): Promise<Installment[]> {
    const snapshot = await installmentsSub(creditId)
      .orderBy('number', 'asc')
      .get()
    return snapshot.docs.map((doc) => mapInstallment(doc.id, doc.data()))
  },

  async createInstallments(creditId: string, installments: Omit<Installment, 'id' | 'created_at'>[]): Promise<void> {
    const batch = adminDb.batch()
    const sub = installmentsSub(creditId)

    installments.forEach((inst) => {
      const ref = sub.doc()
      batch.set(ref, { ...inst, created_at: Timestamp.now() })
    })

    await batch.commit()
  },

  async updateInstallment(creditId: string, installmentId: string, data: Partial<Installment>): Promise<void> {
    await installmentsSub(creditId).doc(installmentId).update({
      ...data,
      updated_at: Timestamp.now(),
    })
  },

  async markInstallmentsPaid(
    creditId: string,
    installmentIds: string[],
    date: string,
    transactionIds: Record<string, string>,
  ): Promise<void> {
    const batch = adminDb.batch()
    const sub = installmentsSub(creditId)

    installmentIds.forEach((instId) => {
      const txId = transactionIds[instId]
      batch.update(sub.doc(instId), {
        status: 'PAID',
        paid_at: date,
        transaction_id: txId ?? null,
        updated_at: Timestamp.now(),
      })
    })

    await batch.commit()
  },
}
