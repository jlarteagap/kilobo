# Kilo Design Manual — Manual de Diseño

**Versión:** 1.0 (2026-08-07)
**Sistema:** Kilo Sage · Identidad Orgánica
**Ámbito:** Guía obligatoria para TODO feature o componente nuevo. Si un componente no sigue estas reglas, no se mergea.

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

### Tablas
- Header: `text-xs uppercase tracking-[0.14em] text-[#837A75] font-semibold`
- Filas: `border-b border-[#F0E9DA] hover:bg-[#F7FBF0]`
- Montos: `tabular-nums`

---

## 6. Layout

### Shell
- **Desktop (≥1024px)**: rail de iconos (sidebar colapsada ~64px) + header sticky blanco/blur 64px.
- **Móvil (<768px)**: bottom nav fija (Inicio · Cuentas · [+] · Transacciones · Perfil), sidebar oculta, contenido `pb-20`.
- **Tablet (768-1023px)**: igual que móvil.

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
