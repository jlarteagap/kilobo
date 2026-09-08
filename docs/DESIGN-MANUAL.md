# Kilo Design Manual — Manual de Diseño

**Versión:** 1.1 (2026-09-07)
**Sistema:** Kilo Sage · Identidad Orgánica — en migración progresiva hacia el referente **Minimal · Zinc** (§11).
**Ámbito:** Guía obligatoria para TODO feature o componente nuevo. Si un componente no sigue estas reglas, no se mergea. Los componentes de gráficos/datos se igualan al referente §11.

---

## 1. Principios de diseño

1. **Cálido y orgánico, no genérico.** Kilo se siente "hecho a mano": menta fresca, sage terroso, radios asimétricos. Prohibido el look Stripe/Linear genérico (azul #2563EB, gris #F9FAFB, esquinas 8px perfectas).
2. **Amigable primero.** Textos cercanos, estados claros, cero fricción. La app debe sentirse como una billetera que te acompaña.
3. **Solo tema claro.** No existe dark mode. No añadir variantes `dark:`.
4. **Números que se respetan.** Toda cifra monetaria usa `tabular-nums`. Las cifras grandes son protagonistas (bold, tracking-tight).
5. **Labels con voz editorial.** Secciones en mayúsculas espaciadas (`uppercase tracking-[0.14em] text-xs`), nunca títulos de card genéricos.

---

## 2. Tokens de color (referencia completa)

| Token CSS | Valor | Uso |
|---|---|---|
| `--background` | `#DAFEB7` | Fondo de página |
| `--card` | `#FFFFFF` | Superficies elevadas |
| `--popover` | `#FFFFFF` | Menús, popovers, tooltips |
| `--card-soft` | `#F2F9E3` | Insets, hover, fondos secundarios |
| `--primary` | `#5F7D42` | Acciones primarias, links, activo, focus |
| `--primary-foreground` | `#FFFFFF` | Texto sobre primario |
| `--foreground` | `#000000` | Texto principal |
| `--muted-foreground` | `#837A75` | Texto secundario, labels, captions |
| `--growth` | `#4F6A35` | Ingresos, positivo, ahorro, éxito |
| `--debt` | `#B5543D` | Gastos, negativo, deuda, destructivo |
| `--border` / `--input` | `#E5DED2` | Bordes, separadores |
| `--ring` | `#5F7D42` | Focus ring |
| `--tint-sage` | `#3C5230` | Texto sobre fondos menta |

**Escala sage** (para gráficos, fondos y estados):
`#2A3A22` · `#3C5230` · `#4F6A35` · `#5F7D42` · `#7A9B57` · `#ACC18A` · `#CDE3A9` · `#DAFEB7` · `#F2F9E3`

**Paleta de charts (categórica):**
`#5F7D42` (crecimiento) · `#B5543D` (deuda) · `#ACC18A` (sage) · `#837A75` (taupe) · `#7A9B57` (oliva) · `#C8D9A9` (menta media) · `#2A3A22` (verde oscuro) · `#D9A487` (arena)

### Reglas de uso del color
- **Primario con moderación**: sage es acento, no decoración. Acciones, activo, highlights.
- **Crecimiento SIEMPRE `#4F6A35`** (verde oscuro) — nunca `#16A34A` ni emerald brillante.
- **Deuda SIEMPRE `#B5543D`** (arcilla) — nunca `#EF4444` ni rojo brillante.
- **Contraste**: texto sobre menta → `#3C5230`. Texto secundario → `#837A75`. Nunca sage claro sobre blanco como texto (falla WCAG).
- **Prohibido**: `#10B981` emerald, `#2563EB` blue, `#EF4444` rojo, gradientes brillantes, glassmorphism, sombras duras.

---

## 3. Tipografía

- **Familia**: Space Grotesk (`--font-sans`). Cargada en `src/app/layout.tsx`.
- **Escala**: text-xs (12) · text-sm (14) · text-base (16) · text-lg (18) · text-xl (20) · text-2xl (24) · text-3xl (30) · text-4xl (36).

### Patrones tipográficos

| Patrón | Clases |
|---|---|
| Título de página (header) | `text-lg font-semibold text-black` |
| Label de sección | `text-xs font-semibold uppercase tracking-[0.14em] text-[#837A75]` |
| Cifra grande (patrimonio) | `text-4xl font-bold tracking-tight tabular-nums text-black` |
| Cifra card | `text-2xl font-bold tracking-tight tabular-nums text-black` |
| Monto de transacción | `text-sm font-semibold tabular-nums` |
| Meta-dato / caption | `text-xs text-[#837A75]` |

- **Todas** las cifras monetarias llevan `tabular-nums`.
- En español de Bolivia: formato `Bs 48,230.50` (Bs + espacio + miles con coma).

---

## 4. Formas y radios

| Elemento | Radio |
|---|---|
| Card principal | `rounded-[1.75rem] rounded-bl-md` (asimétrico orgánico) |
| Card pequeña / inset | `rounded-[1.25rem] rounded-bl-md` |
| Botón | `rounded-full` (píldora) |
| Input / Select / Textarea | `rounded-xl` |
| Chip / Badge / Tag | `rounded-full` |
| Avatar | `rounded-full` |
| Modal / Dialog | `rounded-[1.5rem]` (simétrico, los modales no usan asimétrico) |
| Barra de progreso | `rounded-full` |

**El radio asimétrico (3 esquinas grandes + inferior-izquierda pequeña) es la firma visual de Kilo.** Solo en cards de contenido, nunca en controles.

---

## 5. Componentes (recetas)

### Botones (`components/ui/button.tsx`)
| Variante | Clases |
|---|---|
| Primary | `bg-[#5F7D42] text-white hover:bg-[#4F6A35] rounded-full` |
| Secondary | `bg-[#F2F9E3] text-[#4F6A35] hover:bg-[#E7F0D6] rounded-full` |
| Ghost | `text-black hover:bg-[#F2F9E3] rounded-full` |
| Destructive | `bg-[#B5543D] text-white hover:bg-[#9C4431] rounded-full` |

### Cards (`components/ui/card.tsx`)
`bg-white border border-[#E5DED2] rounded-[1.75rem] rounded-bl-md shadow-[0_1px_3px_rgba(0,0,0,0.05)]`
- Header de card: label de sección (mayúsculas espaciadas) + acción opcional a la derecha.
- Sin doble borde, sin gradientes.

### Inputs / Selects / Textarea
`bg-white border border-[#E5DED2] rounded-xl focus:ring-[#5F7D42] focus:border-[#5F7D42]`

### Badges / Chips
- Éxito: `bg-[#F2F9E3] text-[#4F6A35]`
- Peligro: `bg-[#FAEDE9] text-[#B5543D]`
- Neutral: `bg-[#F2F9E3] text-[#837A75]` → o `bg-[#F5F1E8]`
- Todos `rounded-full`

### Tabs
- Activo: `text-[#4F6A35] border-b-2 border-[#5F7D42]` o pill `bg-[#F2F9E3] text-[#4F6A35]`
- Inactivo: `text-[#837A75]`

### Modales
`rounded-[1.5rem]` — el único componente con radios simétricos.

### QuickActionMenu ("+ Nuevo" / botón central)
El menú de creación rápida (Transacción, Cuenta, Presupuesto, Categoría, Deuda, Crédito) es el mismo componente en desktop (píldora en header) y móvil (círculo central de la bottom nav). Reskin de sus estilos hardcodeados (`bg-emerald-600` → `bg-[#5F7D42]`, dropdown con tokens del manual).

### Tablas
- Header: `text-xs uppercase tracking-[0.14em] text-[#837A75] font-semibold`
- Filas: `border-b border-[#F0E9DA] hover:bg-[#F7FBF0]`
- Montos: `tabular-nums`

---

## 6. Layout

### Shell
- **Desktop (≥1024px)**: rail de iconos (sidebar colapsada ~64px) + header sticky blanco/blur 64px.
- **Móvil (<768px)**: bottom nav fija (Inicio · Cuentas · [+] · Transacciones · Perfil), sidebar oculta, contenido `pb-20`. El hamburger abre el drawer lateral completo (sheet móvil de shadcn) con los 9 destinos + Ajustes + Cerrar sesión. El slot "Perfil" abre un popover con usuario, Ajustes y Cerrar sesión.
- **Tablet (768-1023px)**: igual que móvil (bottom nav + drawer vía hamburger).

### Páginas de listado (cuentas, transacciones, deudas...)
- Ancho máximo `max-w-7xl`, padding `px-4 sm:px-6`.
- Header de página: título + acciones a la derecha.
- Grid responsive: `grid-cols-1 lg:grid-cols-3` cuando hay widgets laterales.

### Dashboard
- Solo el dashboard usa la composición especial: header → sankey full-width → grid 2 col (2/3 + 1/3).
- El rail derecho (1/3) es sticky si la pantalla lo permite.

---

## 7. Estados

| Estado | Regla |
|---|---|
| Loading | Skeletons por zona (nunca una card gigante que parpadea). Fondo `#F2F9E3` con pulso suave. |
| Vacío | Icono + título corto + texto de apoyo + CTA opcional. Mismo diseño en toda la app. |
| Error | Toasts sonner para acciones; `error.tsx` por página. Color `#B5543D`. |
| Hover | Elevación sutil + `bg-[#F7FBF0]` en filas. Nunca zoom ni escalados bruscos. |

---

## 8. Checklist para features y componentes nuevos

Antes de mergear cualquier feature, verificar:

- [ ] ¿Usa tokens CSS (no hex hardcodeados) para colores? (Excepción: variantes que no existen como token)
- [ ] ¿Sin `dark:` ni estilos para dark mode?
- [ ] ¿Radios según la tabla de formas? ¿Las cards usan el asimétrico orgánico?
- [ ] ¿Cifras monetarias con `tabular-nums` y formato `Bs X,XXX.XX`?
- [ ] ¿Labels de sección en mayúsculas espaciadas?
- [ ] ¿Verde crecimiento `#4F6A35` y deuda `#B5543D` (no emerald ni rojo brillante)?
- [ ] ¿Botones en píldora con las 4 variantes del manual?
- [ ] ¿Responsive: desktop rail, móvil bottom nav, contenido no tapado (`pb-20` en móvil)?
- [ ] ¿Estados loading/vacío/error cubiertos?
- [ ] ¿`npx tsc --noEmit` y `npm run build` pasan?

---

## 9. Prohibido (anti-patrones)

- ❌ Emerald `#10B981` / `bg-emerald-*` (estilo viejo)
- ❌ Azul fintech `#2563EB`
- ❌ Rojo brillante `#EF4444` para gastos
- ❌ Dark mode / clases `dark:`
- ❌ Glassmorphism, gradientes brillantes, neón
- ❌ Cards con radio uniforme 8-16px (usar asimétrico)
- ❌ Esqueletos gigantes de pantalla completa
- ❌ Texto sage claro sobre blanco (ilegible)
- ❌ "Bienvenido, X" como título de página (usar nombre de página)

---

## 10. Mapa ruta → título de header

| Ruta | Título |
|---|---|
| `/dashboard` | Dashboard |
| `/accounts` | Cuentas |
| `/transactions` | Transacciones |
| `/debts` | Deudas y Préstamos |
| `/budgets` | Presupuestos |
| `/categories` | Categorías |
| `/insights` | Insights |
| `/ahorros` | Metas de Ahorro |
| `/conductor` | Conductor |
| `/conductor/settings` | Ajustes |

El nav de la sidebar usa estos mismos nombres (el item del dashboard se llama "Dashboard" tanto en drawer como en título).

---

## 11. Referente "Minimal · Zinc" — gráficos/datos (en migración)

**Contexto:** el Sankey de flujo de caja (`CashflowSection` V2 + `SankeyCustomNode`/`SankeyCustomLink`) es el **primer componente migrado** a la nueva dirección: neutros zinc + **un solo acento emerald** `#059669`, radios simétricos, tipografía sobria. El resto de componentes se iguala a este referente de forma progresiva (el usuario lo pidió: "vamos a cambiar el diseño poco a poco"). Esta dirección **convive** con Sage (§1-9) hasta migrar todos los gráficos y canvas de datos.

### Paleta de datos (gráficos / canvas)

| Uso | Valor |
|---|---|
| Fondo de card | `#FFFFFF` |
| Inset de chart | `bg-zinc-50/50` + borde `#F4F4F5` (zinc-100) |
| **Acento positivo / ingresos** | `#059669` (emerald-600) — el único color de acento |
| Gasto / subtipo | `#27272A` (zinc-800) |
| Balance / fondo oscuro | `#18181B` (zinc-900) |
| Cuenta (nodo claro) | fill `#E4E4E7` (zinc-200) + stroke `#D4D4D8` |
| Transferencia | `#A1A1AA` (zinc-400) |
| Links base | `#D4D4D8` (zinc-300); fallback `#E4E4E7` |
| Label de nodo | `#52525B` (zinc-600), font-weight 500 |
| Texto grado 1 | `#18181B` (zinc-900) |
| Texto grado 2 | `#71717A` (zinc-500) |
| Helper | `#A1A1AA` (zinc-400) |
| Borde de card | `#E4E4E7` (zinc-200) |
| Nodos especiales | `Ahorro/Excedente` `#18181B` · `Fondos Previos` `#52525B` |

**Regla de color:** todo neutro zinc; el emerald `#059669` se reserva exclusivamente para valores positivos/ingresos. Prohibido usar otro acento en la misma vista, y prohibido el emerald brillante `#10B981` del estilo viejo.

### Formas y radios (simétricos)

| Elemento | Radio |
|---|---|
| Card de chart/datos | `rounded-[22px]` |
| Inset del canvas | `rounded-xl` + `overflow-hidden` |
| Nodo sankey (`rect`) | `rx={3}` |
| Props sankey | `nodeWidth={10}`, `nodePadding` 28 (desktop) / 18 (<420px) |
| Links | `strokeLinecap="butt"` `strokeLinejoin="miter"` (sin caps redondeados) |

Esquinas **simétricas** (aquí no aplica el asimétrico orgánico de §4). Jerarquía de radios: card 22px → inset 12px → elementos 3px.

### Interacción sankey (aislar flujo)

- Click en nodo = aislar: nodos no conectados opacidad `0.22` (labels `0.35`), links no conectados `0.08`.
- Nodo seleccionado: opacidad `1`, stroke `#09090B` 1.5px; links conectados `0.85`.
- Links por defecto: `0.55`.
- Reset: tecla `Escape` o click fuera del gráfico.
- Cada `rect` lleva `cursor:pointer` y `data-sankey-node`.

### Tipografía de sección

| Patrón | Clases |
|---|---|
| Título de card | `text-[13px] font-semibold text-zinc-900 tracking-tight` |
| Subtítulo (período) | `text-xs text-zinc-500 capitalize` |
| Label métrica | `text-xs font-medium text-zinc-600` |
| Valor métrica | `text-xs font-semibold text-zinc-900 tabular-nums` |
| Helper | `text-[11px] text-zinc-400 leading-relaxed` |

### Estados

- **Loading:** huesos `bg-zinc-100` (no `#F2F9E3`), radios `rounded-lg / xl / full` según el elemento; mismo layout que el dato real.
- **Vacío:** tile `size-11 rounded-xl bg-zinc-100` con punto `size-2.5 rounded-full bg-zinc-300`; título `text-sm font-medium text-zinc-900`; apoyo `text-xs text-zinc-500`. **Sin emoji.**
- **Tooltip:** `bg-white rounded-xl border-zinc-200 shadow-[0_8px_24px_rgba(0,0,0,0.08)]`; nombre `text-xs font-semibold text-zinc-900`; monto `text-sm font-bold tabular-nums`; desglose con `border-t border-zinc-100`.

### Checklist de igualación (banda de gráficos/datos)

- [ ] Sin `dark:` ni estilos dark mode
- [ ] Único acento `#059669`; sin `#10B981` ni otros acentos en la misma vista
- [ ] Sin tokens Sage en canvas (`#4F6A35`, `#5F7D42`, `#ACC18A`, `#F2F9E3`, `#B5543D`, `#837A75`)
- [ ] Radios simétricos: card `22px`, inset `rounded-xl`, elemento `rx={3}`
- [ ] `tabular-nums` en todas las cifras monetarias
- [ ] Estados loading/vacío/tooltip en zinc, sin emoji
- [ ] Links con `strokeLinecap="butt"`
