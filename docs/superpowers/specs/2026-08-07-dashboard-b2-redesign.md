# Kilo Dashboard Redesign — Dirección B2 (Apple-moderno + identidad Kilo)

**Fecha:** 2026-08-07
**Estado:** Aprobado por el usuario (visual companion)
**Alcance:** Refinamiento de la dirección visual, aplicado **solo al dashboard** (capa de iteración sobre las capas 1-3 ya implementadas)

## Contexto

Las capas 1-3 del rediseño Sage ya están implementadas y validadas (tokens, shell, dashboard). Al ver el resultado, el usuario considera que el tratamiento visual se siente "bastante antiguo" y pide modernizarlo con referencias Apple / diseños modernos.

Tras comparación visual (mockups A/B en Visual Companion), el usuario eligió:

- **Dirección B (híbrida):** mantener la personalidad Kilo (paleta sage como acento) con tratamiento moderno estilo Apple.
- **Fondo:** `#F2FBE0` (menta casi blanco — mucho más limpio que el `#DAFEB7` actual).
- **Cards:** blancas sólidas (B2), radio uniforme `22px`, sombra suave, **sin bordes visibles**.
- **Semántica de color:** Kilo (no Apple) — gastos arcilla `#B5543D`, ingresos verde sage `#4F6A35`.
- **Tipografía:** **Inter** (reemplaza a Space Grotesk).
- **Alcance:** solo el dashboard en esta iteración. El shell (sidebar/header/bottom nav) conserva su look actual hasta iteración siguiente.

## Decisiones de diseño (validadas)

| Decisión | Valor |
|---|---|
| Dirección | B híbrida — identidad Kilo + tratamiento Apple-moderno |
| Fondo de página | `#F2FBE0` |
| Superficies (cards) | `#FFFFFF` sólidas, radio uniforme `22px` (`rounded-[22px]`), sombra `0 2px 16px rgba(0,0,0,0.05)` |
| Bordes de card | **ninguno visible** (se elimina el borde `#E5DED2` de las cards) |
| Radios | uniformes `22px` en contenedores; **se eliminan los asimétricos** (`card-organic`) en el dashboard |
| Tipografía | **Inter** (Google Fonts), reemplaza Space Grotesk como `--font-sans` |
| Ingresos / positivo | `#4F6A35` (se mantiene) |
| Gastos / negativo | `#B5543D` (se mantiene) |
| Labels secundarios | gris `#6E6E73` (Apple systemGray) en vez de `#837A75` |
| Título de página | 30px / weight 800 / letter-spacing `-0.03em` |
| Valores numéricos | 22px / weight 800 / `tabular-nums` |
| Card destacada (Proyección) | se mantiene sage `#5F7D42`, mismo radio 22px |
| Chips/period pills | selección con fondo `#F2FBE0` |
| Sidebar/Header/BottomNav | **sin cambios** en esta iteración |

## 1. Tokens a actualizar (alcance global mínimo)

Para que el fondo y la tipografía cambien en todo lo que el dashboard usa:

| Token | Antes | Después |
|---|---|---|
| `--background` | `#DAFEB7` | `#F2FBE0` |
| `--font-sans` | `var(--font-grotesk)` (Space Grotesk) | `var(--font-inter)` (Inter) |
| `--card` / `--popover` | `#FFFFFF` | `#FFFFFF` (sin cambio) |
| `--muted-foreground` | `#837A75` | `#6E6E73` |
| `--border` | `#E5DED2` | se mantiene para inputs/separadores (no para cards) |

Nota: `card-organic` (radios asimétricos) deja de usarse en el dashboard; se conserva la utilidad en `globals.css` por si otras páginas la usan (no tocar su definición).

## 2. Dashboard — cambios por zona

### Header (`DashboardHeader.tsx`)
- Card de stats: `card-organic` + borde → `rounded-[22px]` sin borde, sombra suave, fondo blanco.
- Título: label de mes en `#6E6E73` (11px, semibold, uppercase, tracking 0.04em).
- Valores: `#1D1D1F` (o `--foreground` si se mantiene negro — decidir en implementación según el resto de textos del dashboard), 22px/800, `tabular-nums`.
- Trends: `#4F6A35` (positivo) / `#B5543D` (negativo) — sin cambio de semántica.
- Breakdown multi-divisa: labels `#6E6E73`, valores negro/900.

### Sankey (`CashflowSection.tsx`)
- Card: `card-organic` + borde → `rounded-[22px]`, sin borde, sombra suave.
- Header de sección: título 14px/700, subtítulo `#6E6E73` 11px.
- Leyenda: labels `#6E6E73` con dots del mapeo sage existente (sin cambio de colores).
- Altura sankey: mantener ~280-300px actual.

### Grid 2 col (`page.tsx`)
- Contenedores internos (Activos, Comparativa, Ingresos vs Gastos, Transacciones recientes, widgets del rail): todos a `rounded-[22px]`, sin borde, sombra suave.
- Títulos de card: 14px/700 con letter-spacing `-0.01em` (en vez de los `text-xs uppercase tracking-[0.14em]` actuales).
- Subtítulos: 11px `#6E6E73`.

### Rail derecho
- `BalanceProjection`: **se mantiene** sage `#5F7D42`, radio `22px` (quitar `card-organic`), sombra sage suave. Textos blancos/`#F2F9E3` como ahora.
- `DashboardCredits` / `DashboardDebts` / `DashboardBudgets` / `DashboardSavingsGoals`: cards `rounded-[22px]`, sin borde, sombra suave; headers a 14px/700; labels `#6E6E73`; montos con `tabular-nums`.
- `DriverWidget` / `InsightsWidget` / `InvestmentsWidget`: mismo tratamiento de card; mantener semántica Kilo interna.

### Skeleton (`DashboardSkeleton.tsx`)
- Cards skeleton a `rounded-[22px]`, sin borde; la card sage destacada mantiene `bg-[#5F7D42]`.

## 3. Fuente Inter

- Cargar Inter en `src/app/layout.tsx` (Google Fonts, pesos 400-800) → variable `--font-inter`.
- `--font-sans: var(--font-inter)`.
- Space Grotesk se retira del layout (o queda sin usar); el archivo sigue importándose solo si se decide — verificar que no queden referencias activas.

## 4. Fuera de alcance (iteraciones posteriores)

- Shell (Sidebar, Header, BottomNav, QuickActionMenu): mantienen el look Sage actual — se reskinean en la iteración siguiente.
- Módulos restantes (transacciones, cuentas, créditos, etc.): piel B2 en iteraciones siguientes.
- Landing y login: iteración aparte.
- Dark mode: sigue fuera (inactivo).

## 5. Validación técnica

- `npx tsc --noEmit` — sin errores.
- `npm run build` — build limpio.
- `npm run lint` — sin warnings/errores nuevos en archivos tocados.
- Revisión visual manual del dashboard en 3 breakpoints (desktop 2 col, móvil apilado, sticky rail).
- Verificar contraste: labels `#6E6E73` sobre `#F2FBE0` (≈4.6:1 ✓) y sobre blanco (✓); `#4F6A35`/`#B5543D` sobre blanco (✓).

## 6. Commit

- `feat(dashboard): apply B2 modern direction (inter, f2fbe0, solid cards)` — un solo commit para esta iteración, o dos (tokens+fuente / dashboard) si se prefiere validar en pasos.
