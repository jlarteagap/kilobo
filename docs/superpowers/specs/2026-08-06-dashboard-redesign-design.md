# Dashboard Redesign + Editorial Design System

- **Fecha:** 2026-08-06
- **Estado:** Validado con el usuario (Aprobado)
- **Alcance:** Rediseño del dashboard principal + sistema de tema editorial para toda la app + directrices de diseño

## Contexto y problema

El dashboard actual está compuesto por una sola columna de ancho completo (`max-w-7xl`): cada sección (header de stats, Sankey, widgets, gráficos, insights, transacciones) ocupa todo el ancho y se apila verticalmente, generando un scroll infinito sin estructura de columnas. El usuario lo describe como: *"mucha estructura de una sola fila, sin columnas. Frontend y UI está simple"*.

Además, la base de tema está **incompleta**: `next-themes` está instalado y `sonner` lo usa, las variables `.dark` y los estilos `dark:` existen por todo el proyecto, **pero no hay `ThemeProvider` montado en `layout.tsx`** ni existe un toggle de tema. Hoy la app corre siempre en claro (la clase `.dark` nunca se aplica).

## Decisiones tomadas (consensuadas)

| Decisión | Opción elegida |
|---|---|
| Arquitectura de layout | **B · Columna principal (2/3) + barra lateral fija (1/3)** |
| Dirección de estilo visual | **Editorial · alto contraste** |
| Modo de color | **C · Oscuro por defecto, con toggle conservado** |
| Estrategia de implementación | **B · Pase manual por features**, anclado en tokens + primitivas compartidas para garantizar consistencia |

## 1. Sistema de tema

### 1.1 Habilitar el theming
- Montar `ThemeProvider` de `next-themes` en `src/app/layout.tsx` (o un provider dedicado) con `attribute="class"` y `defaultTheme="dark"`.
- Agregar un **botón de toggle** sol/luna en `Header.tsx` (junto al `QuickActionMenu`).
- `sonner.tsx` ya consume `useTheme`; con el provider montado funcionará correctamente.

### 1.2 Tipografía
- Mantener **Geist** (`--font-geist-sans`) y **Geist Mono** (`--font-geist-mono`).
- Aplicar **números tabulares** (`font-feature-settings: "tnum"`) a valores monetarios y numéricos, vía clase utilitaria o en los componentes de display de montos.
- Reforzar jerarquía: labels `uppercase tracking-widest` pequeños, títulos `tracking-tight`.

## 2. Tokens semánticos editoriales (`globals.css`)

Reescribir las variables CSS. Objetivo: look "fintech/editorial", alto contraste, bordes definidos, sin superficies planas genéricas.

### 2.1 Tema oscuro (default)
- `--background`: fondo casi negro `oklch(0.13 0.01 220)`.
- `--card` / `--popover`: elevación `oklch(0.17 0.01 220)` a `oklch(0.2 0.01 220)`.
- `--foreground`: `oklch(0.96 0.005 220)`.
- `--border` / `--input`: **nítido** `oklch(0.3 0.01 220)`.
- `--muted-foreground`: `oklch(0.68 0.01 220)`.
- `--primary`: acento **índigo** `oklch(0.55 0.2 265)` con `--primary-foreground` blanco.
- `--sidebar`: fondo levemente distinto del background para separación clara.
- `--chart-*`: paleta de alto contraste sobre fondo oscuro (verde esmeralda, rosa/rojo, índigo, cian, ámbar). Referencia: `--chart-1: oklch(0.75 0.15 150)` (esmeralda), `--chart-2: oklch(0.7 0.18 25)` (rosa), `--chart-3: oklch(0.7 0.2 265)` (índigo), `--chart-4: oklch(0.75 0.13 215)` (cian), `--chart-5: oklch(0.8 0.15 85)` (ámbar).
- `--growth` / `--debt`: mantener semántica (esmeralda / rosa) con valores de contraste AA sobre oscuro.

### 2.2 Tema claro (toggle)
- Mismo espíritu editorial pero en claro: parchment suave, tarjetas blancas, bordes definidos, números tabulares, acento índigo.
- Contraste AA/AAA sobre fondos claros.
- Valores de referencia (a fijar en planificación): `--background: oklch(0.985 0.005 80)`, `--card: oklch(1 0 0)`, `--foreground: oklch(0.22 0.01 220)`, `--border: oklch(0.9 0.01 220)`, `--muted-foreground: oklch(0.55 0.01 220)`, `--primary: oklch(0.55 0.2 265)` con `--primary-foreground: oklch(1 0 0)`.

### 2.3 Consistencia
- Ninguna página puede usar valores de color hardcodeados (`bg-white`, `text-neutral-*`) que rompan en oscuro; ver sección 5.

## 3. Primitivas compartidas (shadcn/ui)

Como toda feature consume estas primitivas, su restyle propaga el look a todas las páginas:

- `card` — borde definido, sombra sutil, esquinas `rounded-2xl` (ya vía `--radius`).
- `button` — variantes `default` (índigo), `outline` (borde nítido), `ghost`.
- `badge`, `input`, `dialog`, `table`, `dropdown-menu`, `tooltip`, `tabs`, `separator`.
- `sidebar` — fondos/bordes según tokens de sidebar.

**Regla de oro:** los componentes no deben usar colores literales; todo desde tokens.

## 4. Dashboard restructure (opción B)

Reemplazar el contenedor actual de una columna por un grid de dos columnas:

```
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2"> ... columna principal ... </div>
  <aside className="lg:sticky lg:top-20 self-start space-y-6"> ... rail derecho ... </aside>
</div>
```

### 4.1 Columna principal (2/3)
1. `DashboardHeader` (stats: patrimonio, ingresos, gastos, balance + multimoneda)
2. `CashflowSection` (Sankey)
3. Grid interna: `AssetsSection` + `FinancialComparisonChart`
4. `IncomeExpenseChart` (mes actual)
5. `DashboardRecentTransactions`

### 4.2 Rail derecho (1/3, sticky)
Widgets compactos apilados:
1. `DriverWidget` (Conductor)
2. `InvestmentsWidget`
3. `BalanceProjection`
4. `InsightsWidget`
5. Obligaciones: `DashboardCredits` / `DashboardDebts` / `DashboardBudgets` / `DashboardSavingsGoals` (render condicional según datos)

### 4.3 Responsive
- En `lg`+: dos columnas con rail sticky.
- En móvil/tablet: el rail se apila debajo de la columna principal (comportamiento natural del grid).

## 5. Pase manual por features (auditoría visual)

Con el tema oscuro default activado, auditar cada página y corregir grises/roturas:

- `dashboard`, `transactions`, `accounts`, `budgets`, `debts`, `savings-goals`, `gasolina`, `car-sharing`, `conductor` (+ analytics/settings), `insights`, `investments`, `categories`, `login/register`.
- Correcciones típicas: `bg-white` → `bg-card`, `bg-[#F9FAFB]` → `bg-background`, `text-neutral-*` → tokens, bordes `border-neutral-200/50` → `border-border`, dividers visibles en oscuro, charts con ejes/grid legibles.
- Validar `scrollbar`, `backdrop-blur`, y estados hover/focus en ambos temas.

## 6. Directrices para futuros cambios

Crear **`docs/DESIGN-RULES.md`** con:

1. **Paleta** — tabla de tokens light/dark con propósito (canvas, card, border, muted, primary, growth/debt).
2. **Tipografía** — fuentes, jerarquía (títulos tracking-tight, labels uppercase, tnum para números).
3. **Geometría** — radios (`--radius: 1rem`), espaciado base, sombras.
4. **Uso de primitivas** — prohibido el color literal en componentes (`bg-white`, `text-neutral-*`, hex/oklch inline); todo desde tokens.
5. **Cómo añadir una página/componente** — checklist (usar primitivas, tokens, estados dark).
6. **Checklist de review visual** — validar ambos temas, contraste AA, hover/focus, responsive.

## Éxito / criterios de aceptación

- [ ] La app carga en **oscuro por defecto** y el toggle cambia a claro y viceversa, persistiendo la preferencia.
- [ ] El dashboard usa **dos columnas** (principal + rail derecho sticky) en desktop; en móvil se apila correctamente.
- [ ] Todos los widgets (Conductor, Inversiones, Insights, Proyección, Obligaciones) viven en el rail derecho; transacciones, sankey y comparativa en la principal.
- [ ] Ninguna página muestra grises/contraste roto en oscuro (pase manual completado).
- [ ] `docs/DESIGN-RULES.md` existe y es la guía para cambios futuros.
- [ ] `npm run build` y `npx tsc --noEmit` pasan.

## Fuera de alcance (YAGNI)

- No cambiar la arquitectura de datos ni endpoints.
- No agregar nuevos widgets ni features.
- No rediseñar páginas ajenas al pase de auditoría (solo consistencia visual).
- No migrar de Geist a otra fuente.

## Riesgos

- **Amplitud del pase manual**: muchas páginas; mitigar con primitivas compartidas y pase en tandas por feature.
- **Contraste en gráficos Recharts**: verificar ejes, grid y tooltips en oscuro.
- **Cambios sin commitear previos** (módulo Conductor, widget, 1.7.0): commitear antes de iniciar el rediseño para aislar el trabajo.
