## 1. Fix del cálculo de tendencia vs período anterior

- [x] 1.1 Cambiar `metricsTransactions = filtered` → `metricsTransactions = transactions` en `page.tsx` para que `useTransactionMetrics` reciba el dataset completo y calcule el período anterior con datos reales (alineado con `useFinancialMetrics` del dashboard)
- [x] 1.2 Reemplazar fallback hardcodeado `{ type: 'LAST_MONTH' }` en `SummaryCards` (línea 211) por `getPreviousPeriod(period)` importado de `date.utils.ts`; añadir importación del hook `useMemo` si no está presente para el cálculo del `previous`

## 2. Rediseño zinc de SummaryCards (Ingresos / Gastos / Balance neto)

- [x] 2.1 Refactorizar `SummaryCard`: card `bg-white rounded-[22px] p-5 flex flex-col gap-3 overflow-hidden relative`, label `text-xs font-medium text-zinc-500`, valor `text-2xl font-bold tracking-tight text-zinc-900 tabular-nums`; sparkline inset `h-[52px] -mx-5 -mb-5 mt-auto bg-zinc-50/50` con borde zinc-100; sparkline color por defecto `#D4D4D8` (zinc-300)
- [x] 2.2 Color del sparkline por métrica: Ingresos emerald-600 `#059669`, Gastos zinc-800 `#27272A`, Balance neto según signo (positivo `#059669`, negativo `#27272A`). Valor del monto: Ingresos `#059669`, Gastos zinc-800, Neto según signo (emerald / zinc-800)
- [x] 2.3 Añadir prop `variant?: 'sage' | 'zinc'` a `TrendBadge` (`src/components/ui/trend-badge.tsx`): default `sage` (mantiene colores actuales para dashboard), variante `zinc` usa `text-zinc-500` por defecto, positivo `#059669` (emerald-600), negativo zinc-800 `#27272A`. En `SummaryCards.tsx` pasar `variant="zinc"` a cada TrendBadge
- [x] 2.4 Botón "Nueva" en `page.tsx`: cambiar `bg-[#4F6A35] hover:bg-[#3C5230]` por `bg-[#059669] hover:bg-[#047857]` (emerald-600/700) para alinearlo al único acento zinc

## 3. Rediseño zinc de ProjectSummaryCard

- [x] 3.1 ProjectSummaryCard: quitar borde izquierdo de color, fondo tintado (`${color}06`) y emojis. Card: `bg-white rounded-2xl p-5 border border-zinc-200`; nombre `text-[13px] font-semibold text-zinc-900`
- [x] 3.2 Icono del proyecto: lucide o inicial del proyecto en tile `w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center`; sin emoji; subtitle (Personal) zinc-500
- [x] 3.3 Métricas: label `text-[12px] text-zinc-500`, valor `text-[13px] font-medium text-zinc-900 tabular-nums`; separador zinc-200; neto `text-[15px] font-semibold`, positivo emerald-600 `#059669`, negativo zinc-800

## 4. Rediseño zinc de TransactionList + TransactionTotals

- [x] 4.1 Header de tabla: `text-xs font-semibold text-zinc-500 uppercase tracking-[0.14em]`; borde separador header `border-zinc-200`; divide-y filas `divide-zinc-100`
- [x] 4.2 Filas: quitar `backgroundColor` y `borderLeft` de proyecto; usar `hover:bg-zinc-50/60 transition-colors` en vez de bg tintado por proyecto; tile icono `bg-zinc-100 rounded-xl`; sin emojis; monto positivo emerald-600, negativo zinc-800
- [x] 4.3 Badges de tipo: reemplazar tintes amber/indigo/violeta por zinc: INCOME `bg-zinc-100 text-zinc-700`, EXPENSE `bg-zinc-800 text-white` (o zinc-100 text-zinc-800), TRANSFER `bg-zinc-100 text-zinc-500`; badge proyecto: sin bg de color, `text-[10px] font-medium text-zinc-500 px-1.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200`
- [x] 4.4 Acciones editar/eliminar: `text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100` (editar); `hover:text-red-500 hover:bg-red-50` (eliminar — mantener semántico destructivo)
- [x] 4.5 TransactionTotals: footer `bg-zinc-50/60`; borde `border-zinc-200`; etiqueta `text-[12px] font-semibold text-zinc-500 uppercase tracking-[0.14em]`; montos: positivo emerald-600, negativo zinc-800; separador `border-zinc-200`
- [x] 4.6 Empty state lista: `colSpan={6}`; `text-zinc-900 text-sm font-medium` (título), `text-zinc-500 text-[13px]` (apoyo)
- [x] 4.7 Actualizar `transaction-display.utils.ts`: `getTransactionAmountColor` — INVESTMENT → `text-zinc-600` (en vez de `text-indigo-600`); `getTransactionIcon` investment → `Wallet` lucide (en vez de indigo); `getSubtypeIcon` transferencias → `ArrowLeftRight` en zinc-500; badge de deuda `Handshake` → `text-zinc-600`; actualizar `INVESTMENT_COLORS` a tokens zinc

## 5. Coherencia zinc de charts (estados vacíos)

- [x] 5.1 Empty state de `IncomeExpenseChart`: tile `w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center`; punto `w-2.5 h-2.5 rounded-full bg-zinc-300`; título `text-sm font-medium text-zinc-900`; apoyo `text-xs text-zinc-500`; sin emoji
- [x] 5.2 Empty state de `CategoryOverview`: mismo patrón zinc (tile zinc-100, sin emoji, zinc-900/500)

## 6. Exportación CSV de la vista filtrada

- [x] 6.1 Crear `src/features/transactions/utils/csv-export.utils.ts`: función `buildTransactionRows(transactions, accounts, categories, projects)` que mapea cada transacción a un objeto con columnas Fecha, Categoría, Etiqueta, Cuenta, Descripción, Tipo, Monto (BOB vía `convertToBOB`), Moneda, Proyecto; y función `exportToCSV(rows, filename)` que construye el CSV (RFC 4180), añade BOM UTF-8, crea Blob, genera URL temporal, dispara descarga via `<a>` hidden y revoca la URL
- [x] 6.2 Añadir botón "Exportar CSV" (icono `Download` de lucide, zinc neutro) en el header de Movimientos de `page.tsx`, junto a los totales del header; `className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full px-3 py-1.5 transition-colors"`; desktop-only (`hidden sm:flex`)
- [x] 6.3 Deshabilitar el botón cuando `filtered.length === 0`: `disabled` + `opacity-40 cursor-not-allowed pointer-events-none`
- [x] 6.4 Wiring en `page.tsx`: importar `exportToCSV` y `buildTransactionRows`; handler `handleExportCSV` que llama `exportToCSV(buildTransactionRows(filtered, accounts, categories, projects), 'transacciones-YYYY-MM-DD.csv')`; pasar handler al botón

## 7. Verificación

- [x] 7.1 Correr `npm run lint`
- [x] 7.2 Correr `npx tsc --noEmit`
- [ ] 7.3 Auditoría manual: tendencia vs período anterior muestra % real (no 100% constante); botón CSV descarga archivo correcto con montos en BOB; cards y lista con tokens zinc §11; empty states zinc sin emoji