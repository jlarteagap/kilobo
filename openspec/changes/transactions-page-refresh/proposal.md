## Why

La página de transacciones es de las últimas superficies de datos que aún no se igualaron al
referente de diseño **Minimal · Zinc** (`docs/DESIGN-MANUAL.md` §11): las cards de Ingresos/Gastos/
Balance neto y las cards por proyecto conviven con el estilo Sage (tokens `#4F6A35`, `#B5543D`,
radios asimétricos, emojis, bordes de color), y la lista es una tabla clásica con bordes izquierdos
de color por proyecto y tintes ámbar/índigo. Además, hay un bug: el porcentaje comparativo vs el
período anterior siempre marca 100% porque las métricas reciben transacciones ya filtradas al
período actual y el tramo anterior se calcula sobre un set vacío. Y no existe ninguna forma de
exportar los datos para análisis profundo (CSV/Excel) — el usuario quiere descargar la vista que
está analizando para trabajarla fuera de la app.

## What Changes

- **Fix del comparativo vs período anterior**: en `page.tsx`, `useTransactionMetrics` recibe
  `filtered` (ya filtradas al período actual) en lugar de `transactions`; su filtro interno del
  período anterior (`filterByPeriod(transactions, prevPeriod)`) devuelve vacío, `prevIncome`/
  `prevExpense` valen 0 y `calcTrend` cae en `previous === 0 → 100%`. Se corrige pasando
  `transactions` (dataset completo) y alineando con `useFinancialMetrics` del dashboard. Además, el
  fallback de `SummaryCards` deja de hardcodear `LAST_MONTH` y usa `getPreviousPeriod(period)`.
- **Cards de Ingresos / Gastos / Balance neto** (`SummaryCards.tsx`): rediseño al patrón Minimal ·
  Zinc — neutros zinc, **único acento emerald `#059669`** para ingresos/positivos, gastos zinc-800,
  radios simétricos (card 22px, inset xl), `tabular-nums`. Se mantiene y pule el porcentaje
  comparativo vs período anterior (badge con flecha, ahora correcto).
- **Cards de Ingresos/Gastos por proyecto** (`ProjectSummaryCard`): renovadas al patrón zinc — sin
  emojis (icono lucide o inicial), sin borde izquierdo de color ni fondos tintados; métricas en una
  fila con etiqueta + monto + signo. Se conserva la agrupación actual (Personal primero + proyectos
  activos del período).
- **Lista de transacciones** (`TransactionList.tsx` + `TransactionTotals.tsx`): ajuste visual zinc —
  montos con el único acento emerald/zinc por convención del manual, separadores zinc-100, icono en
  tile zinc en vez de emojis, hover, estados vacío/loading zinc (§11), acciones editar/eliminar en
  zinc. Se mantiene el agrupado por fecha, filtrado y el tfoot de totales.
- **Charts adyacentes** (`IncomeExpenseChart.tsx`, `CategoryOverview.tsx`): solo ajustes mínimos de
  coherencia (estados vacíos zinc, textos zinc, sin tokens Sage en canvas).
- **Descarga CSV de la vista actual** (nuevo): botón "Exportar CSV" en el header de Movimientos que
  descarga las transacciones **filtradas** (período + filtros activos), montos en BOB, columnas
  Fecha, Categoría, Etiqueta, Cuenta, Descripción, Tipo, Monto, Moneda, Proyecto. UTF-8 con BOM para
  Excel/Sheets. Se genera en el cliente con los datos ya cacheados (sin requests nuevos).
- **Sin cambios de datos**: no se tocan colecciones, índices ni APIs.

## Capabilities

### New Capabilities
- `transactions-page`: comportamiento observable de la página de transacciones — cards de resumen con
  tendencia vs período anterior calculada correctamente, cards por proyecto (Personal + proyectos
  activos), lista de movimientos agrupada por fecha con totales, y descarga CSV de la vista
  actualmente filtrada.

### Modified Capabilities
- Ninguna. No existen specs previas para la página de transacciones; los cambios son de UI/UX, una
  corrección de cálculo y una capacidad de exportación nueva (no alteran requisitos de persistencia
  ya especificados).

## Impact

- **UI (main)**: `src/features/transactions/components/analytics/SummaryCards.tsx` (cards + project
  cards + fallback de período previo), `src/features/transactions/TransactionList.tsx`,
  `src/features/transactions/TransactionTotal.tsx`.
- **Wiring / fix**: `src/app/transactions/page.tsx` (pasar `transactions` a `useTransactionMetrics`,
  botón Exportar CSV + wiring), `src/features/transactions/hooks/useTransactionMetrics.ts` (sin
  cambios de contrato; solo deja de recibir input ya prefiltrado).
- **New**: util `src/features/transactions/utils/csv-export.utils.ts` (normalización de filas,
  encod UTF-8 BOM, build y descarga).
- **Coherencia**: `IncomeExpenseChart.tsx`, `CategoryOverview.tsx` (estados vacíos y textos zinc).
- **Reutilizable**: `TrendBadge` (`src/components/ui/trend-badge.tsx`) — nuevo prop `variant` para
  no romper el dashboard; transactions pasa `variant="zinc"`.
- **Utils de display**: `transaction-display.utils.ts` — colores de tipo (inversiones indigo →
  zinc-600, transferencias amber → zinc-500, deudas orange → zinc-600) alineados al vocabulario
  zinc.
- **Botón "Nueva"** en `page.tsx` — de sage `#4F6A35` a emerald `#059669`.
- **Dependencias**: ninguna nueva. CSV manual sin librerías; PDF fuera de scope (decisión del usuario).
- **Sin** cambios de API, repos de datos, índices, scripts ni infraestructura.
- **Riesgo bajo**: cambios de frontend; la corrección de tendencia alinea la página con el
  comportamiento ya correcto del dashboard.