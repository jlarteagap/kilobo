// src/repositories/car-sharing.repository.ts
import { adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'
import { carMaintenanceRepository } from './car-maintenance.repository'
import {
  computeTripKm,
  type CarCycle,
  type CarTrip,
  type CarTripSource,
  type DebtResult,
} from '@/types/car-sharing'

// Los tipos viven en `@/types/car-sharing` para que los componentes cliente
// puedan usarlos sin arrastrar firebase-admin. Se re-exportan aca para no romper
// a los consumidores actuales en un solo cambio.
export type { CarCycle, CarTrip, CarTripSource, DebtResult } from '@/types/car-sharing'

const CYCLES_COLLECTION = adminDb.collection('car_sharing_cycles')

const CLOSED_CYCLES_LIMIT = 200

/**
 * Reparte el costo de la carga entre quienes condujeron, en funcion de los km
 * de cada uno sobre el total del ciclo. Es derivado del monto y de los viajes,
 * asi que cualquier cambio en alguno de los dos obliga a recalcularlo.
 */
function computeDebtSummary(trips: CarTrip[], gasAmount: number): DebtResult[] {
  const totalKmOverall = trips.reduce((acc, trip) => acc + trip.totalKm, 0)

  const kmByUser = new Map<string, number>()
  trips.forEach(trip => {
    kmByUser.set(trip.userName, (kmByUser.get(trip.userName) || 0) + trip.totalKm)
  })

  return Array.from(kmByUser.entries()).map(([name, totalKm]) => {
    const percentage = totalKmOverall > 0 ? totalKm / totalKmOverall : 0
    return {
      name,
      totalKm,
      percentage: percentage * 100,
      cost: percentage * gasAmount,
    }
  })
}

/**
 * Normaliza los campos opcionales a `null`. Firestore devuelve `undefined` en
 * los documentos escritos antes de que existieran, y el resto del codigo
 * compara contra `null`.
 */
function toCarCycle(id: string, data: Record<string, unknown>): CarCycle {
  return {
    ...(data as unknown as CarCycle),
    id,
    trips: normalizeTrips(data.trips as CarTrip[] | undefined),
    debtSummary: (data.debtSummary as DebtResult[] | undefined) ?? [],
    gasAmount: (data.gasAmount as number | undefined) ?? 0,
    gasLiters: (data.gasLiters as number | null | undefined) ?? null,
    endDate: (data.endDate as number | null | undefined) ?? null,
    paidBy: (data.paidBy as string | null | undefined) ?? null,
    settledAt: (data.settledAt as number | null | undefined) ?? null,
  }
}

/**
 * Rellena `timestamp` en los viajes que todavia solo tienen el string viejo.
 *
 * No puede recuperar el anio ni la zona horaria: el formato `"DD/MM HH:mm"` no los
 * guarda, asi que se asume el anio en curso y hora local de Bolivia. Para datos
 * tan recientes es la mejor aproximacion disponible, y es reversible (el string
 * original queda en `legacyDate`).
 */
function normalizeTrips(trips: CarTrip[] | undefined): CarTrip[] {
  if (!trips) return []

  return trips.map(trip => {
    if (typeof trip.timestamp === 'number') return trip

    const parsed = parseLegacyTripDate(trip.legacyDate ?? undefined)
    if (parsed === null) return trip

    return { ...trip, timestamp: parsed, legacyDate: trip.legacyDate }
  })
}

/** Interpreta `"DD/MM HH:mm"` en hora de Bolivia. Devuelve `null` si no matchea. */
function parseLegacyTripDate(value: string | undefined): number | null {
  if (!value) return null

  const match = /^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/.exec(value.trim())
  if (!match) return null

  const [, dd, mm, hh, min] = match
  const day = Number(dd)
  const month = Number(mm)
  const hour = Number(hh)
  const minute = Number(min)

  if (month < 1 || month > 12 || hour > 23 || minute > 59 || day < 1 || day > 31) {
    return null
  }

  // Bolivia es UTC-4 todo el ano, sin horario de verano.
  const utc = Date.UTC(new Date().getUTCFullYear(), month - 1, day, hour + 4, minute)

  // Valida dia y mes sobre un anio neutro en UTC plano, sin el offset: sumar
  // las 4 horas puede cruzar la medianoche (22:28 en Bolivia es 02:28 del dia
  // siguiente en UTC) y un chequeo sobre la fecha ya desplazada rechazaria
  // viajes perfectly validos.
  const probe = new Date(Date.UTC(2021, month - 1, day))
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null

  return utc
}

export const carSharingRepository = {
  async getActiveCycle(): Promise<CarCycle> {
    const snapshot = await CYCLES_COLLECTION
      .where('status', '==', 'active')
      .limit(1)
      .get()

    if (snapshot.empty) {
      // Create a new active cycle
      const newCycle = {
        status: 'active',
        startDate: Date.now(),
        endDate: null,
        gasAmount: 0,
        paidBy: null,
        trips: [],
        debtSummary: []
      }
      const docRef = await CYCLES_COLLECTION.add(newCycle)
      return toCarCycle(docRef.id, newCycle)
    }

    const doc = snapshot.docs[0]
    return toCarCycle(doc.id, doc.data())
  },

  /**
   * Los ciclos cerrados ya no se limpian a mano porque ahora se liquidan, asi
   * que la coleccion crece sola. El limite evita que esta pagina publica cargue
   * la coleccion entera; el `orderBy` garantiza que se corte por los mas
   * recientes y no por un subconjunto arbitrario.
   *
   * Requiere el indice compuesto `status ASC + endDate DESC` de
   * `firestore.indexes.json`.
   */
  async getClosedCycles(): Promise<CarCycle[]> {
    const snapshot = await CYCLES_COLLECTION
      .where('status', '==', 'closed')
      .orderBy('endDate', 'desc')
      .limit(CLOSED_CYCLES_LIMIT)
      .get()

    return snapshot.docs.map(doc => toCarCycle(doc.id, doc.data()))
  },

  async addTrip(data: { userName: string, initialKm: number, finalKm: number, clientTimestamp?: number; source?: CarTripSource }): Promise<number> {
    const activeCycle = await this.getActiveCycle()

    const totalKm = computeTripKm(data.initialKm, data.finalKm)

    // El timestamp lo manda el cliente para que la hora del viaje sea la del
    // momento en que se registro, no la del servidor.
    const tripTimestamp = data.clientTimestamp ?? Date.now()

    const createdAt = Date.now()
    const trip: CarTrip = {
      userName: data.userName,
      initialKm: data.initialKm,
      finalKm: data.finalKm,
      totalKm,
      timestamp: tripTimestamp,
      createdAt,
      source: data.source ?? 'manual',
    }

    await CYCLES_COLLECTION.doc(activeCycle.id).update({
      trips: FieldValue.arrayUnion(trip)
    })
    
    await carMaintenanceRepository.incrementAbsoluteOdometer(totalKm)

    return createdAt
  },

  async deleteTrip(createdAt: number): Promise<void> {
    const activeCycle = await this.getActiveCycle()
    const tripToDelete = activeCycle.trips.find(t => t.createdAt === createdAt)
    if (!tripToDelete) return

    const updatedTrips = activeCycle.trips.filter(t => t.createdAt !== createdAt)
    
    await CYCLES_COLLECTION.doc(activeCycle.id).update({
      trips: updatedTrips
    })

    await carMaintenanceRepository.incrementAbsoluteOdometer(-tripToDelete.totalKm)
  },

  async updateTrip(createdAt: number, data: { userName: string, finalKm: number }): Promise<void> {
    const activeCycle = await this.getActiveCycle()
    const tripIndex = activeCycle.trips.findIndex(t => t.createdAt === createdAt)
    if (tripIndex === -1) return

    const updatedTrips = [...activeCycle.trips]
    
    // Update the targeted trip
    const trip = updatedTrips[tripIndex]
    const totalKm = computeTripKm(trip.initialKm, data.finalKm)

    updatedTrips[tripIndex] = {
      ...trip,
      userName: data.userName,
      finalKm: data.finalKm,
      totalKm
    }

    // Recalculate subsequent trips to maintain sequence
    for (let i = tripIndex + 1; i < updatedTrips.length; i++) {
      const prev = updatedTrips[i - 1]
      const current = updatedTrips[i]
      
      current.initialKm = prev.finalKm
      current.totalKm = computeTripKm(prev.finalKm, current.finalKm)
    }

    await CYCLES_COLLECTION.doc(activeCycle.id).update({
      trips: updatedTrips
    })

    // Calculate delta for absolute odometer
    const oldSum = activeCycle.trips.reduce((acc, t) => acc + t.totalKm, 0)
    const newSum = updatedTrips.reduce((acc, t) => acc + t.totalKm, 0)
    const delta = newSum - oldSum
    
    await carMaintenanceRepository.incrementAbsoluteOdometer(delta)
  },

  async closeActiveCycle(
    gasAmount: number,
    paidBy: string,
    gasLiters?: number | null,
  ): Promise<void> {
    const activeCycle = await this.getActiveCycle()

    await CYCLES_COLLECTION.doc(activeCycle.id).update({
      status: 'closed',
      endDate: Date.now(),
      gasAmount,
      gasLiters: gasLiters ?? null,
      paidBy,
      debtSummary: computeDebtSummary(activeCycle.trips, gasAmount),
      settledAt: null,
    })

    // 2. Start new active cycle
    await CYCLES_COLLECTION.add({
      status: 'active',
      startDate: Date.now(),
      endDate: null,
      gasAmount: 0,
      gasLiters: null,
      paidBy: null,
      trips: [],
      debtSummary: []
    })
  },

  /**
   * Edita un ciclo ya cerrado: monto, litros o pagador.
   *
   * Existe porque los ciclos anteriores a `gasLiters` nunca lo tuvieron, y sin
   * esto no hay forma de completar el dato: cerrarlos otra vez perderia los
   * viajes. Tambien resuelve el typo del monto, que antes solo se podia
   * arreglar borrando el ciclo completo.
   *
   * `debtSummary` SI se recalcula cuando cambia el monto, porque es derivado:
   * si no, los costos por persona dejarian de sumar el total de la carga.
   */
  async updateClosedCycle(
    id: string,
    data: { gasAmount: number; gasLiters?: number | null; paidBy: string },
  ): Promise<void> {
    const ref = CYCLES_COLLECTION.doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error(`Ciclo ${id} no encontrado`)

    const current = doc.data() as Partial<CarCycle>
    if (current.status !== 'closed') {
      throw new Error('Solo se pueden editar ciclos cerrados')
    }

    const trips = (current.trips as CarTrip[] | undefined) ?? []
    const amountChanged = current.gasAmount !== data.gasAmount

    await ref.update({
      gasAmount: data.gasAmount,
      gasLiters: data.gasLiters ?? null,
      paidBy: data.paidBy,
      ...(amountChanged
        ? { debtSummary: computeDebtSummary(trips, data.gasAmount) }
        : {}),
    })
  },

  /**
   * Marca (o desmarca) un ciclo como liquidado. Solo se toca `settledAt`, nunca
   * `debtSummary`: las deudas de un ciclo ya cerrado son un hecho historico y
   * recomputarlas moveria los montos de los ciclos viejos.
   */
  async setCycleSettled(id: string, settled: boolean): Promise<void> {
    const ref = CYCLES_COLLECTION.doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error(`Ciclo ${id} no encontrado`)

    const data = doc.data() as Partial<CarCycle>
    if (data.status !== 'closed') {
      throw new Error('Solo se pueden liquidar ciclos cerrados')
    }
    if (!data.paidBy) {
      throw new Error('El ciclo no tiene pagador asignado')
    }

    await ref.update({ settledAt: settled ? Date.now() : null })
  },

  async deleteCycle(id: string): Promise<void> {
    await CYCLES_COLLECTION.doc(id).delete()
  },

  async resetAll(): Promise<void> {
    const snapshot = await CYCLES_COLLECTION.get()
    const batch = adminDb.batch()
    snapshot.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
    
    // Ensure one active cycle exists
    await this.getActiveCycle()
  }
}
