# Kilo Dashboard B2 Redesign — Implementation Plan

**Fecha:** 2026-08-07
**Spec:** `docs/superpowers/specs/2026-08-07-dashboard-b2-redesign.md`
**Enfoque:** Un solo commit de iteración (tokens+fuente + dashboard) con validación visual del usuario al final.

## Resumen

Aplicar la dirección B2 (Apple-moderno + identidad Kilo) al dashboard:
fondo `#F2FBE0`, fuente **Inter**, cards blancas sólidas con radio uniforme 22px sin bordes,
semántica Kilo mantenida (`#4F6A35`/`#B5543D`), labels `#6E6E73`.

**Regla de oro:** no tocar `PeriodSelector` ni `IncomeExpenseChart` (compartidos con `/transactions`);
no tocar el shell (Sidebar/Header/BottomNav); no tocar la utilidad `card-organic` en `globals.css`.

---

## T1 — Tokens globales mínimos

### T1.1 `src/app/globals.css`
- `--background`: `#DAFEB7` → `#F2FBE0` (en `:root`).
- `--muted-foreground`: `#837A75` → `#6E6E73`.
- Verificar que `--card` sigue `#FFFFFF`, `--foreground` `#000000` (sin cambio).
- NO borrar `card-organic` (otras páginas la usan).

### T1.2 `src/app/layout.tsx` — Fuente Inter
- Sustituir la importación de Space Grotesk por Inter (`next/font/google`, pesos 400..800, variable `--font-inter`).
- Eliminar la variable `--font-grotesk` y su `variable` prop.
- En `globals.css`: `--font-sans: var(--font-inter)` (donde hoy está `var(--font-grotesk)`).

### T1.3 Verificación tokens
- `npx tsc --noEmit`, `npm run build`.
- Confirmar en navegador: fondo claro `#F2FBE0` + Inter en todas las páginas (leak aceptado).

---

## T2 — Dashboard

### T2.1 `DashboardHeader.tsx`
- Card stats: `card-organic border-[#E5DED2]` → `rounded-[22px] bg-white` con sombra `0 2px 16px rgba(0,0,0,0.05)` (quitar borde).
- Label de mes: `text-[#837A75] tracking-[0.14em]` → `text-[#6E6E73]` 11px semibold uppercase tracking `0.04em`.
- Valores: mantener `text-[#4F6A35]`/`text-[#B5543D]` para patrimonio/balance, `text-black` para ingresos/gastos → cambiar a `--foreground`; tamaño 22px/800 `tabular-nums`.
- Trends: sin cambio semántico (`#4F6A35` / `#B5543D`).
- Divisa labels: `text-[#837A75]` → `text-[#6E6E73]`; bordes internos `divide-[#E5DED2]` → `divide-[rgba(0,0,0,0.06)]` o eliminar.
- Multi-currency footer: `border-t border-[#E5DED2]` → `border-t border-[rgba(0,0,0,0.06)]`.

### T2.2 `CashflowSection.tsx`
- Card: `card-organic border-[#E5DED2]` → `rounded-[22px] bg-white` + sombra suave, sin borde.
- Título sección: `text-xs uppercase tracking-[0.14em] text-[#3C5230]` → `text-sm font-bold text-foreground tracking-[-0.01em]` (14px/700).
- Subtítulo periodo: `text-[#837A75]/70` → `text-[#6E6E73]` 11px.
- Leyenda: labels `text-[#837A75]/70 tracking-[0.14em]` → `text-[#6E6E73]` 10px semibold uppercase tracking `0.04em`; dots sin cambio.
- Divisor leyenda: `border-t border-[#E5DED2]` → `border-t border-[rgba(0,0,0,0.06)]`.
- `PeriodSelector`: NO tocar (mantiene su estilo actual).
- Skeletons internos (`CashflowSkeleton`/`CashflowEmpty`): misma card `rounded-[22px]` sin borde.

### T2.3 `page.tsx` — grid interno
- (El layout de 2 col + sankey full ya está — no cambia.)
- Títulos de card de la columna principal (AssetsSection, FinancialComparisonChart, Transacciones recientes) y rail: `text-xs uppercase tracking-[0.14em]` → `text-sm font-bold tracking-[-0.01em]` (14px/700), labels `#6E6E73`.
- `IncomeExpenseChart`: NO tocar (card propia se queda tal cual).
- `Dialog` de inversión: `rounded-[2.5rem] border-[#E5DED2]` → `rounded-[22px] border-none` + sombra suave (opcional — es modal compartido; si el reskin del dialog afecta otras rutas, dejar como está).

### T2.4 Widgets del rail
- `BalanceProjection.tsx`: card `card-organic` → `rounded-[22px]` (mantener `bg-[#5F7D42]` text-white, sombra sage). Labels internos blancos/`#F2F9E3` sin cambio.
- `DashboardCredits.tsx` / `DashboardDebts.tsx` / `DashboardBudgets.tsx`: card `card-organic border-[#E5DED2]` → `rounded-[22px]` sin borde + sombra; headers `text-xs uppercase tracking-[0.14em]` → `text-sm font-bold`; labels `#837A75` → `#6E6E73`; divisores `#E5DED2` → `rgba(0,0,0,0.06)`.
- `DashboardSavingsGoals.tsx`: mismo tratamiento (card + header + labels).
- `DriverWidget.tsx`: card `card-organic border-[#E5DED2]` → `rounded-[22px]` sin borde; header "Conductor" `text-xs uppercase` → `text-sm font-bold`; mantener tones sage internos.
- `InsightsWidget.tsx`: cards `card-organic border-[#E5DED2]` → `rounded-[22px]` sin borde; header "Análisis financiero" → `text-sm font-bold`.
- `InvestmentsWidget` (en `InvestmentsList.tsx`): card `card-organic border-[#E5DED2]` → `rounded-[22px]` sin borde; headers → `text-sm font-bold`; labels `#837A75` → `#6E6E73`; divisores `divide-[#E5DED2]` → `rgba(0,0,0,0.06)`. Solo el widget del dashboard — NO tocar `InvestmentsByAccount` (se usa en cuentas, fuera de alcance).

### T2.5 `DashboardSkeleton.tsx`
- Cards skeleton: `card-organic border-[#E5DED2]` → `rounded-[22px]` sin borde.
- Card sage destacada del skeleton: `bg-[#5F7D42] card-organic` → `bg-[#5F7D42] rounded-[22px]`.

### T2.6 Verificación dashboard
- `npx tsc --noEmit`, `npm run build`, `npm run lint` (sin nuevos en archivos tocados).
- Manual 3 breakpoints: desktop (2 col, cards sin borde, radio 22px), móvil (apilado), sticky rail.
- Confirmar contraste `#6E6E73` sobre `#F2FBE0` y blanco; `#4F6A35`/`#B5543D` sobre blanco.

> **Validación con usuario (fin de esta iteración).**

---

## Commits

1. `feat(ui): B2 tokens (f2fbe0 background, inter font, 6e6e73 muted)` — T1
2. `feat(dashboard): B2 solid cards (22px radius, no borders)` — T2

O un solo commit si el usuario prefiere validar todo junto:
- `feat(dashboard): apply B2 modern direction (inter, f2fbe0, solid cards)`

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `--background`/`--muted-foreground` globales reskinean páginas fuera de alcance | Leak aceptado y documentado en el spec — es solo fondo/fuente/grís, no cards |
| Tocar `PeriodSelector` o `IncomeExpenseChart` rompería `/transactions` | Prohibido en este plan — se respetan tal cual |
| `InvestmentsByAccount` (mismo archivo que InvestmentsWidget) se usa en cuentas | Editar SOLO el bloque del widget del dashboard (líneas ~468-572), no tocar el resto del archivo |
| Radio de 22px en cards nuevas vs `rounded-2xl` de IncomeExpenseChart adyacente | Diferencia aceptada deliberadamente (decisión del spec) |
| Contraste `#6E6E73` en tamaños 10-11px | Validado ≈4.6:1 sobre `#F2FBE0` y blanco — ok |
