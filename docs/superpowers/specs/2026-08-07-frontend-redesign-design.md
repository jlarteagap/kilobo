# Kilo Frontend Redesign — Kilo Sage Design System

**Fecha:** 2026-08-07
**Estado:** Aprobado por el usuario
**Alcance:** Capas 1-3 del enfoque fundación primero (tokens + shell + dashboard)

## Contexto

Kilo es una app de finanzas personales (Next.js 16, Tailwind v4, shadcn/ui, Firebase). El frontend actual tiene estilos inconsistentes: tokens editoriales en `globals.css` que no se usan, branding emerald suelto en sidebar/landing/header, dashboard de una sola columna apilada, y `dark:` classes inertes en todo el código.

Un intento previo de rediseño masivo (91 archivos) fue revertido por completo porque el usuario lo rechazó al ver el resultado. **Lección aprendida: validar visualmente en capas pequeñas antes de implementar.**

## Decisiones de diseño (validadas con el usuario vía Visual Companion)

1. **Dirección:** Amigable y moderno, con identidad propia (no genérica).
2. **Identidad:** "Kilo Orgánico" — cálido, orgánico, con carácter.
3. **Paleta:** "Kilo Sage" — derivada de las anclas del usuario (`#000000`, `#837A75`, `#ACC18A`, `#DAFEB7`). **Sin terracota** (descartada por el usuario).
4. **Tipografía:** Space Grotesk (geométrica espaciada) + labels uppercase con letter-spacing.
5. **Layout dashboard:** Dos columnas (principal 2/3 + rail 1/3) con Sankey a ancho completo.
6. **Navegación móvil:** Bottom nav con botón "+" central (Inicio · Cuentas · [+] · Transacciones · Perfil).
7. **Shell desktop:** Rail de iconos (sidebar colapsada) + header con título de página.
8. **Sin dark mode:** la clase `.dark` y las variantes `dark:` quedan inertes (no se activan).
9. **Enfoque de implementación:** Fundación primero — capas pequeñas validadas incrementalmente.

## 1. Design Tokens (Capa 1)

### Paleta Sage

Escala sage derivada (9 tonos): `#2A3A22` → `#3C5230` → `#4F6A35` → `#5F7D42` → `#7A9B57` → `#ACC18A` → `#CDE3A9` → `#DAFEB7` → `#F2F9E3`.

### Tokens semánticos

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#DAFEB7` | Fondo de página (menta) |
| `--card` / `--popover` | `#FFFFFF` | Superficies elevadas |
| `--card-soft` | `#F2F9E3` | Insets, hover, superficies suaves |
| `--primary` | `#5F7D42` | Acción primaria (blanco: 4.6:1 ✓) |
| `--primary-foreground` | `#FFFFFF` | Texto sobre primario |
| `--foreground` | `#000000` | Texto principal (21:1 ✓) |
| `--muted-foreground` | `#837A75` | Texto secundario (4.9:1 ✓) |
| `--growth` | `#4F6A35` | Ingresos, positivo, ahorro |
| `--debt` | `#B5543D` | Gastos, negativo, deuda (arcilla) |
| `--border` / `--input` | `#E5DED2` | Bordes cálidos (taupe claro) |
| `--ring` | `#5F7D42` | Focus ring |
| `--chart-1..8` | `#5F7D42 #B5543D #ACC18A #837A75 #7A9B57 #C8D9A9 #2A3A22 #D9A487` | Charts categóricos |
| `--tint-sage` | `#3C5230` | Texto sobre fondos menta |

### Tipografía
- **`--font-sans`**: Space Grotesk (se carga vía Google Fonts en `src/app/layout.tsx`, reemplaza/convive con Geist).
- Labels de sección: `text-xs uppercase tracking-[0.14em] font-semibold text-[#837A75]`.
- Cifras monetarias: `font-variant-numeric: tabular-nums`.

### Radios orgánicos
- Cards: `rounded-[1.75rem] rounded-bl-md` (asimétrico — el sello Kilo).
- Botones: `rounded-full` (píldora).
- Inputs/selects: `rounded-xl`.
- Chips/badges: `rounded-full`.

### Dark mode
- La clase `.dark`, `@custom-variant dark` y las variantes `dark:` **quedan inertes** — nunca se activan (no hay ThemeProvider).
- No se borran del código para no romper páginas especiales (gasolina, car-sharing) que dependen de `dark:` propio.
- Ningún componente nuevo lleva `dark:`.

## 2. Shell (Capa 2)

### Desktop (≥ 1024px) — Rail de iconos
- `Sidebar.tsx`: rail angosto (~64px), solo iconos con tooltip, colapsable. Fondo blanco, borde derecho `--border`.
- Logo: icono `Wallet` en chip sage + "Kilo" visible solo expandido.
- Item activo: chip `#F2F9E3` + icono `#4F6A35` + barrita indicadora izquierda.
- `Header.tsx`: sticky 64px, fondo blanco translúcido con blur, hamburguesa + **título de página actual** (no "Bienvenido" genérico) + botón "+ Nuevo" píldora sage + avatar.
- Bottom nav oculta en desktop.

### Móvil (< 768px) — Bottom nav
- **Nuevo componente `BottomNav.tsx`**: barra fija inferior, 5 slots — Inicio · Cuentas · [+] central · Transacciones · Perfil.
- Botón "+" central: círculo sage elevado (sobresale del borde), abre el `QuickActionMenu` existente (6 acciones).
- Sidebar oculta por completo; header conserva título + avatar.
- Contenido con padding bottom suficiente (`pb-20`) para no quedar tapado.

### Tablet (768-1023px)
- Misma bottom nav que móvil.
- Header simplificado: hamburguesa (para drawer) + título.

### Archivos afectados
- `src/components/layout/Sidebar.tsx` → refactor a rail iconos.
- `src/components/layout/Header.tsx` → título por página, botón Nuevo.
- `src/components/layout/BottomNav.tsx` → **nuevo**.
- `src/components/layout/AppLayout.tsx` → integra BottomNav, ajusta paddings.
- Header muestra título de página actual (saludo "Bienvenido" solo en dashboard).

## 3. Dashboard (Capa 3)

### Estructura desktop

```
Header (título + botón "+")
├─ Card Patrimonio Neto (selector mes/divisa, cifra, mini-stats Ingresos/Gastos/Ahorro)
├─ Card Flujo de Caja (Sankey) ← FULL-WIDTH
└─ Grid 2 col:
   ├─ Principal (2/3): Activos+Comparativa → Ingresos vs Gastos → Transacciones recientes
   └─ Rail (1/3): Proyección (sage) → Obligaciones → Metas de ahorro → Conductor → InsightsWidget → InvestmentsWidget
```

### Mapeo de widgets

| Zona | Widget | Cambio |
|---|---|---|
| Header | `DashboardHeader` | Rediseño: stats compactas, selector mes/divisa, tabular-nums |
| Sankey full | `CashflowSection` | Ancho completo, ~280px, card blanca |
| Principal | `AssetsSection` + `FinancialComparisonChart` | Lado a lado en grid interno |
| Principal | `IncomeExpenseChart` | Fila siguiente |
| Principal | `DashboardRecentTransactions` | Fila final (5-6 últimas) |
| Rail | `BalanceProjection` | Card sage destacada (`#5F7D42`) |
| Rail | `DashboardCredits` + `DashboardDebts` + `DashboardBudgets` | Compactados en "Obligaciones" |
| Rail | `DashboardSavingsGoals` | "Metas de ahorro" |
| Rail | `DriverWidget` | Compacto al final del rail |
| Rail | `InsightsWidget` | AI — va al rail derecho |
| Rail | `InvestmentsWidget` | Inversiones — va al rail derecho |
| — | `DashboardSkeleton` | Actualizar al nuevo layout |

### Móvil
- Todo colapsa a una columna: header → sankey → widgets apilados.
- Mini-stats en grid 2×2.
- Rail derecho se intercala entre secciones de la principal (proyección tras el sankey).

## 4. Primitivas y componentes UI

| Componente | Cambio |
|---|---|
| `button.tsx` | primary `#5F7D42`/blanco/`rounded-full`, secondary `#F2F9E3`/`#4F6A35`, ghost transparente, destructive `#B5543D` |
| `card.tsx` | `rounded-[1.75rem] rounded-bl-md`, borde `#E5DED2`, sombra suave |
| `input.tsx` / `select.tsx` / `textarea.tsx` | `rounded-xl`, borde `#E5DED2`, focus ring `#5F7D42` |
| Tabs/badges/chips | Activo: sage claro + verde oscuro; éxito `#F2F9E3`/`#4F6A35`; peligro `#FAEDE9`/`#B5543D` |

## 5. Estados

- **Loading**: `DashboardSkeleton` adaptado por zona (no una card gigante).
- **Vacío**: empty-states actuales con piel nueva.
- **Error**: `error.tsx` conservados, solo ajuste de estilo si usan colores genéricos.

## 6. Validación técnica

- `npx tsc --noEmit` — sin errores.
- `npm run build` — build limpio.
- `npm run lint` — sin warnings nuevos.
- Revisión visual manual en 3 breakpoints.
- Verificar que la app funciona solo en claro (sin dark).

## 7. Commits por capa (validación incremental)

1. `feat(ui): sage design tokens + space grotesk`
2. `feat(ui): shell redesign (sidebar rail, header, bottom nav)`
3. `feat(dashboard): two-column layout with full-width sankey`

Cada capa se valida con el usuario antes de pasar a la siguiente.

## Fuera de alcance (iteraciones posteriores)

- Módulos restantes (cuentas, transacciones, deudas, presupuestos, categorías, insights, ahorros, conductor, inversiones): heredan el shell nuevo automáticamente; su piel Sage se aplica en iteraciones siguientes.
- Landing page y login: se revisan en iteración aparte.
- Dark mode: fuera de alcance (no deseado).
