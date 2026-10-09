// services/insightsService.ts

import { subMonths, startOfMonth } from 'date-fns'

import { insightsRepository } from '@/repositories/insightsRepository'
import { buildInsightsPayload } from '@/lib/insights/algorithms'
import { transactionsRepository }                 from '@/repositories/transactions.repository'
import { categoriesRepository }                   from '@/repositories/categories.repository'
import { projectRepository }                      from '@/repositories/project.repository'
import { InsightsResult } from '@/types/insights'

// ─── Service ──────────────────────────────────────────────────────────────────

export const insightsService = {

  /**
   * Punto de entrada principal.
   * 1. Busca caché vigente para el período → si existe, lo retorna
   * 2. Si no, corre los algoritmos → guarda en caché → retorna
   */
  async getInsights(
    userId       : string,
    periodMonths : number = 3,
    forceRefresh : boolean = false,
  ): Promise<InsightsResult> {

    // ── 1. Cache hit ──────────────────────────────────────────────────────────
    if (!forceRefresh) {
      const cached = await insightsRepository.findLatest(userId, periodMonths)

      if (cached) {
        return {
          payload      : cached.payload,
          generated_at : cached.generated_at,
          from_cache   : true,
          period_months: cached.period_months,
        }
      }
    }

    // ── 2. Cache miss → generar análisis fresco ───────────────────────────────

    // 2a. Traer transacciones del período.
    // La ventana empieza el 1er día del mes más antiguo inclusive: con 6 meses
    // es el día 1, no "hoy - 6 meses" (que dejaba fuera los primeros días).
    const dateFrom = startOfMonth(
      subMonths(new Date(), periodMonths - 1),
    ).toISOString().split('T')[0]

    const [allTransactions, categories, projects] = await Promise.all([
      transactionsRepository.findAll(userId),
      categoriesRepository.findAll(userId),
      projectRepository.findAll(userId)
    ])

    const categoryMap = new Map(categories.map(c => [c.id, c]))
    const projectMap = new Map(projects.map(p => [p.id, p]))

    const hydratedTransactions = allTransactions.map(tx => ({
      ...tx,
      category: tx.category_id ? categoryMap.get(tx.category_id) : null,
      project: tx.project_id ? projectMap.get(tx.project_id) : null,
    }))

    const transactions = hydratedTransactions.filter(t => t.date >= dateFrom)


    // 2b. Algoritmos determinísticos
    const payload = buildInsightsPayload(transactions, periodMonths)

    // 2c. Guardar en caché
    const saved = await insightsRepository.save(
      userId,
      payload,
      periodMonths,
    )

    return {
      payload,
      generated_at : saved.generated_at,
      from_cache   : false,
      period_months: periodMonths,
    }
  },

  /**
   * Fuerza regeneración invalidando el caché primero.
   * Usado desde el botón "Regenerar análisis" en la UI.
   */
  async refreshInsights(
    userId      : string,
    periodMonths: number = 3,
  ): Promise<InsightsResult> {
    await insightsRepository.invalidate(userId, periodMonths)
    return this.getInsights(userId, periodMonths, true)
  },

}