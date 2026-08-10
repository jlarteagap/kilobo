// Paleta Kilo de datos para charts (identidad B2)
// Fuente de verdad para todos los colores de series/grids/ejes en gráficos.
export const CHART_COLORS = {
  /** Línea positiva principal (ingresos / serie actual / sage) */
  positive: '#4F6A35',
  /** Línea negativa principal (gastos / serie actual / terracota) */
  negative: '#B5543D',
  /** Ejes / labels / fallbacks gray */
  muted:    '#6E6E73',
  /** Grid de charts */
  grid:     'rgba(0,0,0,0.08)',
  /** Series adicionales (comparativas) — slot 0 es el violeta identidad de insights */
  series: [
    '#8B5CF6', // violeta insights (identidad)
    '#7A9B57',
    '#ACC18A',
    '#D9A487',
    '#837A75',
    '#5F7D42',
    '#4A6FA5',
  ],
} as const
