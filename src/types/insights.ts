import { InsightsPayload } from '@/lib/insights/algorithms'

export interface CachedInsights {
  id           : string
  user_id      : string
  payload      : InsightsPayload
  generated_at : string            // ISO string
  expires_at   : string            // ISO string (generated_at + 24h)
  period_months: number
}

export interface InsightsResult {
  payload      : InsightsPayload
  generated_at : string
  from_cache   : boolean
  period_months: number
}