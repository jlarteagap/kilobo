# Kilo B2 Final Cleanup — Landing pública, dark: inertes, paleta de cuentas y charts

**Fecha:** 2026-08-09
**Estado:** Aprobado por el usuario (decisión delegada: "escoge la versión que mejor se acomode con el proyecto")
**Alcance:** Cierre final de la dirección visual B2 sobre 4 frentes: landing pública, clases `dark:` inertes, paleta de cuentas y colores de charts.

## Contexto

El rediseño B2 (tokens → dashboard → shell → global → 9 módulos → componentes compartidos) está completo y commiteado (8 commits, ~120 archivos). Quedan 4 frentes que el grep final marcó como residuos conocidos o fuera de alcance:

1. **Landing pública** (`src/app/page.tsx` + `src/features/landing/components/*`): usa verde Apple `emerald-600`, fondo `neutral-50`, botones negros `bg-neutral-900`, cards con bordes `neutral-200`. Es la única pieza visible que contradice la identidad B2.
2. **Clases `dark:` inertes**: 282 clases en 30 archivos. La app NO tiene dark mode (sin toggle, sin `darkMode` en globals, middleware no lo expone). Son código muerto.
3. **Paleta de cuentas** (`account-display.utils.ts`): colores crudos de Tailwind (blue-500, purple-500, emerald-500, orange-500, gray-500). El `emerald-500` es justamente el verde Apple excluido de la UI.
4. **Charts**: 3 familias de colores mezcladas — ya-Kilo (CashflowSection, IncomeExpenseChart, BalanceProjection, ShiftAnalytics, Sankey), Apple (FinancialComparisonChart, AmortizationChart, TrendChart, CategoryComparison) y `#9ca3af` crudo.

## Decisiones de diseño (aprobadas)

### 1. Landing pública → identidad Kilo completa

| Decisión | Valor |
|---|---|
| Fondo | `#F2FBE0` (token `--background`) en vez de `neutral-50` |
| Cards | `bg-white rounded-[22px]` + `boxShadow: 0 2px 16px rgba(0,0,0,0.05)`, sin bordes |
| Botones CTA | `bg-[#4F6A35] hover:bg-[#3C5230]` (en vez de emerald-600 / neutral-900) |
| Semántica | ingresos `#4F6A35`, gastos `#B5543D` (fake-UI de BentoGrid, progress bars) |
| Header/Footer | textos `text-foreground` / `#6E6E73`, header con blur (estilo shell) |
| Widget "Pulse" del Hero | réplica de un widget real del dashboard (card blanca, monto `#4F6A35`, badge sage) |
| `dark:` | se eliminan de la landing (página pública, sin dark mode) |

Archivos: `src/app/page.tsx`, `src/features/landing/components/{Hero,BentoGrid,LandingHeader,LandingFooter}.tsx`

### 2. Clases `dark:` inertes → eliminar todas

- **Qué**: 282 clases `dark:` en 30 archivos de `src/`.
- **Cómo**: perl/sed mecánico por archivo, removiendo los tokens `dark:*` de las clases (`className` con `cn()` y strings). En strings con múltiples clases, se elimina cada token `dark:` completo respetando espacios.
- **Riesgo**: nulo funcional (sin darkMode activado). Beneficio: grep 100% limpio, código más mantenible, bundle menor.
- **Excepción**: ninguno. Todas se eliminan.
- **Verificación**: grep de `dark:` debe dar 0 resultados; `npx tsc --noEmit` y `npm run build` limpios.

### 3. Paleta de cuentas → armonizada con identidad Kilo

Nueva paleta de 5 tonos (colores de **dato**, no semántica), saturados pero coherentes con la base sage/terracota:

| Tipo | Antes (Tailwind) | Después (hex) |
|---|---|---|
| BANK | `text-blue-500` / `bg-blue-500` | `#4A6FA5` |
| WALLET | `text-purple-500` / `bg-purple-500` | `#8B7EA8` |
| CASH | `text-emerald-500` / `bg-emerald-500` | `#4F6A35` |
| CRYPTO | `text-orange-500` / `bg-orange-500` | `#C08A2E` |
| OTHER | `text-gray-500` / `bg-gray-500` | `#837A75` |

Aplicación:
- `src/features/accounts/utils/account-display.utils.ts` (clases `text-*`/`bg-*`)
- `src/features/accounts/hooks/useAccountsDashboard.ts` (`ASSET_HEX_COLORS`)
- Derivados en `AssetsTable` / `AssetBar` / `AssetLegend` si mapean clases a hex
- Cualquier otro consumidor de `getAccountTypeDetails`

Los iconos de tipo de cuenta en `AccountsList.tsx` que ya usan blue/purple/orange (colores de datos) se actualizan al nuevo hex correspondiente.

### 4. Charts → paleta unificada en un solo lugar

Crear **`src/lib/config/chart-colors.ts`** (misma convención que `exchange-rates.ts`) con la paleta Kilo de datos:

```ts
// Paleta Kilo de datos para charts (B2)
export const CHART_COLORS = {
  positive:     '#4F6A35',  // ingresos / serie 1 / positivo
  negative:     '#B5543D',  // gastos / serie 2 / negativo
  muted:        '#6E6E73',  // ejes / labels / gray-400 crudo
  grid:         'rgba(0,0,0,0.08)',
  series: [                 // series adicionales (comparativas)
    '#7A9B57',
    '#ACC18A',
    '#D9A487',
    '#837A75',
    '#5F7D42',
  ],
} as const
```

Reemplazos por archivo:
- `FinancialComparisonChart.tsx`: `#10b981/#6ee7b7/#f43f5e/#fda4af` → `positive/negative` + series
- `AmortizationChart.tsx`: `#10b981` → `positive`; `#9ca3af` → `muted`
- `TrendChart.tsx` (insights): `#06b6d4/#ec4899/#f59e0b/#f97316` → series Kilo (se conserva el violeta `#8b5cf6` de identidad y el `#10b981`→`positive`)
- `CategoryComparison.tsx`: mezcla → series Kilo
- `IncomeExpenseChart.tsx`: `#9ca3af` → `muted`
- Se conservan por identidad: violeta insights, indigo inversiones, amber cuotas/transferencias, marcas UBER/YANGO/INDRIVE.

## Orden de ejecución

1. `chart-colors.ts` (define la paleta central)
2. Paleta de cuentas (consume la nueva paleta)
3. Eliminar `dark:` (30 archivos, mecánico)
4. Landing (pieza visible final)

## Verificación

- `grep -rn "dark:" src` → 0 resultados
- `grep` de residuos (`emerald-500`, `#10b981`, `#9ca3af`, `neutral-900` en landing) → 0 en alcance
- `npx tsc --noEmit` → 0 errores
- `npm run build` → ✓ Compiled
- Commit por fase (4 commits) o uno final con mensaje descriptivo
