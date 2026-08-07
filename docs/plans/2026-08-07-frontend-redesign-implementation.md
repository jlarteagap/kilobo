# Kilo Frontend Redesign — Implementation Plan (Kilo Sage)

**Fecha:** 2026-08-07
**Spec:** `docs/superpowers/specs/2026-08-07-frontend-redesign-design.md`
**Manual:** `docs/DESIGN-MANUAL.md`
**Enfoque:** Fundación primero — capas validadas incrementalmente con el usuario.

## Resumen

Tres capas, cada una commiteada y **validada por el usuario** antes de pasar a la siguiente:

1. **Capa 1 — Tokens**: paleta Sage en `globals.css`, Space Grotesk, radios.
2. **Capa 2 — Shell**: sidebar rail de iconos, header con título por página, bottom nav móvil.
3. **Capa 3 — Dashboard**: layout 2 columnas + Sankey full-width + rail derecho.

**Regla de oro:** nada de `dark:` nuevo; los existentes quedan inertes. Validar visualmente en 3 breakpoints.

---

## Capa 1 — Design Tokens

### T1.1 `src/app/globals.css` — Paleta Sage

- Reemplazar los valores de `:root` (mantener la estructura de variables):
  - `--background: #DAFEB7` (menta)
  - `--card`, `--popover: #FFFFFF`
  - `--primary: #5F7D42`, `--primary-foreground: #FFFFFF`
  - `--foreground: #000000`
  - `--muted: #F2F9E3` (nuevo token `--card-soft` también), `--muted-foreground: #837A75`
  - `--growth: #4F6A35`, `--debt: #B5543D`, `--destructive: #B5543D`
  - `--border`, `--input: #E5DED2`
  - `--ring: #5F7D42`
  - `--chart-1..8`: `#5F7D42 #B5543D #ACC18A #837A75 #7A9B57 #C8D9A9 #2A3A22 #D9A487`
  - `--tint-sage: #3C5230` (token nuevo para texto sobre menta)
  - `--sidebar*`: alinear con la paleta (sidebar blanca, hover `#F2F9E3`)
- Añadir `--color-card-soft` y `--color-tint-sage` al bloque `@theme inline`.
- **Mantener** el bloque `.dark` intacto (inert — no se borra para no romper gasolina/car-sharing).

### T1.2 `src/app/layout.tsx` — Space Grotesk

- Importar Space Grotesk de `next/font/google` (variable `--font-grotesk`).
- Mantener Geist (puede seguir como fallback) o reemplazar `--font-sans` por Grotesk.
- Simplificación sugerida: `--font-sans: var(--font-grotesk)` en `globals.css`.

### T1.3 `globals.css` — radios y utilidades

- Añadir utilities `@utility card-organic` y `@utility card-organic-sm` con el radio asimétrico:
  - `card-organic`: `border-radius: 1.75rem 1.75rem 1.75rem 0.25rem` (o `rounded-[1.75rem] rounded-bl-md`).
  - `card-organic-sm`: versión `1.25rem`.
- **Verificación**: `npx tsc --noEmit`, `npm run build`, revisión visual del fondo menta + primario sage.

> **Validación con usuario (capa 1).**

---

## Capa 2 — Shell

### T2.1 `src/components/layout/Sidebar.tsx` — Rail de iconos

- Mantener el componente shadcn `Sidebar` (collapsible="icon" ya soporta rail de 3rem).
- Reemplazar estilos hardcodeados:
  - `bg-white/70 backdrop-blur-xl` → `bg-white border-r border-[#E5DED2]`
  - Items activos: `bg-emerald-50 text-emerald-700` → `bg-[#F2F9E3] text-[#4F6A35]`
  - Items inactivos: `text-neutral-500 hover:bg-neutral-100` → `text-[#837A75] hover:bg-[#F2F9E3]`
  - Logo: chip `bg-emerald-600` → `bg-[#5F7D42]`, texto `text-emerald-600` → `text-[#4F6A35]`
  - Footer: `bg-neutral-100/50` → `bg-[#F2F9E3]`, avatar `bg-emerald-100 text-emerald-700` → `bg-[#F2F9E3] text-[#4F6A35]`, "Cerrar sesión" `text-red-500` → `text-[#B5543D]`
- Renombrar item "Dashboard" (ya apunta a `/`) — mantener ruta `/` y active-state con esa ruta.

### T2.2 `src/components/layout/Header.tsx` — Título por página

- Eliminar "Bienvenido, {firstName}".
- Añadir mapa ruta→título (del manual §10): `/` → "Dashboard", `/accounts` → "Cuentas", etc. Usar `usePathname()`.
- Layout: hamburguesa + título (`text-lg font-semibold text-black`) a la izquierda; QuickActionMenu + avatar a la derecha.
- Estilos: `bg-white/70 backdrop-blur-xl border-neutral-200/50` → `bg-white/80 backdrop-blur-xl border-b border-[#E5DED2]`.

### T2.3 `src/components/layout/BottomNav.tsx` — NUEVO

- Componente cliente (`"use client"`), solo visible en `< md` (Tailwind: `lg:hidden`).
- Barra fija: `fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E5DED2]`.
- 5 slots: Inicio (`/`), Cuentas (`/accounts`), **"+" central**, Transacciones (`/transactions`), Perfil (popover).
- Iconos lucide: Home, Wallet, Plus (central), CreditCard/ArrowRightLeft, User.
- "Inicio" activo cuando `pathname === "/"`; mostrar label `text-[10px]` bajo cada icono; activo en `text-[#4F6A35]`, inactivo `text-[#837A75]`.
- **"+" central**: círculo `size-14 rounded-full bg-[#5F7D42] text-white -mt-6 shadow-lg border-4 border-white` que abre el `QuickActionMenu` (reutiliza el DropdownMenu → adaptar a un popover/sheet en móvil si el dropdown no cabe; opción simple: reutilizar el mismo `QuickActionMenu` con un trigger personalizado).
- **"Perfil"**: popover con avatar+nombre+email, link a `/conductor/settings`, botón "Cerrar sesión" (`#B5543D`).

### T2.4 `src/components/layout/AppLayout.tsx` — Integración

- Renderizar `BottomNav` dentro del layout.
- Ajustar padding inferior del `main` en móvil: `pb-20 lg:pb-6` (para no quedar tapado).
- Fondo: `bg-[#F9FAFB] dark:bg-neutral-950` → `bg-[#DAFEB7]` (o `bg-background`).

### T2.5 `src/components/layout/QuickActionMenu.tsx` — Reskin

- `bg-emerald-600 hover:bg-emerald-700` → `bg-[#5F7D42] hover:bg-[#4F6A35]`.
- Dropdown: `border-neutral-200/50` → `border-[#E5DED2]`, focus items `focus:bg-emerald-50` → `focus:bg-[#F2F9E3]`.
- Diálogo: `rounded-2xl border-neutral-200/50` → `rounded-[1.5rem] border-[#E5DED2]`, header `bg-neutral-50/50` → `bg-[#F2F9E3]/50`.

### T2.6 Verificación shell

- `npx tsc --noEmit`, `npm run build`, `npm run lint`.
- Prueba manual: desktop (rail iconos + header título), móvil (bottom nav + "+" + drawer hamburger + popover perfil), tablet.
- Todas las páginas heredan el shell — verificar que ninguna ruta se rompe.

> **Validación con usuario (capa 2).**

---

## Capa 3 — Dashboard

### T3.1 `src/app/dashboard/page.tsx` — Nuevo layout

Reestructurar el JSX a:

```
<DashboardHeader />                     (label sección + selector mes + card stats)
<CashflowSection />                     (full-width, card orgánica)
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2 space-y-6">   ← principal
    <AssetsSection + FinancialComparisonChart />   (grid interno 1fr/1.4fr)
    <IncomeExpenseChart />
    <DashboardRecentTransactions />
  </div>
  <aside className="space-y-6">                 ← rail 1/3 (lg:sticky top-24 self-start)
    <BalanceProjection />      (card sage destacada)
    <Obligaciones>              (Credits+Debts+Budgets compactos)
    <DashboardSavingsGoals />
    <DriverWidget compacto />
    <InsightsWidget />
    <InvestmentsWidget />
  </aside>
</div>
```

- Mantener el `Dialog` de inversión (solo reskin).
- Móvil: grid colapsa a 1 col (el rail se intercala: Proyección tras el Sankey según spec).

### T3.2 `src/features/dashboard/components/DashboardHeader.tsx` — Rediseño

- **Eliminar** el `h1` de saludo ("Bienvenido, X 👋").
- Fila de título: label de sección (uppercase tracking) + **selector de mes** (control nuevo — verificar si existe `PeriodSelector` reutilizable en transactions; si no, componente simple con `currentPeriod` del hook).
- Card de stats: `rounded-3xl` → `card-organic` (`rounded-[1.75rem] rounded-bl-md`), `border-border/40` → `border-[#E5DED2]`.
- Colores: `text-emerald-500` → `text-[#4F6A35]`, `text-rose-500` → `text-[#B5543D]`, `text-indigo-500/600` → tokens sage.
- Conservar stats (Patrimonio/Ingresos/Gastos/Balance) + breakdown multi-divisa (reskin).

### T3.3 `src/features/dashboard/CashflowSection.tsx` — Sankey full-width

- Card → `card-organic`, borde `#E5DED2`.
- Ancho completo (ya es hijo directo del contenedor → queda full-width natural).
- Altura del SVG ~280px (verificar si hay `height` fija actual; ajustar a `h-[280px]` o `aspect`).
- Colores de nodos/links: revisar `SankeyCustomNode/Link` — mapear emerald/rose → `#4F6A35`/`#B5543D` (y escala sage para categorías).

### T3.4 Rail derecho — cards

- `BalanceProjection.tsx`: card **sage destacada** (`bg-[#5F7D42] text-white rounded-[1.75rem] rounded-bl-md`) — reskin del contenedor; verificar que los textos internos usen colores legibles sobre sage (blanco + `#F2F9E3`).
- `DashboardCredits` / `DashboardDebts` / `DashboardBudgets`: agrupar en card "Obligaciones" (o mantener cards separadas compactas apiladas — decisión en implementación: **cards separadas compactas** para no tocar su lógica).
- `DashboardSavingsGoals`: card normal, reskin.
- `DriverWidget`: compacto (verificar si acepta prop de densidad; si no, solo reskin).
- `InsightsWidget` / `InvestmentsWidget`: reskin a card orgánica.

### T3.5 Skeletons y estados

- `DashboardSkeleton`: adaptar al nuevo layout (esqueleto por zona: header card, sankey, grid 2 col).
- Empty states: reskin si usan colores genéricos.

### T3.6 Verificación dashboard

- `npx tsc --noEmit`, `npm run build`, `npm run lint`.
- Prueba manual 3 breakpoints: layout 2 col + sankey full (desktop), rail intercalado (móvil), sticky rail.
- Revisar contraste: texto sobre card sage, labels `#837A75` sobre menta.

> **Validación con usuario (capa 3) — fin del alcance de esta iteración.**

---

## Commits

1. `feat(ui): sage design tokens + space grotesk`
2. `feat(ui): shell redesign (sidebar rail, header titles, bottom nav)`
3. `feat(dashboard): two-column layout with full-width sankey`

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `dark:` inertes en gasolina/car-sharing se ven raros en claro | No tocar esas páginas en esta iteración; su `dark:` nunca se activa |
| Selector de mes nuevo requiere lógica (no solo estilo) | Verificar `useDashboard`/`currentPeriod` — reutilizar patrón de `PeriodSelector` de transactions |
| Bottom nav reutiliza QuickActionMenu (dropdown en móvil) | Si el DropdownMenu no cabe en móvil, cambiar trigger del "+" a un Sheet con las 6 acciones |
| Rail sticky con 6 cards largas | Usar `lg:sticky top-24 self-start` solo si no excede viewport; si no, scroll natural |
| Sankey colores en `SankeyCustomNode/Link` con hex hardcodeados | Buscar hex y mapear a tokens/sage |
