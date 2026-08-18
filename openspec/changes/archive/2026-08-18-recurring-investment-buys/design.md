## Context

Ver proposal.md — Why. Estado actual relevante:

- `Investment` guarda posición calculada (`units`, `unit_price` promedio, `amount`) y una subcolección `transactions/` con operaciones BUY/SELL.
- `investmentsService.buy()` ya ejecuta una compra (crea `InvestmentTransaction`, descuenta saldo, llama `recalculatePosition()` que recalcula el costo promedio). No hay scheduler ni precios reales: el precio se ingresa a mano.
- Precedente de recurrencias: `Transaction` ya tiene `is_recurring`/`recurrence_interval`, y `projection.ts` consume recurrencias para proyectar flujos.
- Stack: Next.js App Router, Firestore (Firebase Admin), TanStack Query v5, react-hook-form + Zod, date-fns.

## Goals / Non-Goals

**Goals:**
- Plan de compra recurrente semanal por monto fijo, uno por inversión con posiciones.
- Cálculo determinista de `next_due` y detección de pendiente.
- Ejecución reutilizando `buy()` existente (una sola fuente de verdad para posición/saldo).
- UI amigable y visible: badge por inversión + sección "Próximas compras" + confirmación del pendiente con el precio del día.

**Non-Goals:**
- Otra frecuencia que no sea semanal (mensual queda fuera por decisión de producto).
- Compra por unidades fijas (decidido: monto fijo).
- Auto-ejecución sin confirmación (riesgoso sin precios reales).
- Integración con brokers/reales precios; recuerda, es un tracker.

## Decisions

### 1. Embed `recurrence` en el documento `Investment` (no colección nueva)

```ts
recurrence: {
  enabled:      boolean
  frequency:    'WEEKLY'            // única frecuencia soportada hoy
  day_of_week:  number              // 0=Dom … 6=Sáb (convención date-fns getDay)
  amount:       number              // monto fijo por periodo (BOB o moneda de la inversión)
  currency:     string              // = investment.currency (de referencia)
  account_id:   string              // = investment.account_id (fija)
  next_due:     string | null       // 'yyyy-MM-dd'
  last_executed: string | null
}
```

- **Por qué**: relación 1:1 con la inversión; eliminar cuenta o inversión limpia el plan automáticamente (sin orphans); `recalculatePosition()` y el historial de `transactions/` quedan intactos. Alternatives consideradas: `investment_plans` como colección propia (rechazada: sobre-ingeniería para un solo plan por inversión) y un tipo `InvestmentPlan` duplicando contexto (rechazada).
- PRECAUCIÓN: `next_due` persistido evita reevaluar con el reloj del cliente y facilita pintar pendientes sin re-calcular en cada list en desktop; se recalcula al crear/editar el plan, al refrescar listas y tras ejecutar.

### 2. Cálculo de fechas con date-fns (función pura compartida)

`nextOccurrenceAfter(today: Date, dayOfWeek: number): Date` → siguiente día de semana ≥ today (si hoy coincide, hoy; es "due"): se mantiene en un util (`src/lib/calendar/recurrence.ts` o `src/features/investments/utils/recurrence.utils.ts`) reutilizado por UI y service. Al ejecutar, `next_due = nextOccurrenceAfter(hoy, day_of_week)` será el mismo día la próxima semana.

### 3. API del plan (CRUD) y ejecución, sobre servicios existentes

- `PUT /api/investments/[id]/recurring` — upsert config `{ enabled, day_of_week, amount }` (la cuenta/moneda se toman de la inversión). Valida: inversión existe y tiene units, montos>0, día válido, no formar segundo plan (upsert único).
- `DELETE /api/investments/[id]/recurring` — quita el plan (deja `recurrence: null`).
- `POST /api/investments/[id]/recurring/execute` — body `{ unit_price, date? }`. Server: verifica plan activo y `next_due <= hoy` (o `next_due == null` y hoy>=inicio), valida `unit_price > 0`, construye `BuyInvestmentInput { investment_id, account_id, units: amount/unit_price, unit_price, currency, date: hoy, notes }` y delega en `investmentsService.buy()`. Si `buy()` falla por saldo, responde el mismo error. Tras éxito, avanza `next_due`. Concurrency: se relee el `recurrence` dentro del service antes de ejecutar y se guarda el nuevo `next_due` en el mismo batch, minimizando doble-ejecución por doble click.

### 4. UI visible y amigable (área `src/features/investments`)

- **Badge en la fila** (`InvestmentRow`): chip "Plan semanal · vie 200", y bajo la info, línea de "Próxima: vie 22/08 · 200" o "Pendiente".
- **Sección "Próximas compras"** al inicio de `InvestmentsList` (solo si hay planes): cada entrada con icono, nombre, monto, fecha próxima y botón **Confirmar** → abre dialog con `InvestmentTxForm`-like reducido: muestra monto planificado y un único campo "Precio del día", calcula units en vivo. Estado vacío amigable cuando no hay planes.
- **Edición del plan**: dentro del dialog de edición (`InvestmentForm`) sección "Compra recurrente" (toggle + día de la semana + monto) o dialog dedicado desde la fila; se elige al implementar según tamaño del form.
- **Dashboard (`InvestmentsWidget`)**: línea de próxima compra bajo el total si hay plan (opcional, barata).
- Hooks: `useInvestments` ya trae `recurrence`; añadir mutaciones `useSaveRecurringBuy`, `useDeleteRecurringBuy`, `useExecuteRecurringBuy` (invalidan `investmentKeys.lists()` + `accountKeys.lists()`).

## Risks / Trade-offs

- [Doble ejecución por doble click o retries] → releer `recurrence` en el service dentro del batch de ejecución y avanzar `next_due` atómicamente; la compra queda invalidada si ya no está vencida.
- [Timezone: "hoy" cliente vs servidor] → la detección de `due` para ejecutar se decide con la fecha del servidor (`date` enviada o server date); la UI usa display para fechas pero el criterio final es server.
- [Saldo insuficiente mantiene pendiente] → así lo especifica el spec; la UI muestra el error claro y el pendiente persiste para reintentar.
- [Plan en inversión sin units creada antes] → la creación del plan exige `units != null` (posición real); inversiones legacy sin units no pueden programar plan hasta tener compras (se registra en UI).
- [Eliminar inversión con plan] → el plan muere con el doc; sin orphans. Eliminar cuenta también (FK implícita) — se acepta igual que hoy para inversiones.

## Migration Plan

- Sin migración de datos: `recurrence` es opcional en documentos nuevos/editados; inversiones existentes sin él se comportan como antes.
- Deploy: rutas nuevas + UI; rollback = eliminar rutas y ocultar UI (el campo sobra sin efecto).
- Validación: `npx tsc --noEmit`, `npm run lint`, prueba manual crear→desactivar→pendiente→confirmar en 1 inversión.

## Open Questions

- Ninguna que cambie specs/enfoque. El formato exacto del dialog del plan se decide en implementación sin afectar comportamiento.