// lib/insights/ai-narrator.ts

import { InsightsPayload } from './algorithms'

export interface AIInsights {
  summary: string
  anomaly_explanations: {
    category_id: string
    explanation: string
    action: string
  }[]
  saving_tips: {
    category_id: string
    tip: string
    estimated_monthly_saving: number
    feasibility: 'alta' | 'media' | 'baja'
  }[]
  projection: {
    next_month_estimate: number
    confidence: 'low' | 'medium' | 'high'
    narrative: string
  }
  motivation: string

  // New AI-powered fields
  chart_annotations: {
    chart_id: string
    annotation: string
  }[]
  anomaly_clusters: {
    name: string
    severity: 'low' | 'medium' | 'high'
    category_ids: string[]
    explanation: string
  }[]
  projection_extended: {
    monthly: { month: string; estimate: number }[]
    narrative: string
  }
  health_score_change: {
    reason: string
    main_factor: string
    detail: string
  } | null
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(payload: InsightsPayload): string {
  const {
    period_months, total_income, total_expenses,
    savings_rate, anomalies, saving_opportunities,
    top_categories, health_score, trends,
  } = payload

  return `
Eres un asesor financiero personal experto. Analiza estos datos financieros y genera insights accionables.

RESUMEN FINANCIERO (últimos ${period_months} meses):
- Ingresos totales: $${total_income}
- Gastos totales: $${total_expenses}
- Tasa de ahorro: ${savings_rate}%
- Health Score: ${health_score.score}/100 (${health_score.grade})
- Desglose: ahorro ${health_score.breakdown.savings_rate}%, estabilidad ${health_score.breakdown.expense_stability}%, adherencia ${health_score.breakdown.budget_adherence}%

TOP CATEGORÍAS DE GASTO:
${top_categories.map(c => `- ${c.name}: $${c.amount} (${c.pct}% del total)`).join('\n')}

TENDENCIAS POR CATEGORÍA (desglose mensual):
${trends.map(t =>
  `- ${t.category_name} (${t.trend}): promedio $${t.average}/mes, actual $${t.current}/mes
   Historial: ${t.monthly.map(m => `${m.month}: $${m.amount}`).join(', ')}`
).join('\n')}

ANOMALÍAS DETECTADAS:
${anomalies.length > 0
  ? anomalies.map(a =>
      `- ${a.category_name}: $${a.current_amount} este mes vs $${a.average_amount} promedio (${a.delta_pct > 0 ? '+' : ''}${a.delta_pct}%, severidad: ${a.severity})`
    ).join('\n')
  : '- Sin anomalías significativas este mes'
}

OPORTUNIDADES DE AHORRO IDENTIFICADAS:
${saving_opportunities.map(o =>
  `- ${o.category_name}: promedio $${o.monthly_average}/mes, potencial ahorro $${o.potential_saving}/mes`
).join('\n')}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin backticks):
{
  "summary": "párrafo ejecutivo de 2-3 oraciones sobre el estado financiero",
  "anomaly_explanations": [
    {
      "category_id": "id exacto del array de anomalías",
      "explanation": "explicación contextual de por qué puede haber subido",
      "action": "acción concreta y específica que puede tomar"
    }
  ],
  "saving_tips": [
    {
      "category_id": "id de la oportunidad",
      "tip": "tip concreto, específico y accionable",
      "estimated_monthly_saving": número,
      "feasibility": "alta|media|baja"
    }
  ],
  "projection": {
    "next_month_estimate": número estimado de gastos próximo mes,
    "confidence": "low|medium|high",
    "narrative": "explicación breve de la proyección"
  },
  "motivation": "mensaje motivacional personalizado, 1 oración",
  "chart_annotations": [
    {
      "chart_id": "trend_chart",
      "annotation": "oración que explica la tendencia principal del gráfico de gastos"
    }
  ],
  "anomaly_clusters": [
    {
      "name": "nombre del grupo de anomalías relacionadas (ej. 'Entretenimiento')",
      "severity": "low|medium|high",
      "category_ids": ["id1", "id2"],
      "explanation": "explicación de por qué estas categorías están relacionadas y qué patrón sugieren"
    }
  ],
  "projection_extended": {
    "monthly": [
      { "month": "YYYY-MM", "estimate": número }
    ],
    "narrative": "oración explicando la tendencia proyectada a varios meses"
  },
  "health_score_change": {
    "reason": "por qué el health score está en ese nivel",
    "main_factor": "el factor que más impacta (ahorro, estabilidad o adherencia)",
    "detail": "explicación detallada de 1-2 oraciones"
  }
}
`.trim()
}

// ─── Llamada a la IA ──────────────────────────────────────────────────────────

const AI_CONFIG = {
  baseURL : process.env.AI_BASE_URL    ?? 'https://api.deepseek.com',
  apiKey  : process.env.AI_API_KEY     ?? '',
  model   : process.env.AI_MODEL       ?? 'deepseek-chat',
}

const FETCH_TIMEOUT_MS   = 30_000
const MAX_RETRIES        = 2
const INITIAL_RETRY_MS   = 1_500

function extractJSON(text: string): unknown {
  let clean = text

  clean = clean.replace(/<t*hink>[\s\S]*?<\/t*hink>/gi, '')

  clean = clean.replace(/```json|```/g, '')

  clean = clean.trim()

  const start = clean.indexOf('{')
  const end   = clean.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new SyntaxError('No JSON object found in model output')
  }

  const jsonStr = clean.slice(start, end + 1)

  try {
    return JSON.parse(jsonStr)
  } catch {
    const fixed = jsonStr
      .replace(/,\s*}/g, '}')
      .replace(/,\s*\]/g, ']')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')

    return JSON.parse(fixed)
  }
}

async function fetchWithRetry(body: string): Promise<Response> {
  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
        signal : controller.signal,
        method : 'POST',
        headers: {
          'Content-Type' : 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
          'X-Title'      : 'Kipos - Insights Financieros',
          'HTTP-Referer' : 'https://kipos.app',
        },
        body,
      })
      clearTimeout(timeoutId)

      if (response.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter = await (async () => {
          try {
            const raw = await response.clone().json()
            return (raw?.error?.metadata?.retry_after_seconds ?? 1) * 1000
          } catch {
            return INITIAL_RETRY_MS
          }
        })()
        const delay = Math.min(retryAfter, 5_000)
        console.log(`[ai-narrator] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      return response
    } catch (err) {
      clearTimeout(timeoutId)
      lastError = err
      if (err instanceof Error && err.name === 'AbortError') {
        console.error(`[ai-narrator] Request timed out (attempt ${attempt + 1}/${MAX_RETRIES + 1})`)
      } else {
        console.error(`[ai-narrator] Request failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, err)
      }
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_MS * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw lastError
    }
  }

  throw lastError
}

export async function generateAIInsights(
  payload: InsightsPayload,
): Promise<AIInsights | null> {
  if (!AI_CONFIG.apiKey) {
    console.warn('[ai-narrator] No AI_API_KEY set, skipping AI generation')
    return null
  }

  console.log(`[ai-narrator] Calling ${AI_CONFIG.model}`)

  try {
    const requestBody = JSON.stringify({
      model    : AI_CONFIG.model,
      max_tokens: 4000,
      temperature: 0.4,
      messages : [
        {
          role   : 'user',
          content: buildPrompt(payload),
        },
      ],
    })

    const response = await fetchWithRetry(requestBody)

    if (!response.ok) {
      console.error('[ai-narrator] AI API error:', response.status, await response.text())
      return null
    }

    const data   = await response.json()
    const raw    = data.choices?.[0]?.message?.content ?? ''
    console.log('[ai-narrator] Raw response (first 300 chars):', raw.slice(0, 300))
    const parsed = extractJSON(raw) as AIInsights

    console.log('[ai-narrator] AI insights generated successfully')
    return parsed
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('[ai-narrator] AI request timed out after all retries')
    } else {
      console.error('[ai-narrator] Failed to generate AI insights:', err)
    }
    return null
  }
}
