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

  /**
   * Transacciones dentro de un rango de fechas, con el filtro empujado a la
   * base de datos en lugar de traer el historial y descartar en memoria.
   *
   * El coste pasa a depender del tamaño del periodo, no del historial: para un
   * usuario con años de movimientos, dos meses son decenas de documentos en
   * lugar de miles. Requiere el índice (user_id, date).
   *
   * `date` se guarda como 'YYYY-MM-DD', así que la comparación de cadenas es
   * válida y evita el coste de un Timestamp.
   */
  async findByPeriod(
    userId: string,
    fromDate: string,
    toDate: string,
  ): Promise<Transaction[]> {
    const snapshot = await transactionsCollection
      .where('user_id', '==', userId)
      .where('date', '>=', fromDate)
      .where('date', '<=', toDate)
      .orderBy('date', 'desc')
      .get()

    return snapshot.docs.map((doc) => mapTransaction(doc.id, doc.data()))
  },

  /**
   * Una página de transacciones, ordenadas de más reciente a más antigua.
   *
   * Devuelve `limit + 1` documentos para poderresponder si hay página
   * siguiente sin hacer una segunda consulta: el documento extra se descarta.
   *
   * El cursor se resuelve sobre (date, id) para que dos transacciones del
   * mismo día no se pisen entre páginas.
   */
  /**
   * Aplica los filtros sin paginar. Existe para los totales del conjunto
   * filtrado, que deben cubrir todo el conjunto y no solo la página cargada.
   */
  async findByFilters(
    userId: string,
    filters: { from?: string; to?: string; accountId?: string; categoryId?: string; projectId?: string; tag?: string; type?: string },
  ): Promise<Transaction[]> {
    let q: FirebaseFirestore.Query = transactionsCollection.where('user_id', '==', userId)
    if (filters.from) q = q.where('date', '>=', filters.from)
    if (filters.to) q = q.where('date', '<=', filters.to)
    if (filters.accountId) q = q.where('account_id', '==', filters.accountId)
    if (filters.categoryId) q = q.where('category_id', '==', filters.categoryId)
    if (filters.projectId) q = q.where('project_id', '==', filters.projectId)
    if (filters.tag) q = q.where('tag', '==', filters.tag)
    if (filters.type) q = q.where('type', '==', filters.type)

    const snapshot = await q.orderBy('date', 'desc').get()
    return snapshot.docs.map((doc) => mapTransaction(doc.id, doc.data()))
  },

  async findPage(
    userId: string,
    limit: number,
    cursor?: { d: string; i: string } | null,
    filters: {
      from?: string
      to?: string
      accountId?: string
      categoryId?: string
      projectId?: string
      tag?: string
      type?: string
    } = {},
  ): Promise<{ items: Transaction[]; nextCursor: { d: string; i: string } | null }> {
    let q: FirebaseFirestore.Query = transactionsCollection.where('user_id', '==', userId)

    if (filters.from) q = q.where('date', '>=', filters.from)
    if (filters.to) q = q.where('date', '<=', filters.to)
    if (filters.accountId) q = q.where('account_id', '==', filters.accountId)
    if (filters.categoryId) q = q.where('category_id', '==', filters.categoryId)
    if (filters.projectId) q = q.where('project_id', '==', filters.projectId)
    if (filters.tag) q = q.where('tag', '==', filters.tag)
    if (filters.type) q = q.where('type', '==', filters.type)

    // Un solo orderBy: Firestore añade __name__ como desempate implícito y lo
    // usa al posicionar por documento. Declarar __name__ explícitamente hace
    // que startAfter() espere un valor más de los que acepta y falle.
    q = q.orderBy('date', 'desc')

    // Se posiciona por la REFERENCIA del último documento entregado. Al usar
    // la posición real —no un offset— Firestore aplica también el desempate
    // implícito por __name__, que es lo que evita saltarse las transacciones
    // que comparten fecha (varias al día, en la mayoría de los usuarios).
    //
    // Ojo: con dos valores (`date` y `__name__`) Firestore rechaza el cursor;
    // con `startAfter(date)` a secas se saltaría todo lo que comparta fecha.
    if (cursor) {
      // Un DocumentSnapshot, no una referencia: el SDK acepta
      // startAfter(DocumentSnapshot) para posicionar por posición real. Pasar
      // un DocumentReference entra en la sobrecarga de FieldValue y se ignora
      // en silencio, devolviendo siempre la primera página.
      const anchor = await transactionsCollection.doc(cursor.i).get()
      if (anchor.exists) {
        q = q.startAfter(anchor)
      } else {
        // El documento de anclaje ya no existe (borrado entre páginas). Sin él
        // no hay posición fiable; se devuelve la primera página en vez de
        // inventar una.
        return { items: [], nextCursor: null }
      }
    }

    const snapshot = await q.limit(limit + 1).get()
    const docs = snapshot.docs

    const hasMore = docs.length > limit
    const page = hasMore ? docs.slice(0, limit) : docs

    const last = page[page.length - 1]
    return {
      items: page.map((doc) => mapTransaction(doc.id, doc.data())),
      nextCursor: hasMore && last ? { d: last.get('date') as string, i: last.id } : null,
    }
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