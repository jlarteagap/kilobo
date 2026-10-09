// features/insights/chart-tokens.ts
// Tokens de datos del módulo Insights, alineados al referente "Minimal · Zinc"
// (docs/DESIGN-MANUAL.md §11). Aislado a propósito: src/lib/config/chart-colors.ts
// es fuente de verdad compartida con dashboard y transactions, y esos componentes
// todavía están en tokens Sage.

export const INSIGHT_TOKENS = {
  /** Único color de acento. Reservado para "bajaste" y estado positivo. */
  accent    : '#059669',
  /** Gasto / monto en alza — el valor que estás mirando */
  spend     : '#27272A',
  /** Texto grado 1 */
  text      : '#18181B',
  /** Texto grado 2 */
  textMuted : '#71717A',
  /** Helper */
  textFaint : '#A1A1AA',
  /** Inset de gráfico */
  surface   : '#FAFAFA',
  /** Borde de card */
  border    : '#E4E4E7',
  /** Separador interno */
  borderSoft: '#F4F4F5',
  /** Serie histórica de la sparkline (meses cerrados) */
  seriesPast   : '#D4D4D8',
  /** Punto proyectado (mes en curso) */
  seriesProjected: '#A1A1AA',
} as const

/** Radios simétricos §11: card 22px → inset 12px → elemento 3px */
export const INSIGHT_RADIUS = {
  card   : 'rounded-[22px]',
  inset  : 'rounded-xl',
  element: 'rounded',
} as const

/** Sombra sutil — la profundidad es borde, no niebla */
export const CARD_SHADOW = '0 2px 16px rgba(0,0,0,0.05)'

/** Grados de texto. Cuatro, fijos. Sin opacidades escalonadas. */
export const TEXT = {
  h1   : 'text-zinc-900 tracking-tight',
  body : 'text-zinc-500',
  label: 'text-zinc-600',
  faint: 'text-zinc-400',
} as const

/** Clases de card de datos — mismo tratamiento en toda la página */
export const DATA_CARD = `${INSIGHT_RADIUS.card} bg-white border border-zinc-200`