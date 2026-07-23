import { adminDb } from '@/lib/firebase.admin'
import { Investment, CreateInvestmentData, UpdateInvestmentData, InvestmentTransaction, CreateInvestmentTxData, InvestmentTxType } from '@/types/investment'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'

const collection = adminDb.collection('investments')

function mapInvestment(id: string, data: FirebaseFirestore.DocumentData): Investment {
  return { id, ...data } as unknown as Investment
}

function mapTransaction(id: string, data: FirebaseFirestore.DocumentData): InvestmentTransaction {
  return { id, ...data } as unknown as InvestmentTransaction
}

function buildPayload(data: CreateInvestmentData, userId: string) {
  const now = Timestamp.now()
  return {
    ...data,
    user_id: userId,
    currency: data.currency ?? 'BOB',
    notes: data.notes ?? null,
    transaction_id: data.transaction_id ?? null,
    units: data.units ?? null,
    unit_price: data.unit_price ?? null,
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

  // ─── Transactions subcollection ───────────────────────────────────

  txCollection(investmentId: string) {
    return collection.doc(investmentId).collection('transactions')
  },

  async findTransactions(investmentId: string, userId: string): Promise<InvestmentTransaction[]> {
    // Verify ownership first
    const inv = await this.findById(investmentId, userId)
    if (!inv) throw new Error('Inversión no encontrada.')

    const snapshot = await this.txCollection(investmentId)
      .orderBy('date', 'desc')
      .orderBy('created_at', 'desc')
      .get()

    return snapshot.docs.map((doc) => mapTransaction(doc.id, doc.data()))
  },

  async createTransaction(
    data: CreateInvestmentTxData,
    userId: string
  ): Promise<InvestmentTransaction> {
    const now = Timestamp.now()
    const total_amount = data.units * data.unit_price
    const payload = {
      ...data,
      user_id: userId,
      total_amount,
      notes: data.notes ?? null,
      created_at: now,
      updated_at: now,
    }
    const ref = await this.txCollection(data.investment_id).add(payload)
    return mapTransaction(ref.id, payload)
  },

  createTransactionInBatch(
    batch: FirebaseFirestore.WriteBatch,
    data: CreateInvestmentTxData,
    userId: string
  ): {
    ref: FirebaseFirestore.DocumentReference
    payload: { id?: string; investment_id: string; user_id: string; type: InvestmentTxType; units: number; unit_price: number; total_amount: number; currency: string; date: string; notes: string | null; created_at: FirebaseFirestore.Timestamp; updated_at: FirebaseFirestore.Timestamp }
  } {
    const now = Timestamp.now()
    const total_amount = data.units * data.unit_price
    const payload = {
      ...data,
      user_id: userId,
      total_amount,
      notes: data.notes ?? null,
      created_at: now,
      updated_at: now,
    }
    const ref = this.txCollection(data.investment_id).doc()
    batch.set(ref, payload)
    return { ref, payload }
  },

  async deleteTransaction(investmentId: string, txId: string, userId: string): Promise<void> {
    const inv = await this.findById(investmentId, userId)
    if (!inv) throw new Error('Inversión no encontrada.')
    await this.txCollection(investmentId).doc(txId).delete()
  },

  /**
   * Recalcula units, unit_price (avg ponderado), y amount basado en todas las transacciones BUY/SELL.
   */
  async recalculatePosition(investmentId: string, userId: string): Promise<void> {
    const inv = await this.findById(investmentId, userId)
    if (!inv) throw new Error('Inversión no encontrada.')

    const txSnapshot = await this.txCollection(investmentId)
      .orderBy('created_at', 'asc')
      .get()

    if (txSnapshot.empty) {
      // No hay transacciones → resetear position
      await collection.doc(investmentId).update({
        units: null,
        unit_price: null,
        amount: 0,
        updated_at: FieldValue.serverTimestamp(),
      })
      return
    }

    let totalUnits = 0
    let totalCost = 0

    for (const doc of txSnapshot.docs) {
      const tx = doc.data() as InvestmentTransaction
      if (tx.type === 'BUY') {
        totalCost += tx.total_amount
        totalUnits += tx.units
      } else if (tx.type === 'SELL') {
        // Reduce units; cost basis se descuenta al avg actual
        if (totalUnits > 0) {
          const avgPrice = totalCost / totalUnits
          totalCost -= tx.units * avgPrice
          totalUnits -= tx.units
        }
      }
    }

    totalUnits = Math.max(0, totalUnits)
    totalCost = Math.max(0, totalCost)
    const avgPrice = totalUnits > 0 ? +(totalCost / totalUnits).toFixed(6) : null

    await collection.doc(investmentId).update({
      units: totalUnits > 0 ? totalUnits : null,
      unit_price: avgPrice,
      amount: totalUnits > 0 ? totalCost : 0,
      updated_at: FieldValue.serverTimestamp(),
    })
  },
}
