// lib/insights/ai-narrator.ts

import { InsightsPayload } from './algorithms'

export interface AIInsights {
  summary: string                    // párrafo ejecutivo (2-3 oraciones)
  anomaly_explanations: {
    category_id: string
    explanation: string              // explicación contextual
    action: string                   // qué hacer al respecto
  }[]
  saving_tips: {
    category_id: string
    tip: string                      // tip concreto y accionable
    estimated_monthly_saving: number
  }[]
  projection: {
    next_month_estimate: number
    confidence: 'low' | 'medium' | 'high'
    narrative: string
  }
  motivation: string                 // mensaje de cierre personalizado
}

// ─── Prompt builder ───────────────────────────────────────────────────────────
// Mandamos solo el resumen estructurado, nunca transacciones crudas

function buildPrompt(payload: InsightsPayload): string {
  const { 
    period_months, total_income, total_expenses, 
    savings_rate, anomalies, saving_opportunities,
    top_categories, health_score 
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
      "tip": "tip concreto, específico y accionable en 1-2 oraciones",
      "estimated_monthly_saving": número
    }
  ],
  "projection": {
    "next_month_estimate": número estimado de gastos próximo mes,
    "confidence": "low|medium|high",
    "narrative": "explicación de la proyección en 1 oración"
  },
  "motivation": "mensaje motivacional personalizado basado en el health score, 1 oración"
}
`.trim()
}

// ─── Llamada a la IA ──────────────────────────────────────────────────────────

const AI_CONFIG = {
  // Cambia baseURL + model para cambiar de proveedor sin tocar nada más
  baseURL : process.env.AI_BASE_URL    ?? 'https://api.deepseek.com',
  apiKey  : process.env.AI_API_KEY     ?? '',
  model   : process.env.AI_MODEL       ?? 'deepseek-chat',
}

export async function generateAIInsights(
  payload: InsightsPayload,
): Promise<AIInsights | null> {
  if (!AI_CONFIG.apiKey) {
    console.warn('[ai-narrator] No AI_API_KEY set, skipping AI generation')
    return null
  }

  try {
    const response = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model    : AI_CONFIG.model,
        max_tokens: 1200,
        temperature: 0.4,   // bajo para respuestas consistentes y financieras
        messages : [
          {
            role   : 'user',
            content: buildPrompt(payload),
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('[ai-narrator] AI API error:', response.status, await response.text())
      return null
    }

    const data   = await response.json()
    const raw    = data.choices?.[0]?.message?.content ?? ''
    
    // Limpiar posibles backticks que algunos modelos añaden a pesar del prompt
    const clean  = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean) as AIInsights

    return parsed
  } catch (err) {
    console.error('[ai-narrator] Failed to generate AI insights:', err)
    return null   // el servicio maneja el fallback
  }
}