// services/insightsService.ts

import { insightsRepository } from '@/repositories/insightsRepository'
import { buildInsightsPayload, InsightsPayload } from '@/lib/insights/algorithms'
import { generateAIInsights, AIInsights }        from '@/lib/insights/ai-narrator'
import { transactionsRepository }                 from '@/repositories/transactions.repository'
import { categoriesRepository }                   from '@/repositories/categories.repository'
import { projectRepository }                      from '@/repositories/project.repository'
import { CachedInsights, InsightsResult } from '@/types/insights'

// ─── Service ──────────────────────────────────────────────────────────────────

export const insightsService = {

  /**
   * Punto de entrada principal.
   * 1. Busca caché vigente → si existe, lo retorna
   * 2. Si no, corre algoritmos + IA → guarda en caché → retorna
   */
  async getInsights(
    userId       : string,
    periodMonths : number = 3,
    forceRefresh : boolean = false,
  ): Promise<InsightsResult> {

    // ── 1. Cache hit ──────────────────────────────────────────────────────────
    if (!forceRefresh) {
      const cached = await insightsRepository.findLatest(userId)

      if (cached) {
        return {
          payload      : cached.payload,
          ai_insights  : cached.ai_insights,
          generated_at : cached.generated_at,
          from_cache   : true,
          period_months: cached.period_months,
        }
      }
    }

    // ── 2. Cache miss → generar análisis fresco ───────────────────────────────

    // 2a. Traer transacciones del período
    const dateFrom = (() => {
      const d = new Date()
      d.setMonth(d.getMonth() - periodMonths)
      return d.toISOString().split('T')[0]
    })()

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


    // 2b. Algoritmos determinísticos (síncronos, rápidos)
    const payload = buildInsightsPayload(transactions, periodMonths)

    // 2c. IA para narrativa (asíncrono, puede fallar gracefully)
    const aiInsights = await generateAIInsights(payload)

    // 2d. Guardar en caché
    const saved = await insightsRepository.save(
      userId,
      payload,
      aiInsights,
      periodMonths,
    )

    return {
      payload,
      ai_insights  : aiInsights,
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
    await insightsRepository.invalidate(userId)
    return this.getInsights(userId, periodMonths, true)
  },

}