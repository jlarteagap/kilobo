## Context

Ver proposal.md — Why. La página de transacciones (`src/app/transactions/page.tsx`) alimenta
`useTransactionMetrics` con `filtered` — transacciones ya filtradas al período actual. El hook
calcula el período anterior con `filterByPeriod(transactions, prevPeriod)` sobre ese set prefiltrado,
que está vacío del período anterior → tendencia siempre 100%. El dashboard (`useFinancialMetrics`)
recibe el dataset completo y funciona correctamente. Las cards de resumen y la lista usan tokens
Sage mientras que la banda de gráficos de datos (Sankey, `CashflowSection`) ya fue migrada al
referente **Minimal · Zinc** (§11) que es el estándar a seguir. No existe funcionalidad de
exportación de datos.

## Goals / Non-Goals

**Goals:**
- Corregir la comparativa百分比vs período anterior para que refleje valores reales (alinear con el
  patrón del dashboard).
- Rediseñar SummaryCards, ProjectSummaryCards y TransactionList al patrón **Minimal · Zinc** (§11):
  único acento emerald `#059669`, neutros zinc, radios simétricos (22px → xl → 3px), sin emojis,
  sin borde de color por proyecto, sin tokens Sage en canvas.
- Implementar exportación CSV de la vista actualmente filtrada, generada en el cliente sin nuevas
  dependencias.
- Ajustar coherencia visual de IncomeExpenseChart y CategoryOverview (estados vacíos zinc, textos
  zinc) para igualar la banda de gráficos.

**Non-Goals:**
- No se cambia el contrato de `useTransactionMetrics` (se mantiene la misma interfaz y retorna los
  mismos campos; solo el input que recibe cambia de `filtered` a `transactions`).
- No se implementa exportación PDF (decisión del usuario: CSV solamente).
- No se añaden nuevas dependencias npm (el CSV se construye con `Blob` + BOM + `URL.createObjectURL`).
- No se modifica la lógica de negocio, repositorios, APIs, colecciones ni índices.
- No se cambia el comportamiento de la lista (filtros, agrupación por fecha, acciones de editar/
  eliminar se mantienen intactos).

## Decisions

**D1 — Pasar `transactions` (dataset completo) a `useTransactionMetrics`.**

En `page.tsx`, `metricsTransactions` actual es `filtered` (resultado de `useTransactionFilters` que
ya aplica `filterByPeriod`). Se cambia a `transactions` (todas las transacciones). El hook
`useTransactionMetrics` aplica `filterByPeriod` internamente para el período actual Y el anterior,
con lo cual el tramo anterior ahora tiene datos reales. Alternativas descartadas:
- (A) Calcular el anterior fuera del hook con un segundo dataset prefiltrado → duplicaría lógica
  dentro de `SummaryCards` o requiere pasar el doble de props; peor separación de responsabilidades.
- (B) Agregar un prop `allTransactions` al hook → innecesario, el hook solo necesita un dataset
  completo sobre el que filtrar.

**D2 — Fallback de `SummaryCards`: `getPreviousPeriod(period)` en vez de `LAST_MONTH` hardcodeado.**

Cuando SummaryCards se usa sin props precomputadas (p. ej. como componente standalone), el cálculo
interno de `previous` hardcodea `{ type: 'LAST_MONTH' }`. Si el período no es `THIS_MONTH` (p. ej.
semanal, mensual personalizado o rango), el período anterior es incorrecto. Se reemplaza por
`getPreviousPeriod(period)` del módulo existente `date.utils.ts`, el cual devuelve el período
anterior real para cualquier tipo (THIS_WEEK → semana previa; CUSTOM_MONTH → mes anterior; etc.).

**D2b — TrendBadge: prop `variant` para no romper el dashboard.**

`TrendBadge` es compartido entre transactions y dashboard. Se añade `variant?: 'sage' | 'zinc'`
(default `sage`). La variante zinc usa `text-zinc-500` por defecto, `#059669` para positivo,
zinc-800 para negativo. Transactions pasa `variant="zinc"`; el dashboard sigue sin variante (default
sage). Alternativa descartada: refactor global a zinc rompería el dashboard sin un cambio explícito.

**D2c — Botón "Nueva": alinear a emerald.**

El botón de acción principal en `page.tsx` usa `bg-[#4F6A35]` (Sage). Se reemplaza por
`bg-[#059669] hover:bg-[#047857]` (emerald-600/700), consistente con el único acento del referente
§11. Esto es coherente con el principio del manual §1 de "solo tema claro, colores cálidos" y con
la regla §11 de "único acento emerald".

**D2d — transaction-display.utils.ts: colores tipo alineados a zinc.**

`getTransactionAmountColor`, `INVESTMENT_COLORS` y `getSubtypeIcon` devuelven clases hardcodeadas
con indigo/amber/orange que no existen en el vocabulario zinc. Se migran a tokens zinc: inversiones
`text-zinc-600`, transferencias `text-zinc-500`, deudas `text-zinc-600` (manteniendo semántica
destructiva en acciones). Esto afecta solo los colores de los badges y montos en la lista; la
función `getTransactionIcon` mantiene la iconografía lucide existente.

**D3 — Rediseño zinc: aplicar §11 de forma consistente a todas las superficies de datos de la
página.**

Resumen de cambios por componente (tokens del manual §11):

| Componente | Cambio clave |
|---|---|
| SummaryCard (Ingresos/Gastos/Neto) | Card `bg-white rounded-[22px] p-5`; inset sparkline zinc-50; acento `#059669` para ingresos/positivos, zinc-800 `#27272A` para gasto; label zinc-500, valor zinc-900; sparkline color zinc-300 por defecto (positivo: `#059669`, gasto: `#27272A`). TrendBadge con estilo zinc (sin emerald/clay color). |
| ProjectSummaryCard | Sin borde izquierdo de color, sin fondo tintado, sin emojis: icono lucide o inicial zinc-400 en tile `bg-zinc-100 rounded-xl`; métricas en label zinc-600 + valor zinc-900 tabular-nums; neto positivo `#059669`, negativo zinc-800. Borde card zinc-200. |
| TransactionList | Header `text-xs uppercase tracking-wider text-zinc-500`; filas `hover:bg-zinc-50/60` (sin bg de color proyecto); separador fecha zinc-500; borde separador zinc-100; badge tipo: sin tinte de color (zinc neutro o único acento semántico emerald/zinc-800); monto positivo `#059669`, negativo zinc-800; tile icono `bg-zinc-100 rounded-xl` sin emoji. |
| TransactionTotals | Footer `bg-zinc-50` en vez de `bg-[#F2F9E3]/50`; separadores zinc-200. |
| IncomeExpenseChart (empty) | Tile zinc-100 con punto zinc-300; título zinc-900, apoyo zinc-500. |
| CategoryOverview (empty) | Igual: tile zinc-100, sin emoji; título zinc-900, apoyo zinc-500. |

Alternativa descartada: aplicar §11 solo a las cards y no a la lista. Descartada porque el usuario
pidió que la lista "siga el patrón de diseño que estamos aplicando al resto del proyecto".

**D4 — Exportación CSV: totalmente client-side, sin backend ni dependencias.**

`csv-export.utils.ts` implementa:
1. `exportToCSV(rows: CSVRow[], filename: string): void` — construye el string CSV con comillas para
   campos que contengan coma/comillas/newline (reglas RFC 4180), añade BOM UTF-8 al inicio, crea un
   `Blob`, genera una URL temporal con `URL.createObjectURL`, dispara la descarga vía un `<a>`
   hidden, y revoca la URL. Síncrono; aceptable para un set de transacciones personal (<10k filas).
2. `buildTransactionRows(transactions, accounts, categories, projects): CSVRow[]` — mapea cada
   transacción a las columnas: Fecha, Categoría, Etiqueta, Cuenta, Descripción, Tipo, Monto BOB,
   Moneda, Proyecto. El monto es la conversión a BOB (consistente con el resto de la app) y la
   moneda original se preserva para trazabilidad.

Alternativas descartadas:
- Librería `papaparse`: introduce dependencia innecesaria; el formato CSV simple se genera manual
  con 50 líneas.
- Generación vía API server-side (p. ej. PDFKit o similar): innecesario, el cliente tiene todos los
  datos en caché.

**D5 — Botón de exportación: posición y wiring.**

El botón "Exportar CSV" se sitúa en la fila de acciones del header de la sección Movimientos (junto
a los totales por filtrado del header), alineado a la derecha en desktop. Usa `Download` de lucide.
Se deshabilita (opacity + cursor-not-allowed + sin onClick) cuando `filtered.length === 0`. No
muestra el botón en móvil pequeño (el usuario prefiere no saturar la barra de acciones; la
exportación se ofrece solo en vista escritorio, alineado con el patrón de "acciones a la derecha"
del manual §6). Alternativa: botón siempre visible → descartada por densidad en móvil.

## Risks / Trade-offs

- **[Performance del CSV]** → Para conjuntos grandes (>5,000 filas) la generación síncrona podría
  bloquear brevemente el hilo principal. Mitigación: Aceptable para el volumen típico de una
  aplicación de finanzas personales; si en algún momento crece, se puede envolver en un Web Worker
  sin cambiar el contrato del módulo.
- **[Resumen de totales vs filtros secundarios]** → Al pasar `transactions` a las métricas, las
  cards de resumen reflejan todo el período sin filtros secundarios, mientras que los totales en la
  cabecera de la lista (mismos del header) sí respetan filtros. Hay una diferencia numérica
  intencional: resumen = período completo; vista filtrada = montos filtrados. Mitigación: ya existía
  como patrón en el dashboard (dashboard muestra mes completo; transacciones mostraba filtradas);
  ahora ambos lo hacen de forma coherente.
- **[Fallback de SummaryCards]** → El fallback (sin props) es un camino raramente usado porque la
  página siempre pasa props. El cambio de `LAST_MONTH` a `getPreviousPeriod` es defensivo pero no
  afecta el comportamiento actual reportado; mitiga riesgos futuros si el componente se reutiliza.
- **[Disponibilidad del botón CSV en móvil]** → No se muestra en móvil para no saturar la barra de
  acciones; si el usuario lo demanda en móvil se puede añadir en un cambio posterior como menú
  dropdown (scope futuro, no bloquea).

## Migration Plan

- No hay migración de datos. Solo deploy de código Next.js.
- Rollback: revertir el commit. Las métricas y el botón son frontend puro; no se afectan datos ni
  API.
- La corrección de tendencia es inmediata al deploy (no requiere刷新 de datos caché del cliente).