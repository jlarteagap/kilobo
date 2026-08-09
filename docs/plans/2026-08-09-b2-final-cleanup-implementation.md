# Kilo B2 Final Cleanup — Implementation Plan

**Fecha:** 2026-08-09
**Spec:** `docs/superpowers/specs/2026-08-09-b2-final-cleanup-design.md`
**Enfoque:** 5 tareas ordenadas por dependencia (paleta central → cuentas → charts → dark: → landing/login), con verificación (tsc + build) al final de cada fase y un commit por fase.

## Resumen

Cerrar la dirección visual B2 en los 4 frentes restantes: landing pública + login (identidad Kilo), clases `dark:` inertes (eliminar), paleta de cuentas (hex desacoplado) y charts (paleta unificada en `chart-colors.ts`).

**Regla de oro:** NO tocar `src/app/gasolina/*` ni `src/app/car-sharing/*` (públicas, fuera de alcance). NO cambiar lógica de negocio, tipos ni queries — solo estilos/colores. Preservar colores de identidad: violeta insights (`#8B5CF6`), indigo inversiones, amber cuotas/transferencias, marcas UBER/YANGO/INDRIVE.

**Paleta final (fuente de verdad):**

| Token | Hex | Uso |
|---|---|---|
| `positive` | `#4F6A35` | ingresos / línea actual / sage |
| `negative` | `#B5543D` | gastos / línea actual / terracota |
| `muted` | `#6E6E73` | ejes / labels / fallbacks gray |
| `grid` | `rgba(0,0,0,0.08)` | grids de charts |
| `series[0]` | `#8B5CF6` | violeta insights (identidad) |
| `series[1]` | `#7A9B57` | — |
| `series[2]` | `#ACC18A` | previous income (dashed) |
| `series[3]` | `#D9A487` | previous expense (dashed) |
| `series[4]` | `#837A75` | — |
| `series[5]` | `#5F7D42` | — |
| `series[6]` | `#4A6FA5` | azul de cuenta (BANK) |

**Paleta de cuentas:** BANK `#4A6FA5` · WALLET `#8B7EA8` · CASH `#4F6A35` · CRYPTO `#C08A2E` · OTHER `#837A75`.

---

## T1 — Paleta central `src/lib/config/chart-colors.ts`

### T1.1 Crear el archivo
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

### T1.2 Verificación
- `npx tsc --noEmit` → 0 errores.

---

## T2 — Paleta de cuentas (hex desacoplado)

### T2.1 `src/features/accounts/utils/account-display.utils.ts`
Cambiar `accountTypeDetailsMap` de clases Tailwind a hex directos:
```ts
BANK:   { label: "Banco",             icon: Building2,  color: "#4A6FA5", bg: "#4A6FA5" },
WALLET: { label: "Billetera Digital", icon: Wallet,     color: "#8B7EA8", bg: "#8B7EA8" },
CASH:   { label: "Efectivo",          icon: Banknote,   color: "#4F6A35", bg: "#4F6A35" },
CRYPTO: { label: "Cripto",            icon: Bitcoin,    color: "#C08A2E", bg: "#C08A2E" },
OTHER:  { label: "Otro",              icon: PiggyBank,  color: "#837A75", bg: "#837A75" },
```

### T2.2 `src/features/accounts/hooks/useAccountsDashboard.ts`
- Reemplazar `ASSET_HEX_COLORS` (Record keyed por clase string) por lookup directo:
  `const hexColor = getAccountTypeDetails(account.type).color` (o un `Record<AccountType, string>` exportado desde el utils).
- Eliminar fallbacks `#6b7280` → `#837A75` (OTHER).
- Líneas 105 y 145 usan `ASSET_HEX_COLORS[details.color] ?? '#6b7280'` → reemplazar por el hex directo.

### T2.3 `src/features/accounts/AccountsList.tsx` (líneas 80-85)
- Reemplazar la cadena `bg.includes('emerald'|'rose'|'blue'|'purple'|'orange')` por uso del hex con alpha inline:
  - `style={{ backgroundColor: \`${details.bg}18\` }}` + `style={{ color: details.color }}` (patrón TransactionList).
  - NOTA: verificar si usa `bg` (del details) o si hay que ajustar el lookup del icono a `getAccountTypeDetails(account.type)`.

### T2.4 `src/features/investments/InvestmentsList.tsx` (líneas 336-344, `getAccountColors`)
- Reemplazar la cadena `includes('blue'|'purple'|'emerald'|'orange')` por el hex directo del tipo (style inline con alpha), misma estrategia que T2.3.
- La línea 44 (fallback `bg-emerald-50 text-emerald-600`) desaparece al unificar.

### T2.5 `src/features/accounts/AccountForm.tsx` (línea 84)
- `<Icon className={cn('w-4 h-4', isSelected ? 'text-white' : color)} />` → `style={{ color }}` cuando no seleccionado (mantener `text-white` cuando está seleccionado).

### T2.6 Derivados del dashboard
- `AssetsTable.tsx:268`: `totalColor="text-emerald-600"` → `totalColor="text-[#4F6A35]"`.
- `AssetsTable.tsx:280`: `totalColor="text-rose-500"` → `totalColor="text-[#B5543D]"`.
- Verificar `AssetBar`/`AssetLegend`: usan `asset.color` (hex de AssetSummary) — sin cambio si el hex ya viaja desde el hook.

### T2.7 Verificación
- `npx tsc --noEmit`, `npm run build`.
- Grep: `grep -rn "text-blue-500\|text-purple-500\|text-emerald-500\|text-orange-500\|text-gray-500" src/features/accounts src/features/investments` → 0 (fuera de gasolina/car-sharing).

---

## T3 — Charts (paleta unificada)

Reemplazos según la tabla exhaustiva del spec (§4). Importar `CHART_COLORS` de `@/lib/config/chart-colors`.

| Archivo | Cambio |
|---|---|
| `FinancialComparisonChart.tsx` | Constantes de serie (líneas ~8-10): `previousIncome #6ee7b7`→`series[2]`, `currentIncome #10b981`→`positive`, `previousExpense #fda4af`→`series[3]`, `currentExpense #f43f5e`→`negative`. Ticks `#9ca3af` (148,155) → `muted` |
| `AmortizationChart.tsx` | `#10b981` (serie 43, gradient 36-37, activeDot 69) → `positive`; legend swatch `bg-emerald-500` (77) → `bg-[#4F6A35]`; `#9ca3af` (43,48) → `muted` |
| `TrendChart.tsx` | `FALLBACK_COLORS` (30-33) → `CHART_COLORS.series` (7 entradas), `i % series.length` |
| `CategoryComparison.tsx` | `FALLBACK_COLORS` (36-43) → `series`; `#10b981` (41) incluido; gradients (421 `from-rose-500/80 to-red-500/90` → `from-[#B5543D]/80 to-[#B5543D]/90`, 422 `from-emerald-400/90 to-teal-500/90` → `from-[#4F6A35]/90 to-[#4F6A35]/90`); `bg-slate-400/*` (207,412,439) → `bg-[#6E6E73]/20-40` preservando opacidad; tooltip fallback (123) → `series[0]` |
| `IncomeExpenseChart.tsx` | ticks `#9ca3af` (80,88) → `muted` |
| `SummaryCards.tsx` | `isPersonal ? '#9ca3af'` (106) → `muted` |
| `SavingsGoalForm.tsx` | default `#10b981` (41) → `positive` |
| `types/savings-goal.ts` | `SAVINGS_GOAL_COLORS` (29): primer swatch `#10b981` → `#4F6A35`; reemplazar hex crudos restantes por familia Kilo (mantener ~10 opciones) |
| `lib/validations/savings-goal.schema.ts` | `color: z.string().default('#10b981')` (12) → `default('#4F6A35')` |
| `TransactionFilters.tsx` | dot fallback `#9ca3af` (306) → `muted` |
| `useTransactionMetrics.ts` | fallback `#9ca3af` (108) → `muted` |
| `BudgetForm.tsx` | dot fallback `cat.color ?? '#9ca3af'` (336) → `muted` |
| `types/budget.ts` | `BUDGET_STATUS_CONFIG.COMPLETED` (81): `text-emerald-600 bg-emerald-50` → `text-[#4F6A35] bg-[#F2F9E3]` |
| `insights/page.tsx` | `CLUSTER_COLORS` (89) → `series` en orden (violeta primero) |
| `SavingsTipCard.tsx` | `hover:border-emerald-500/20` (30) → `hover:border-[#4F6A35]/20` |
| `SankeyCustomNode.tsx` | fallback `#60a5fa` (53) → `#4A6FA5` |

### T3.x Verificación
- `npx tsc --noEmit`, `npm run build`.
- Grep: `grep -rn "#10b981\|#9ca3af\|emerald-500\|#f43f5e\|#6ee7b7\|#fda4af" src` (excluyendo gasolina/car-sharing) → 0.

---

## T4 — Eliminar clases `dark:` inertes

### T4.1 Detección
- `grep -rln "dark:" src --include="*.tsx"` → lista de archivos (excluir `gasolina/`, `car-sharing/`).

### T4.2 Eliminación mecánica (perl)
Para cada archivo, eliminar cada token `dark:*` completo respetando espacios. RegEx sugerido:
```bash
perl -pi -e 's/\bdark:[^ ]*//g; s/ +/ /g; s/ ?([,)"])/$1/g' <archivo>
```
- ADVERTENCIA: ejecutar en archivos UNO A UNO y revisar el diff por archivo. Si un `dark:` aparece en JS/strings no-className (ej. key del theme, lógica), NO tocar (verificar primero).
- `globals.css`: `@custom-variant dark` y bloque `.dark {}` — decisión del plan: **eliminar `@custom-variant dark`** (sin toggle real) o dejar tokens inertes. Recomendado: eliminar `@custom-variant dark` y el bloque `.dark` completo.
- `layout.tsx` / `providers`: verificar que NO exista `ThemeProvider` ni `next-themes` montado (el revisor confirmó que no). Si existe un `suppressHydrationWarning`/`class` default, dejar como está.

### T4.3 Verificación
- `grep -rn "dark:" src --include="*.tsx" --include="*.ts" --include="*.css"` (excluyendo gasolina/car-sharing) → 0.
- `npx tsc --noEmit`, `npm run build`.

---

## T5 — Landing + login a identidad Kilo

### T5.1 `src/app/page.tsx` (landing)
- Fondo: `bg-neutral-50` → `bg-[#F2FBE0]` (o `bg-background`).
- Spinner de carga: `border-emerald-600` → `border-[#4F6A35]`; fondo `bg-white` → `bg-[#F2FBE0]`.
- Selection: `selection:bg-emerald-100 selection:text-emerald-900` → `selection:bg-[#C8D9A9] selection:text-[#3C5230]`.
- CTA "Crear tu cuenta": `bg-emerald-600 hover:bg-emerald-500 focus-visible:outline-emerald-600` → `bg-[#4F6A35] hover:bg-[#3C5230] focus-visible:outline-[#4F6A35]`.

### T5.2 `src/features/landing/components/Hero.tsx`
- Fondo sección: `bg-neutral-50` → `bg-[#F2FBE0]`.
- H1: `text-neutral-900` → `text-foreground`.
- Párrafo: `text-neutral-500` → `text-[#6E6E73]`.
- CTA: `bg-neutral-900 hover:bg-neutral-800 ring-neutral-900` → `bg-[#4F6A35] hover:bg-[#3C5230]` (quitar ring o usar `ring-[#4F6A35]`).
- Widget "Pulse": card `rounded-2xl bg-white border border-neutral-200 shadow-sm` → `rounded-[22px] bg-white` + `boxShadow: 0 2px 16px rgba(0,0,0,0.05)`, sin borde. Gradient `from-emerald-50/50` → `from-[#F2F9E3]/50`. Badge `bg-emerald-50 text-emerald-700 ring-emerald-600/20` → `bg-[#F2F9E3] text-[#4F6A35] ring-[#4F6A35]/20`. Monto `text-emerald-600` → `text-[#4F6A35]`. Labels `text-neutral-500`/`text-neutral-400` → `text-[#6E6E73]`. Progress `bg-neutral-100` → `bg-[rgba(0,0,0,0.06)]`, fill `bg-emerald-500` → `bg-[#4F6A35]`.

### T5.3 `src/features/landing/components/LandingHeader.tsx`
- Header: `border-neutral-200 bg-neutral-50/80` → `border-[rgba(0,0,0,0.06)] bg-[#F2FBE0]/80`.
- Logo: `bg-emerald-600 text-white ring-emerald-600/20` → `bg-[#4F6A35] text-white ring-[#4F6A35]/20`.
- Nombre: `text-neutral-900` → `text-foreground`.
- Link "Iniciar Sesión": `text-neutral-600 hover:text-neutral-900` → `text-[#6E6E73] hover:text-foreground`.
- CTA: `bg-neutral-900 hover:bg-neutral-800` → `bg-[#4F6A35] hover:bg-[#3C5230]`.

### T5.4 `src/features/landing/components/BentoGrid.tsx`
- Sección: `bg-neutral-50` → `bg-[#F2FBE0]`.
- Cards (3): `rounded-2xl bg-white border border-neutral-200 shadow-sm` → `rounded-[22px] bg-white` + `boxShadow` inline, sin borde. Hover `hover:border-neutral-300` → quitar.
- Iconos: `bg-neutral-100 text-neutral-600` → `bg-[#F2F9E3] text-[#4F6A35]`.
- Títulos: `text-neutral-900` → `text-foreground`. Textos: `text-neutral-500` → `text-[#6E6E73]`.
- Fake-UI: contenedores `bg-neutral-50 border-neutral-100` → `bg-[#F2F9E3]/40 border-[rgba(0,0,0,0.06)]`; labels `text-neutral-700` → `text-foreground`; barras `bg-neutral-200` → `bg-[rgba(0,0,0,0.06)]`; fill `bg-emerald-500` → `bg-[#4F6A35]`; `bg-amber-500` → `bg-[#C08A2E]`; montos `text-neutral-900` → `text-foreground`; `text-neutral-600` → `text-[#6E6E73]`; `text-emerald-600` → `text-[#4F6A35]`; `text-rose-600` → `text-[#B5543D]`; `border-neutral-100` → `border-[rgba(0,0,0,0.06)]`; `text-neutral-400` → `text-[#6E6E73]`.

### T5.5 `src/features/landing/components/LandingFooter.tsx`
- Footer: `border-neutral-200 bg-neutral-50` → `border-[rgba(0,0,0,0.06)] bg-[#F2FBE0]`.
- Textos: `text-neutral-500 hover:text-neutral-900` → `text-[#6E6E73] hover:text-foreground`.

### T5.6 `src/app/login/page.tsx` + `src/app/login/error.tsx`
- Fondo: `bg-neutral-50 dark:bg-neutral-950` → `bg-[#F2FBE0]` (sin dark).
- Spinner: `border-emerald-600` → `border-[#4F6A35]`.
- Card: `rounded-2xl bg-white shadow-xl shadow-neutral-200/50 ring-1 ring-neutral-200` → `rounded-[22px] bg-white` + `boxShadow` B2, sin ring.
- Logo: `bg-emerald-600 ring-emerald-600/20` → `bg-[#4F6A35] ring-[#4F6A35]/20`.
- Títulos: `text-neutral-900` → `text-foreground`. Subtítulos: `text-neutral-600` → `text-[#6E6E73]`.
- Inputs: `border-neutral-300 focus:ring-emerald-500 hover:bg-neutral-50` → `border-[rgba(0,0,0,0.08)] focus:ring-[#5F7D42]/30 hover:bg-[#F2F9E3]` (patrón forms B2).
- Botón submit: `bg-neutral-900 hover:bg-neutral-800` → `bg-[#4F6A35] hover:bg-[#3C5230]`.
- Links: `text-emerald-600` → `text-[#4F6A35]`.
- Error: `text-rose-*`/`bg-rose-*` → `text-[#B5543D]`/`bg-[#FAEDE9]`.
- Eliminar todas las `dark:` del archivo (ya cubierto por T4 si se ejecuta antes; si no, aquí).

### T5.7 Verificación
- `npx tsc --noEmit`, `npm run build`.
- Grep landing+login: `grep -rn "emerald-\|neutral-\|#10b981\|#9ca3af" src/app/page.tsx src/app/login src/features/landing` → 0.
- Validación visual en navegador: `/`, `/login`.

---

## Orden de commits

1. `feat(ui): chart-colors.ts central palette` — T1
2. `feat(accounts): B2 hex account palette (decoupled consumers)` — T2
3. `feat(charts): unified Kilo chart palette` — T3
4. `chore(ui): remove inert dark: classes` — T4
5. `feat(landing): B2 landing + login identity` — T5

## Verificación global final

- `npx tsc --noEmit` → 0 errores.
- `npm run build` → ✓ Compiled.
- `npm run lint` → sin errores nuevos (baseline documentado).
- Grep residuos (excluyendo gasolina/car-sharing): `dark:`, `#10b981`, `#9ca3af`, `emerald-500`, `text-gray-500 bg-gray-500` → 0 en alcance.
