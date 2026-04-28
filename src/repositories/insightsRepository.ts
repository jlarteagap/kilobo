// repositories/insightsRepository.ts

import { getFirestore } from 'firebase-admin/firestore'
import { InsightsPayload } from '@/lib/insights/algorithms'
import { AIInsights } from '@/lib/insights/ai-narrator'
import { CachedInsights } from '@/types/insights'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLLECTION = 'insights'
const TTL_HOURS  = 24

function isExpired(cached: CachedInsights): boolean {
  return new Date() > new Date(cached.expires_at)
}

function buildDocId(userId: string): string {
  // Un solo documento "latest" por usuario — siempre sobreescribe
  return `${userId}_latest`
}

function buildExpiresAt(from: Date = new Date()): string {
  const expires = new Date(from)
  expires.setHours(expires.getHours() + TTL_HOURS)
  return expires.toISOString()
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const insightsRepository = {

  /**
   * Busca el caché vigente para un usuario.
   * Retorna null si no existe o si expiró.
   */
  async findLatest(userId: string): Promise<CachedInsights | null> {
    const db     = getFirestore()
    const docRef = db.collection(COLLECTION).doc(buildDocId(userId))
    const snap   = await docRef.get()

    if (!snap.exists) return null

    const cached = snap.data() as CachedInsights

    if (isExpired(cached)) {
      // No borramos — dejamos que el siguiente save sobreescriba
      // Evita una escritura extra innecesaria
      return null
    }

    return cached
  },

  /**
   * Guarda o sobreescribe el análisis completo para un usuario.
   */
  async save(
    userId      : string,
    payload     : InsightsPayload,
    aiInsights  : AIInsights | null,
    periodMonths: number,
  ): Promise<CachedInsights> {
    const db     = getFirestore()
    const docId  = buildDocId(userId)
    const now    = new Date()

    const doc: CachedInsights = {
      id           : docId,
      user_id      : userId,
      payload,
      ai_insights  : aiInsights,
      generated_at : now.toISOString(),
      expires_at   : buildExpiresAt(now),
      period_months: periodMonths,
    }

    await db.collection(COLLECTION).doc(docId).set(doc)

    return doc
  },

  /**
   * Fuerza la invalidación del caché (llamado desde el botón "Regenerar").
   * Solo marca como expirado actualizando expires_at al pasado.
   */
  async invalidate(userId: string): Promise<void> {
    const db     = getFirestore()
    const docRef = db.collection(COLLECTION).doc(buildDocId(userId))
    const snap   = await docRef.get()

    if (!snap.exists) return

    // Setear expires_at al pasado fuerza miss en el próximo findLatest()
    await docRef.update({
      expires_at: new Date(0).toISOString(),
    })
  },

}