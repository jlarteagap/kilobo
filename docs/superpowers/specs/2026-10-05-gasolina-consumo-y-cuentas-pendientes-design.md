# Gasolina — Consumo por km, Cuentas Pendientes y Reskin Minimal·Zinc

**Fecha:** 2026-10-05
**Estado:** Diseño aprobado por el usuario, pendiente implementación
**Alcance:** `/gasolina` únicamente (consumo, cuentas pendientes, migración visual)

## Resumen

Tres entregas sobre la página `/gasolina`:

1. **Consumo por km** —_block nuevo que calcula L/100km, Bs/km y Bs/L por ciclo cerrado y avisa cuando el último ciclo supera en más de 15% el mejor registro histórico. El objetivo es detectar una pérdida de gasolina en el auto.
2. **Cuentas pendientes** — se les agrega estado de liquidación, un total neto compensado entre ciclos, detalle desplegable por ciclo y corrección del bug que oculta a todos los deudores menos el primero.
3. **Reskin visual** — la página se migra al sistema Minimal·Zinc (§11 del manual), se elimina el `dark:` inerte y se deconstruye el `CarSharingDashboard` monolítico.

`/gasolina` **se mantiene pública y standalone**: se abre desde el celular en la gasolinera sin sesión iniciada (ver `middleware.ts:15`), así que no entra al `AppLayout` ni al sidebar. Solo cambia su lenguaje visual.

## Decisiones tomadas

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Litros opcionales al cerrar el ciclo | Precio por litro configurable | El precio del litro cambia con los subsidios; convertir Bs a litros con un precio fijo falsea la comparación. Pedir el dato es más fiel. |
| Línea base = **mejor** ciclo histórico | Promedio de los últimos 3 ciclos | Solo una fuga puede empeorar el consumo, así que el mínimo es la medición más limpia. Un promedio se contamina con ciclos contaminados. |
| Warn sobre **Bs/km** | — | No sirve: un Bs/km que sube puede ser precio, no consumo. |
| Standalone, mismo lenguaje visual | Migrar al `AppLayout` | El sidebar enlaza rutas privadas que rebotan a `/login` sin sesión, y `Header` depende de `useAuth`. Rompería el uso real en la gasolinera. |
| Componentes en `src/app/gasolina/` | Mover a `src/features/gasolina/` | Decisión del usuario: mantener el diff confinado a la ruta. |

## Fiabilidad del dato (limitaciones conocidas)

El cálculo es **aproximado** y la UI debe decirlo en vez de fingir precisión:

- **Un ciclo = una carga.** La carga que se registra al cerrar cubre lo quemado desde la carga *anterior*, no exactamente desde el inicio del ciclo. Solo coincide si el depósito se hizo con el tanque casi vacío, que es el caso normal.
- **El odómetro de los viajes es relativo** (3 dígitos, con wrap de 999 → 0). Los km de un ciclo son un delta relativo, no una lectura absoluta. Por eso el bloque **no** intenta cruzar los viajes con el odómetro absoluto del mantenimiento: esa correspondencia se rompe en cada wrap.
- **La línea base mejora con el tiempo.** Con 2 ciclos válidos la alerta es ruido. Se muestra el dato pelado hasta que haya al menos 3, y la UI invitando a registrar litros.
- **Falsos positivos.** Subir pendientes, usar el aire acondicionado o cargar mal el maletero elevan el L/100km sin que haya fuga. Por eso el umbral es 15% y no 5%, y la alerta informa en lugar de diagnosticar.

## Base de cálculo

```
km           = Σ trip.totalKm
bsPerKm      = km > 0            ? gasAmount / km            : null
litersPer100 = km > 0 && litros>0 ? gasLiters / km * 100      : null
bsPerLiter   = litros > 0        ? gasAmount / gasLiters      : null
```

Todas devuelven `null` cuando no hay dato — nunca `NaN`, nunca división por cero. Un ciclo sin `gasLiters` no entra en la comparación de consumo, pero **sí** aporta su `bsPerKm` y sus deudas.

### Reglas de comparabilidad

```ts
MIN_COMPARABLE_KM = 100   // con menos km, la carga refleja quemado previo al ciclo
MAX_PLAUSIBLE_L100 = 30   // por encima, el dato no es creíble (kilometraje mal cargado)
ALERT_THRESHOLD_PCT = 15
MIN_CYCLES_FOR_ALERT = 2   // sin un segundo ciclo comparable no hay contra qué comparar
```

Un ciclo es **válido** para la línea base si: es cerrado, tiene `gasLiters > 0`, `km >= 100` y `litersPer100 <= 30`.

```
baseline = min(litersPer100 de los ciclos válidos)
latest   = litersPer100 del ciclo válido más reciente (mayor endDate)
deltaPct = baseline > 0 ? (latest − baseline) / baseline × 100 : 0
alerta   = ciclosVálidos >= 2 && deltaPct > 15
```

## Modelo de datos

### `CarCycle` (campos nuevos)

```ts
gasLiters?: number | null   // litros de la carga. Sin esto solo hay Bs/km
settledAt?: number | null   // cuándo se saldó la cuenta. null = sigue pendiente
```

**Sin backfill.** Los documentos existentes no tienen ninguno de los dos campos; Firestore devuelve `undefined` y ambos se leen como `null`. El repositorio los normaliza en lectura a `null` explícito, igual que ya hace `driver.repository.ts` con `gasolinaTripCreatedAt`.

`gasLiters` ausente es un estado **válido y esperado**, no un dato roto: significa "este ciclo se cerró sin anotar litros" y por lo tanto no es comparable.

### Ubicación de los tipos

`CarTrip`, `CarTripSource`, `DebtResult` y `CarCycle` se mueven de `repositories/car-sharing.repository.ts` a `src/types/car-sharing.ts`. Motivo, idéntico al ya documentado en `src/types/car-maintenance.ts:1-4`: los componentes cliente necesitan los tipos, y `repositories/` arrastra `firebase-admin` al bundle.

El repositorio los re-exporta para no romper a `services/driver.service.ts` en el mismo cambio.

### Funciones puras por ciclo (`src/types/car-sharing.ts`)

```ts
cycleKm(cycle: CarCycle): number
cycleBsPerKm(cycle: CarCycle): number | null
cycleLitersPer100(cycle: CarCycle): number | null
cycleBsPerLiter(cycle: CarCycle): number | null
cycleDebtors(cycle: CarCycle): DebtResult[]   // todos menos quien pagó
```

`cycleDebtors` es la corrección del bug de `CarSharingDashboard.tsx:504`, donde `debtSummary.find(d => d.name !== payer)` descarta silenciosamente a todos los deudores menos el primero cuando hay un tercer conductor (el formulario de viajes permite "Otro").

## Lógica de cuentas pendientes

### Compensación entre ciclos

Cada ciclo cerrado genera deudas fijas. Al sumarlas sin compensar aparecen montos que se cancelan solos: si en el ciclo A te deben Bs 200 y en el ciclo B tú debes Bs 150, la transferencia real es de Bs 50, no dos transferencias.

```ts
// 1. Saldo neto por persona sobre ciclos ABIERTOS
net: Map<string, number>   // >0 = los demás me deben; <0 = yo debo
for cycle of ciclosAbiertos:
  for d of cycleDebtors(cycle):          // excluye a quien pagó
    net[d.name] += d.cost
    net[cycle.paidBy] -= d.cost

// 2. Liquidación greedy: mayor deudor ↔ mayor acreedor
deudores   = net < 0  → amount = −net,   orden descendente
acreedores = net > 0  → amount =  net,   orden descendente
i = j = 0
while i < deudores.length && j < acreedores.length:
  monto = min(deudores[i].amount, acreedores[j].amount)
  transferencias.push({ from: deudores[i].name, to: acreedores[j].name, amount: monto })
  deudores[i].amount   -= monto
  acreedores[j].amount -= monto
  if deudores[i].amount   < 0.01 → i++   // epsilon contra polvo de punto flotante
  if acreedores[j].amount < 0.01 → j++
```

Resultado: **transferencias mínimas**, no saldos brutos. Funciona para N personas, no solo para el caso de dos.

Casos límite cubiertos:
- Quien pagó sin conducir (no aparece en `debtSummary`): todos los demás le deben igual.
- Ciclo abierto sin deudas (quien pagó condujo todo el tramo): no genera transferencia.
- `debtSummary` vacío: no genera nada.

Un ciclo cuyo monto queda cubierto por la compensación de otro **sigue pendiente** hasta que se marque pagado. Es correcto — el dinero no se movió para ese ciclo — pero la UI lo aclara.

## UI

### Bloque de consumo (`ConsumptionCard`)

Card `rounded-[22px]` con tres métricas en fila y la serie de barras en CSS.

```
  ┌─ Consumo ────────────────────────────────── 3 ciclos con litros ┐
  │                                                                  │
  │   12.4 L/100km        1.31 Bs/km         3.78 Bs/L               │
  │   último ciclo        promedio           precio de la carga      │
  │                                                                  │
  │   L/100km por ciclo                                                    │
  │      mar   ▂▂▂▂▂▂  9.4   ← mejor                                 │
  │      abr   ▂▂▂▂▃▃▃  9.8                                             │
  │      may   ▂▂▄▆▆▆▆  12.4  ← actual                    +26%  ▲      │
  │                                        ──────────────────────────── │
  │                                        línea base  9.4 L/100km     │
  │   Posible pérdida: 26% más que tu mejor ciclo                      │
  └──────────────────────────────────────────────────────────────────┘
```

**Las tres métricas van juntas a propósito.** Si L/100km sube y Bs/L no, el precio cambió. Si suben las dos, es consumo. Con una sola de las tres el número engaña, y la pregunta que responde el bloque ("¿el auto está perdiendo?") depende de esa distinción.

**Barras en CSS, no Recharts.** Son 6 barras y el marcador de línea base y de "mejor" es más directo a mano que configurar un `ReferenceLine`; además evita cargar el chart en una página pública que se abre con datos de red lentos en la gasolinera.

Estados:
- Sin ciclos con litros → vacío de zinc del manual: tile `size-11 rounded-xl bg-zinc-100`, título `text-sm font-medium text-zinc-900`, apoyo `text-xs text-zinc-500` **sin emoji**.
- 1 ciclo válido → muestra el número, sin línea base ni alerta, con un texto que invita a cerrar otro ciclo.
- ≥2 ciclos válidos sin alerta → serie y línea base, sin el renglón de alerta.

### Cuentas pendientes (`PendingAccounts`)

```
  ┌─ Cuentas pendientes ──────────────────────────────┐
  │  POR COBRAR                                      │
  │  Bs 152.00              Jorge ──► Melissa          │
  │  2 ciclos abiertos                                  │
  ├───────────────────────────────────────────────────┤
  │  ▾  02/03 – 05/03            310 km · Bs 260   [✓] │
  │        Bs/km 0.84 · 3 viajes · 8 días abierto      │
  │        ─────────────────────────────────────────   │
  │        Jorge (pagó)     200 km   64%    Bs 166.40 │
  │        Melissa           110 km   36%    Bs  93.60 │
  │  ▸  05/03 – 12/03            500 km · Bs 400   [✓] │
  ├───────────────────────────────────────────────────┤
  │  Liquidado (2)                                      │
  │    ✓ 15/02 – 02/03            Bs 120              │
  └───────────────────────────────────────────────────┘
```

- **Encabezado de totales**: una línea por transferencia resultante de la compensación. Si no hay ciclos abiertos, estado vacío "Todo al día".
- **Fila por ciclo abierto**: fecha, km, Bs, y el botón de liquidar. El desplegable muestra los viajes (fecha, persona, km), el Bs/km del ciclo, **todos** los deudores con su `cost` exacto, y los días abierto.
- **Liquidados**: sección colapsada, con la fecha de pago en zinc neutro. Al liquidar, el ciclo sale de la lista abierta y el total se recalcula al vuelo.

**`window.confirm` en el borrado del ciclo.** Hoy el 🗑 está a 8px del nuevo `[✓]` y un click errado borra una cuenta ya liquidada. El borrado no pide confirmación en ninguna parte del código actual (`handleDeleteCycle`, `CarSharingDashboard.tsx:146`).

### Migración visual

| Antes | Después |
|---|---|
| Bloque 🚗 + "Kilo Sharing" centrado, `text-5xl md:text-6xl font-light` | `text-2xl font-bold text-zinc-900 tracking-tight` + subtítulo `text-xs font-medium text-zinc-500`, alineado a la izquierda |
| `max-w-6xl px-6 py-24` | `max-w-4xl px-4 py-8` (igual que `/conductor`) |
| `blur-[120px]` decorativo + `selection:bg-emerald-100` | eliminados |
| `dark:` en 4 archivos (110 ocurrencias) | eliminado |
| `neutral-*` | `zinc-*` |
| `emerald-500` / `#10B981` | `emerald-600` (`#059669`), único acento |
| `rounded-[2rem]` / `rounded-[2.5rem]` | `rounded-[22px]` |
| Inputs `border-t-0 border-x-0 border-b` (subrayado) | `h-11 bg-white border-zinc-200 rounded-xl` |
| Barras de progreso yellow/red/verde | `bg-zinc-200` con fill `emerald-600` → `zinc-400` → `zinc-900`, el orden de severidad que ya usa `MaintenanceFundCard.tsx:135` |

**El bloque `.dark` de `globals.css` queda muerto y no se borra** — quitarlo es otro tema. `dark:` sobrevive únicamente en `components/ui/chart.tsx` (constante `THEMES` de shadcn, no se toca).

### `error-fallback.tsx` — decisión pendiente

`components/ui/error-fallback.tsx` tiene 3 tokens Sage (`#B5543D`, `#4F6A35`, `#F2F9E3`) y lo usan los **11** `error.tsx` de la app, incluido `app/gasolina/error.tsx`. Cambiarlo altera la pantalla de error de todas las rutas.

Pendiente de decidir:
- **Incluirlo aquí**: 3 tokens, es helper de `components/ui` (primer paso de la unificación igual), y §11 prohíbe explícitamente `#B5543D` y `#4F6A35`. Rompe el aislamiento del plan.
- **Dejarlo**: `/gasolina` conserva una pantalla sage, pero solo visible cuando la página falla.

## Descomposición de `CarSharingDashboard.tsx`

563 líneas en un solo componente que mezcla formulario, tabla, cierre de ciclo y panel de deudas. Se parte en:

| Componente | Responsabilidad |
|---|---|
| `TripForm` | Alta de viaje (conductor + odómetro) |
| `TripHistory` | Tabla del ciclo con edición en línea |
| `CloseCycleSection` | Monto, **litros (nuevo, opcional)** y quién pagó |
| `PendingAccounts` | Cuentas pendientes (sección de arriba) |
| `ConsumptionCard` | Consumo (sección de arriba) |

Los componentes quedan en `src/app/gasolina/components/`. Los cálculos puros en `src/app/gasolina/utils/`.

El campo de litros lleva un helper explícito: *"Déjalo vacío si no anotaste los litros"* — el bloque de consumo depende de que el usuario lo llene.

## Fechas y zona horaria

`new Date(cycle.startDate).toLocaleDateString('es-ES')` hoy se renderiza como `'...'` en el servidor y se rellena en un `useEffect` (`CarSharingDashboard.tsx:505`), porque el servidor corre en UTC y el cliente en UTC-4: un timestamp de las 23:00 local se rendería con el día siguiente en un lado y el correcto en el otro.

Se reemplaza por un helper con zona fija:

```ts
formatCycleDate(ts: number): string   // Intl es-ES, timeZone: 'America/La_Paz'
```

Bolivia es UTC-4 sin horario de verano, así que el resultado es determinista en servidor y cliente y desaparece el guard `mounted`.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/types/car-sharing.ts` | **Nuevo.** Tipos + funciones por ciclo |
| `src/app/gasolina/utils/consumption.utils.ts` | **Nuevo.** Serie, línea base, alerta |
| `src/app/gasolina/utils/debts.utils.ts` | **Nuevo.** `netOpenDebts` con liquidación greedy |
| `src/app/gasolina/utils/format.ts` | **Nuevo.** `formatBs`, `formatCycleDate` |
| `src/repositories/car-sharing.repository.ts` | Re-exporta los tipos; `closeActiveCycle` recibe litros; **nuevo** `setCycleSettled`; `.limit(200)` en `getClosedCycles`; normaliza `gasLiters`/`settledAt` a `null` |
| `src/app/gasolina/actions.ts` | `closeCycleAction` pasa litros; **nuevo** `setCycleSettledAction` |
| `src/app/gasolina/components/ConsumptionCard.tsx` | **Nuevo** |
| `src/app/gasolina/components/PendingAccounts.tsx` | **Nuevo** (reemplaza el `<aside>`) |
| `src/app/gasolina/components/CarSharingDashboard.tsx` | Se parte; pierde el panel lateral; reskin |
| `src/app/gasolina/components/MaintenanceWidgets.tsx` | Reskin |
| `src/app/gasolina/components/MaintenanceModal.tsx` | Reskin |
| `src/app/gasolina/page.tsx` | Header sobrio, contenedor, `Promise.all`, reskin |
| `CHANGELOG.md` + `package.json` | Al cierre: entrada `[1.7.7]` y bump |

**Radio de impacto:** `carSharingRepository` solo lo consumen `src/app/gasolina/*` y `services/driver.service.ts`, y este último únicamente usa `addTrip` / `deleteTrip`, que no cambian de firma. Ningún otro módulo se toca.

### Por qué `.limit(200)` en `getClosedCycles`

Hoy no hay límite porque nada se liquida y la lista se limpia a mano. Al empezar a marcar ciclos como pagados, los documentos se acumulan para siempre. 200 es holgado para años de uso y evita que la página pública cargue la colección entera.

## Backward compatibility

- Documentos sin `gasLiters` → `null` → el ciclo aporta Bs/km y deudas, pero no entra en la comparación de consumo.
- Documentos sin `settledAt` → `null` → el ciclo aparece pendiente. Es su estado real: nadie lo marcó pagado.
- `closeCycleAction` valida litros: si vienen, `> 0` y finito; si no, `null`. Nunca `0` ni negativos, que producirían divisiones inválidas.
- `driver.service.ts` no cambia: sigue llamando `addTrip` con la misma firma.

## Verificación

El proyecto no tiene framework de tests, así que la verificación es por comandos y manual.

**1. Tipos y lint**

```
npx tsc --noEmit
npm run lint
```

**2. Aritmética** — script desechable con `npx tsx` (el patrón que `AGENTS.md` ya describe para `scripts/`), contra los casos que hoy rompen:

- ciclo sin `gasLiters` → `litersPer100 === null`, `bsPerKm` correcto
- ciclo con `km === 0` → todas las métricas `null`, ningún `NaN` ni `Infinity`
- 3 deudores → las 3 transferencias, none descarta
- 2 ciclos que se cancelan (debo 200 / me deben 150) → una sola transferencia de 50
- ciclo de 12 km → excluido del baseline
- ciclo a 40 L/100km → excluido del baseline
- 1 solo ciclo válido → sin alerta
- residuo de punto flotante → 0 transferencias espurias

No se commitea.

**3. Manual**

- Cerrar un ciclo con litros y otro sin → el bloque compara solo el primero
- Liquidar un ciclo → desaparece de la lista abierta y el total baja
- Desplegar un ciclo de 3 conductores → aparecen los 3 con su monto
- Inyectar un dataset de ciclos con litros → la alerta aparece sobre el umbral y no debajo
- Vista móvil: las 3 métricas no desbordan a 360px

**4. Aceptación visual** — en `src/app/gasolina/`:

```
grep -rn "dark:" .        → 0
grep -rn "neutral-" .     → 0
grep -rn "emerald-500" .  → 0
grep -rn "rounded-\[2rem\]\|rounded-\[2.5rem\]" . → 0
```

## Fuera de alcance

- **Unificación de diseño del resto del proyecto.** Se planifica aparte, en este orden: (1) los helpers de `components/ui` — son la fuga que rompe las páginas zinc que los importan, (2) el shell — `Sidebar`/`BottomNav`/`QuickActionMenu`/`Header`, hoy 100% Sage, (3) las 7 features partidas que tienen el form zinc y las cards Sage, (4) landing/login/insights, donde Sage puede ser una identidad legítima.
- `PeriodSelector` sigue siendo Sage aunque lo use `CashflowSection`. Es bug de la unificación, no de esta feature.
- Borrar el bloque `.dark` de `globals.css`.
- `components/ui/error-fallback.tsx` (decisión pendiente, ver arriba).
- Migrar la página al `AppLayout` o sumarla al sidebar.
- Costo total del auto por km (gasolina + mantenimiento): requeriría cruzar los ciclos con el odómetro absoluto del mantenimiento, y esa correspondencia se rompe en cada wrap del odómetro de 3 dígitos.
- Los 5 changes de OpenSpec sin archivar en `openspec/changes/` — trabajo ya publicado, housekeeping separado.
