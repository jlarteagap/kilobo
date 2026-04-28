import { InsightsPayload } from '@/lib/insights/algorithms'
import { AIInsights } from '@/lib/insights/ai-narrator'

export interface CachedInsights {
  id          : string
  user_id     : string
  payload     : InsightsPayload   // resultado de los algoritmos
  ai_insights : AIInsights | null // resultado de la IA (puede ser null si falló)
  generated_at: string            // ISO string
  expires_at  : string            // ISO string (generated_at + 24h)
  period_months: number
}

export interface InsightsResult {
  payload      : InsightsPayload
  ai_insights  : AIInsights | null
  generated_at : string
  from_cache   : boolean
  period_months: number
}