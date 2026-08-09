# Kilo B2 Final Cleanup — Landing pública, dark: inertes, paleta de cuentas y charts

**Fecha:** 2026-08-09
**Estado:** Aprobado por el usuario (decisión delegada: "escoge la versión que mejor se acomode con el proyecto"). Revisado por spec-reviewer (5 iteraciones, aprobado).
**Alcance:** Cierre final de la dirección visual B2 sobre 4 frentes: landing pública, clases `dark:` inertes, paleta de cuentas y colores de charts.

## Contexto

El rediseño B2 (tokens → dashboard → shell → global → 9 módulos → componentes compartidos) está completo y commiteado (8 commits, ~120 archivos). Quedan 4 frentes que el grep final marcó como residuos conocidos o fuera de alcance:

1. **Landing pública** (`src/app/page.tsx` + `src/features/landing/components/*`): usa verde Apple `emerald-600`, fondo `neutral-50`, botones negros `bg-neutral-900`, cards con bordes `neutral-200`. Es la última pieza visible que contradice la identidad B2.
2. **Clases `dark:` inertes**: 282 clases en 30 archivos. La app NO tiene dark mode (sin toggle, sin `ThemeProvider` montado — solo `useTheme` en `sonner.tsx` que no se usa). Son código muerto.
3. **Paleta de cuentas** (`account-display.utils.ts`): colores crudos de Tailwind (blue-500, purple-500, emerald-500, orange-500, gray-500). El `emerald-500` es justamente el verde Apple excluido de la UI.
4. **Charts**: 3 familias de colores mezcladas — ya-Kilo (CashflowSection, IncomeExpenseChart, BalanceProjection, ShiftAnalytics, Sankey), Apple (FinancialComparisonChart, AmortizationChart, TrendChart, CategoryComparison) y `#9ca3af` crudo.

**Fuera de alcance (públicas, con estética propia documentada):** `src/app/gasolina/*` y `src/app/car-sharing/*`. No se tocan.

## Decisiones de diseño (aprobadas)

### 1. Landing pública → identidad Kilo completa (+ login)

| Decisión | Valor |
|---|---|
| Fondo | `#F2FBE0` (token `--background`) en vez de `neutral-50` |
| Cards | `bg-white rounded-[22px]` + `boxShadow: 0 2px 16px rgba(0,0,0,0.05)`, sin bordes |
| Botones CTA | `bg-[#4F6A35] hover:bg-[#3C5230]` (en vez de emerald-600 / neutral-900) |
| Semántica | ingresos `#4F6A35`, gastos `#B5543D` (fake-UI de BentoGrid, progress bars) |
| Header/Footer | textos `text-foreground` / `#6E6E73`, header con blur (estilo shell) |
| Widget "Pulse" del Hero | réplica de un widget real del dashboard (card blanca, monto `#4F6A35`, badge sage) |
| `dark:` | se eliminan de la landing |

**Login** (`src/app/login/page.tsx` + `error.tsx`): se incluye con migración de colores (no rediseño de layout): fondo `#F2FBE0`, logo/spinner `#4F6A35`, card `rounded-[22px]`, botones `#4F6A35`, textos `text-foreground`/`#6E6E73`, focus ring `#5F7D42/30`. Es la puerta de entrada de la app y hoy usa emerald-600.

Archivos: `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/login/error.tsx`, `src/features/landing/components/{Hero,BentoGrid,LandingHeader,LandingFooter}.tsx`

### 2. Clases `dark:` inertes → eliminar todas

- **Qué**: ~400 ocurrencias `dark:` en 32 archivos de `src/` (el recuento real es mayor que 282 por tokens en strings largas; `globals.css` define `@custom-variant dark` y un bloque `.dark {}` — ambos sin toggle real, se eliminan o se dejan los tokens inertes, decisión del plan).
- **Cómo**: perl/sed mecánico por archivo, removiendo los tokens `dark:*` completos de las clases (`className` con `cn()` y strings). Respetar espacios entre clases.
- **Riesgo**: nulo funcional (sin darkMode activado). Beneficio: grep 100% limpio, código más mantenible.
- **Excepción**: ninguno. Todas se eliminan.
- **Verificación**: grep de `dark:` en `src/` debe dar 0 resultados; `npx tsc --noEmit` y `npm run build` limpios.

### 3. Paleta de cuentas → armonizada y DESACOPLADA

Nueva paleta de 5 tonos (colores de **dato**, no semántica), saturados pero coherentes con la base sage/terracota:

| Tipo | Antes (Tailwind) | Después (hex) |
|---|---|---|
| BANK | `text-blue-500` / `bg-blue-500` | `#4A6FA5` |
| WALLET | `text-purple-500` / `bg-purple-500` | `#8B7EA8` |
| CASH | `text-emerald-500` / `bg-emerald-500` | `#4F6A35` |
| CRYPTO | `text-orange-500` / `bg-orange-500` | `#C08A2E` |
| OTHER | `text-gray-500` / `bg-gray-500` | `#837A75` |

**⚠️ Acoplamiento actual que el plan DEBE romper en el mismo paso** (issue del reviewer):

- `ASSET_HEX_COLORS` (`useAccountsDashboard.ts:12`) está keyed por la clase string exacta (`'text-blue-500': '#3b82f6'`) y se usa como `ASSET_HEX_COLORS[details.color] ?? '#6b7280'` (líneas 105, 145). Si las clases cambian a hex, el lookup falla y todo cae a gris.
- `AccountsList.tsx:80-85` usa `bg.includes('emerald'|'rose'|'blue'|'purple'|'orange')` para elegir el estilo del icono. Con clases hex (`bg-[#4A6FA5]`) el `includes` deja de matchear.
- **`InvestmentsList.tsx:336-344`** (`getAccountColors`): TERCER consumidor del mismo patrón — pasa `details.color` a una cadena `.includes('blue'|'purple'|'emerald'|'orange')`. Con hex, todos los iconos de cuenta del módulo inversiones caen al fallback gris. Debe actualizarse en el MISMO paso que el utils. La línea 44 (`emerald`) lleva el verde Apple `bg-emerald-50 text-emerald-600`.
- **`AccountForm.tsx:69-84`**: CUARTO consumidor — desestructura `const { icon: Icon, color } = getAccountTypeDetails(value)` y aplica `color` como **clase Tailwind**: `<Icon className={cn('w-4 h-4', isSelected ? 'text-white' : color)} />`. Cuando `color` pase a ser hex (`#4A6FA5`), la clase es inválida → los iconos del type-picker pierden color silenciosamente. Debe usar el hex inline (`style={{ color }}`) o una variante de tono.

**Solución**: reestructurar `accountTypeDetailsMap` para que `color`/`bg` sean **hex directos** (no clases): `BANK: { color: '#4A6FA5', bg: '#4A6FA5' }`. Luego:
- `useAccountsDashboard.ts`: reemplazar `ASSET_HEX_COLORS` por lookup directo de `details.color` (o un `Record<AccountType, string>` derivado del utils). Eliminar el fallback `#6b7280` → `#837A75` (o el hex de OTHER).
- `AccountsList.tsx`: reemplazar la cadena `bg.includes(...)` por uso directo del hex con alpha: `style={{ backgroundColor: \`${details.bg}${alpha}\` }}` + color de texto del hex, siguiendo el patrón ya usado en `TransactionList` (icono con `backgroundColor` inline + color del icono).
- `InvestmentsList.tsx` (`getAccountColors`): mismo desacople — usar el hex del tipo de cuenta directamente (style inline con alpha) en lugar de la cadena `includes()`.
- `AccountForm.tsx:84`: `<Icon className={...color} />` → `style={{ color }}` (hex directo), manteniendo `text-white` cuando está seleccionado.

**Nota de validación de dirección**: `SavingsGoalCard.tsx:40` (`${goal.color}20`) y `AccountForm` ya asumen que `color` puede ser hex — confirma que la dirección hex-migración es segura y consistente con el patrón existente.

Consumidores a actualizar: `AssetsTable`, `AssetBar`, `AssetLegend` (hex de `ASSET_HEX_COLORS`), iconos de `AccountsList`, `InvestmentsList.tsx:336` (`getAccountColors`), y `AssetsTable.tsx:268` (`totalColor="text-emerald-600"` → `text-[#4F6A35]`) y `AssetsTable.tsx:280` (`totalColor="text-rose-500"` → `text-[#B5543D]`).

### 4. Charts → paleta unificada en un solo lugar

Crear **`src/lib/config/chart-colors.ts`** (misma convención que `exchange-rates.ts`) con la paleta Kilo de datos:

```ts
// Paleta Kilo de datos para charts (B2)
export const CHART_COLORS = {
  positive:     '#4F6A35',  // línea positiva principal (ingresos / serie actual)
  negative:     '#B5543D',  // línea negativa principal (gastos / serie actual)
  muted:        '#6E6E73',  // ejes / labels / fallbacks gray
  grid:         'rgba(0,0,0,0.08)',
  series: [                 // series adicionales (comparativas) — incluye violeta insights
    '#8B5CF6',              // violeta insights (identidad) — slot 1
    '#7A9B57',
    '#ACC18A',
    '#D9A487',
    '#837A75',
    '#5F7D42',
    '#4A6FA5',
  ],
} as const
```

**Regla de asignación de series** (evita ambigüedad): `TrendChart` usa `CHART_COLORS.series` en orden, `i % series.length` (el violeta `#8B5CF6` queda en slot 1 → primer trend). `CategoryComparison` reemplaza su `FALLBACK_COLORS` **completo** (6 entradas, líneas 36-43) por `CHART_COLORS.series` en orden. `CLUSTER_COLORS` de insights/page reemplaza sus 5 hex por `series` en orden (violeta primero). Para **`FinancialComparisonChart` (4 líneas)** el mapeo explícito es:

| Línea | dataKey | Antes | Después |
|---|---|---|---|
| previousIncome | dashed, width 2 | `#6ee7b7` | `#ACC18A` (series[2]) |
| currentIncome | sólida, width 3 | `#10b981` | `#4F6A35` (positive) |
| previousExpense | dashed, width 2 | `#fda4af` | `#D9A487` (series[3]) |
| currentExpense | sólida, width 3 | `#f43f5e` | `#B5543D` (negative) |

(Las líneas actuales usan `positive`/`negative` sólidos; las anteriores usan tonos claros de la paleta con dasharray, preservando la semántica visual ya-Kilo de CashflowSection.)

Reemplazos por archivo (lista completa del reviewer):

| Archivo | Antes | Después |
|---|---|---|
| `FinancialComparisonChart.tsx` | `#10b981/#6ee7b7/#f43f5e/#fda4af` líneas de serie; `#9ca3af` en ticks (148,155) | `positive/negative` + `series`; `muted` |
| `AmortizationChart.tsx` | `#10b981` (línea serie + **legend swatch `bg-emerald-500` línea 77**); `#9ca3af` ticks (43,48) | `positive`; `muted` |
| `TrendChart.tsx` | `FALLBACK_COLORS` 6 hex (30-33): `#8b5cf6/#06b6d4/#f59e0b/#ec4899/#10b981/#f97316` | `CHART_COLORS.series` (7 entradas) |
| `CategoryComparison.tsx` | `FALLBACK_COLORS` completo (36-43: `#8b5cf6/#06b6d4/#f59e0b/#ec4899/#10b981/#f97316`); gradients `from-rose-500/80 to-red-500/90` (421) y `from-emerald-400/90 to-teal-500/90` (422); `bg-slate-400/*` (207, 412, 439) | `CHART_COLORS.series` en orden; gradients Kilo (`#4F6A35`/`#B5543D` con alpha preservando opacidad por sitio); `bg-[#6E6E73]/20-40` según opacidad original |
| `IncomeExpenseChart.tsx` | ticks `#9ca3af` (80, 88) | `muted` |
| `SummaryCards.tsx` | `isPersonal ? '#9ca3af'` (106) | `muted` |
| `SavingsGoalForm.tsx` | default `#10b981` (41) | `positive` |
| **`types/savings-goal.ts`** | `SAVINGS_GOAL_COLORS[0] = '#10b981'` (29) | primer swatch → `#4F6A35`; resto de la paleta → hex Kilo (reemplazar hex crudos por la familia Kilo) |
| **`lib/validations/savings-goal.schema.ts`** | `color: z.string().default('#10b981')` (12) | default → `#4F6A35` (asegura que metas NUEVAS se creen con Kilo, no solo el form) |
| `TransactionFilters.tsx` | dot fallback `#9ca3af` (306) | `muted` |
| `useTransactionMetrics.ts` | fallback `#9ca3af` (108) | `muted` |
| **`BudgetForm.tsx`** | dot fallback `cat.color ?? '#9ca3af'` (336) | `muted` |
| **`types/budget.ts`** | `BUDGET_STATUS_CONFIG.COMPLETED = { color: 'text-emerald-600', bg: 'bg-emerald-50' }` (81), consumido por `BudgetCard.tsx:7,62` | `{ color: 'text-[#4F6A35]', bg: 'bg-[#F2F9E3]' }` (mantiene el set semántico de 4 estados; ON_TRACK/AT_RISK/OVERDUE azul/naranja/rojo se conservan como estados) |
| **`insights/page.tsx`** | `CLUSTER_COLORS` (89): `#f97316/#06b6d4/#ec4899/#8b5cf6/#10b981` | `series` en orden (violeta primero) |
| **`SavingsTipCard.tsx`** | `hover:border-emerald-500/20` (30) | `hover:border-[#4F6A35]/20` |
| **`CategoryComparison.tsx` (tooltip)** | fallback `'#8b5cf6'` (123) | `CHART_COLORS.series[0]` (centralización) |
| `SankeyCustomNode.tsx` | fallback `#60a5fa` (53) | `#4A6FA5` (azul de la paleta de cuentas) |

Se conservan por identidad: violeta insights (ahora en `series[0]`), indigo inversiones, amber cuotas/transferencias, marcas UBER/YANGO/INDRIVE.

## Orden de ejecución

1. `chart-colors.ts` (define la paleta central)
2. Paleta de cuentas (desacople + consumidores)
3. Charts (reemplazos con la paleta central)
4. Eliminar `dark:` (32 archivos, mecánico)
5. Landing + login (pieza visible final)

## Verificación

- `grep -rn "dark:" src` (excluyendo `gasolina/` y `car-sharing/`, que están fuera de alcance) → 0 resultados
- `grep` de residuos en archivos de alcance: `emerald-500`, `#10b981`, `#9ca3af`, `neutral-900` → 0 (la lista de §4 es exhaustiva para el alcance: landing, login, cuentas, inversiones, budgets, insights, savings-goals, transactions, dashboard, credits)
- `npx tsc --noEmit` → 0 errores
- `npm run build` → ✓ Compiled
- Commit por fase (5 commits) o uno final con mensaje descriptivo

