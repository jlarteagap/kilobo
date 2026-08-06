// src/repositories/driver.repository.ts
import { adminDb } from '@/lib/firebase.admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import {
  DriverShift,
  DriverApp,
  PaymentMethod,
  ShiftInput,
  DRIVER_APPS,
} from '@/types/driver'

const shiftsCollection = adminDb.collection('driver_shifts')

function emptyEarnings(): Record<DriverApp, Record<PaymentMethod, number>> {
  return {
    UBER: { CASH: 0, CARD: 0, QR: 0 },
    YANGO: { CASH: 0, CARD: 0, QR: 0 },
    INDRIVE: { CASH: 0, CARD: 0, QR: 0 },
  }
}

function emptyAppAmounts(): Record<DriverApp, number> {
  return { UBER: 0, YANGO: 0, INDRIVE: 0 }
}

/**
 * Normaliza un documento de Firestore al tipo DriverShift con defaults seguros.
 * Protege contra turnos antiguos que no tienen los campos nuevos (liquidEarnings,
 * earnings anidado, etc.) — evita "Cannot read properties of null (reading 'toFixed')".
 */
function normalizeShift(data: Record<string, unknown>): DriverShift {
  const earningsRaw = (data.earnings ?? {}) as Record<string, unknown>

  // Soportar formato viejo: { UBER: 0 } (números) y formato nuevo: { UBER: { CASH, CARD, QR } }
  const earnings = emptyEarnings()
  for (const app of DRIVER_APPS) {
    const entry = earningsRaw[app]
    if (entry && typeof entry === 'object') {
      const e = entry as Record<string, number>
      earnings[app] = {
        CASH: typeof e.CASH === 'number' ? e.CASH : 0,
        CARD: typeof e.CARD === 'number' ? e.CARD : 0,
        QR: typeof e.QR === 'number' ? e.QR : 0,
      }
    }
  }

  const bonusesRaw = (data.bonuses ?? {}) as Record<string, unknown>
  const commissionsRaw = (data.commissions ?? {}) as Record<string, unknown>
  const bonuses = emptyAppAmounts()
  const commissions = emptyAppAmounts()
  for (const app of DRIVER_APPS) {
    bonuses[app] = typeof bonusesRaw[app] === 'number' ? (bonusesRaw[app] as number) : 0
    commissions[app] = typeof commissionsRaw[app] === 'number' ? (commissionsRaw[app] as number) : 0
  }

  return {
    id: data.id as string,
    user_id: (data.user_id as string) ?? '',
    date: (data.date as string) ?? (data.startTime as string)?.slice(0, 10) ?? '',
    hoursWorked: typeof data.hoursWorked === 'number'
      ? (data.hoursWorked as number)
      : data.endTime && data.startTime
        ? (new Date(data.endTime as string).getTime() - new Date(data.startTime as string).getTime()) / 3600000
        : 0,
    startKm: typeof data.startKm === 'number' ? (data.startKm as number) : null,
    endKm: typeof data.endKm === 'number' ? (data.endKm as number) : null,
    totalKm: typeof data.totalKm === 'number' ? (data.totalKm as number) : null,
    earnings,
    bonuses,
    commissions,
    expenses: Array.isArray(data.expenses) ? (data.expenses as DriverShift['expenses']) : [],
    totalEarnings: typeof data.totalEarnings === 'number' ? (data.totalEarnings as number) : 0,
    totalBonuses: typeof data.totalBonuses === 'number' ? (data.totalBonuses as number) : 0,
    totalCommissions: typeof data.totalCommissions === 'number' ? (data.totalCommissions as number) : 0,
    totalExpenses: typeof data.totalExpenses === 'number' ? (data.totalExpenses as number) : 0,
    grossEarnings: typeof data.grossEarnings === 'number' ? (data.grossEarnings as number) : 0,
    pendingAmount: typeof data.pendingAmount === 'number' ? (data.pendingAmount as number) : 0,
    liquidEarnings: typeof data.liquidEarnings === 'number' ? (data.liquidEarnings as number) : 0,
    generatedTransactionIds: Array.isArray(data.generatedTransactionIds)
      ? (data.generatedTransactionIds as string[])
      : [],
    gasolinaTripCreatedAt: typeof data.gasolinaTripCreatedAt === 'number'
      ? (data.gasolinaTripCreatedAt as number)
      : null,
    notes: (data.notes as string | null) ?? null,
    createdAt: (data.createdAt as string) ?? '',
    updatedAt: (data.updatedAt as string) ?? '',
  }
}

function mapDoc<T extends { id?: string }>(doc: FirebaseFirestore.DocumentSnapshot): T {
  return normalizeShift({ id: doc.id, ...doc.data() }) as unknown as T
}

export const driverRepository = {
  async findAll(userId: string): Promise<DriverShift[]> {
    const snapshot = await shiftsCollection
      .where('user_id', '==', userId)
      .orderBy('date', 'desc')
      .limit(50)
      .get()

    return snapshot.docs.map((doc) => mapDoc<DriverShift>(doc))
  },

  async findById(id: string, userId: string): Promise<DriverShift | null> {
    const doc = await shiftsCollection.doc(id).get()
    if (!doc.exists) return null

    const data = doc.data()
    if (!data || data.user_id !== userId) return null

    return normalizeShift({ id: doc.id, ...data })
  },

  async create(data: ShiftInput & Partial<DriverShift>, userId: string): Promise<DriverShift> {
    const now = Timestamp.now()
    const payload = {
      user_id: userId,
      date: data.date,
      hoursWorked: data.hoursWorked ?? 0,
      startKm: data.startKm ?? null,
      endKm: data.endKm ?? null,
      totalKm: data.totalKm ?? null,
      earnings: data.earnings,
      bonuses: data.bonuses,
      commissions: data.commissions,
      expenses: data.expenses ?? [],
      totalEarnings: data.totalEarnings ?? 0,
      totalBonuses: data.totalBonuses ?? 0,
      totalCommissions: data.totalCommissions ?? 0,
      totalExpenses: data.totalExpenses ?? 0,
      grossEarnings: data.grossEarnings ?? 0,
      pendingAmount: data.pendingAmount ?? 0,
      liquidEarnings: data.liquidEarnings ?? 0,
      generatedTransactionIds: data.generatedTransactionIds ?? [],
      gasolinaTripCreatedAt: data.gasolinaTripCreatedAt ?? null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await shiftsCollection.add(payload)
    return normalizeShift({ id: docRef.id, ...payload })
  },

  async update(id: string, data: Partial<Omit<DriverShift, 'id' | 'user_id'>>): Promise<DriverShift> {
    const docRef = shiftsCollection.doc(id)

    await docRef.update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    return normalizeShift({ id: docRef.id, ...updated.data() })
  },

  async delete(id: string): Promise<void> {
    await shiftsCollection.doc(id).delete()
  },
}
