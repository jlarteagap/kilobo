// types/period.ts

// ─── Períodos predefinidos ────────────────────────────────────────────────────
export type PredefinedPeriod =
  | 'THIS_WEEK'       // lunes de esta semana → hoy
  | 'THIS_MONTH'      // 1 del mes actual → hoy
  | 'LAST_MONTH'      // mes anterior completo
  | 'CUSTOM_MONTH'    // mes/año específico elegido por el usuario
  | 'CUSTOM_RANGE'    // fecha desde / hasta libre

// ─── Período con datos según tipo ────────────────────────────────────────────
export type Period =
  | { type: 'THIS_WEEK'    }
  | { type: 'THIS_MONTH'   }
  | { type: 'LAST_MONTH'   }
  | { type: 'CUSTOM_MONTH'; year: number; month: number }   // month: 0-11
  | { type: 'CUSTOM_RANGE'; from: string; to: string }      // "yyyy-MM-dd"

// ─── Rango resuelto — siempre dos fechas concretas ───────────────────────────
export interface DateRange {
  from: Date   // inicio del período (inclusive)
  to:   Date   // fin del período (inclusive)
}

// ─── Labels para el selector ─────────────────────────────────────────────────
export const PREDEFINED_PERIOD_LABELS: Record<PredefinedPeriod, string> = {
  THIS_WEEK:    'Esta semana',
  THIS_MONTH:   'Este mes',
  LAST_MONTH:   'Mes anterior',
  CUSTOM_MONTH: 'Otros meses',
  CUSTOM_RANGE: 'Rango',
}

// ─── Período por defecto ──────────────────────────────────────────────────────
export const DEFAULT_PERIOD: Period = { type: 'THIS_MONTH' }