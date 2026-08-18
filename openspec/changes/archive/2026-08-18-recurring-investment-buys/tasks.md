## 1. Tipos y utilidades de fecha

- [x] 1.1 Extender `src/types/investment.ts`: añadir interface `InvestmentRecurrence` (enabled, frequency: 'WEEKLY', day_of_week 0-6, amount, currency, account_id, next_due, last_executed) y campo opcional `recurrence: InvestmentRecurrence | null` en `Investment`.
- [x] 1.2 Añadir `recurringBuySchema` en `src/lib/validations/investment.schema.ts` (amount > 0, day_of_week entero 0-6, enabled boolean; infer `SaveRecurringInput`) y `executeRecurringBuySchema` (unit_price > 0, date opcional).
- [x] 1.3 Crear util compartido `src/features/investments/utils/recurrence.utils.ts` con `nextOccurrence(today, dayOfWeek): Date`, `nextDueString(...)`, `isPlanDue(plan, today)` y formateo amigable del día (ej. "vie").

## 2. Servicio y dominio

- [x] 2.1 Añadir `saveRecurring(investmentId, input, userId)` en `investmentsService`: valida inversión existe y tiene `units` (posición), monto>0, día válido; computa `next_due` inicial (próxima ocurrencia desde hoy); garantiza un único plan activo (upsert); persiste `recurrence` vía batch o repo.
- [x] 2.2 Añadir `deleteRecurring(investmentId, userId)` que pone `recurrence: null`.
- [x] 2.3 Añadir `executeRecurringBuy(investmentId, { unit_price, date? }, userId)`: relee inversión+plan, valida plan activo y `next_due <= hoy` (o pendiente), valida `unit_price > 0`, calcula `units = amount / unit_price`, delega en `buy()` (reusa saldo/posición), y en el mismo flujo avanza `next_due` a la siguiente ocurrencia y actualiza `last_executed`.
- [x] 2.4 Añadir en `investmentsRepository` helpers `setRecurrenceInBatch` / `clearRecurrenceInBatch` (solo si el update genérico no alcanza) reutilizando `updateInBatch` — verificado: `UpdateInvestmentData` ahora incluye `recurrence`, y `update()`/`updateInBatch()` del repo ya la persisten; no se necesitan helpers nuevos.

## 3. Rutas API

- [x] 3.1 Crear `PUT` y `DELETE` en `src/app/api/investments/[id]/recurring/route.ts` (guarda `getUserId`, `safeParse` con `recurringBuySchema`, errores 401/404/422 mapeados como en `transactions/route.ts`).
- [x] 3.2 Crear `POST` en `src/app/api/investments/[id]/recurring/execute/route.ts` con `executeRecurringBuySchema` y manejo de errores (reusa mapa de status: saldo insuficiente 422, inversión no encontrada 404).

## 4. Hooks de datos (TanStack Query)

- [x] 4.1 Añadir en `src/features/investments/hooks/useInvestments.ts`: `investmentKeys.recurring(id)` y mutaciones `useSaveRecurringBuy`, `useDeleteRecurringBuy`, `useExecuteRecurringBuy` (invalidan `investmentKeys.lists()`, `transactions(id)` y `accountKeys.lists()`; toasts sonner para éxito/error).

## 5. UI — visibilidad del plan

- [x] 5.1 En `InvestmentRow` (InvestmentsList.tsx): badge de plan (activo/inactivo) con día y monto formateados, y línea de "Próxima: <fecha> · <monto>" o "Pendiente" según `isPlanDue`.
- [x] 5.2 Sección "Próximas compras" al inicio de `InvestmentsList`: agrupa planes activos, muestra fecha próxima + monto, botón "Confirmar" por producto, y estado vacío amigable cuando no hay planes.
- [x] 5.3 Dialog de confirmación del pendiente (`ConfirmRecurringBuyDialog`): muestra cuenta/monto planificado, único campo "Precio del día", calcula units en vivo, valida con schema, y al confirmar llama `useExecuteRecurringBuy`.

## 6. UI — gestión del plan

- [x] 6.1 Añadir sección "Compra recurrente" en el dialog de edición (`InvestmentForm`): toggle activar, selector de día de la semana, monto; solo visible si la inversión tiene `units`; muestra aviso si no tiene posición. Guarda vía `useSaveRecurringBuy` (o borra con `useDeleteRecurringBuy` si se desactiva por completo).

## 7. Dashboard (widget opcional)

- [x] 7.1 En `InvestmentsWidget` (InvestmentsList.tsx): línea "Próxima compra: <inversión> · <fecha> · <monto>" si existe un plan activo pendiente/próximo.

## 8. Validación final

- [x] 8.1 `npx tsc --noEmit` sin errores.
- [x] 8.2 `npm run lint` sin errores nuevos en los archivos tocados.
- [ ] 8.3 Prueba manual: crear plan semanal → ver badge y "Próximas compras" → simular vencimiento → confirmar con precio → ver compra en historial, saldo descontado y próximo vencimiento avanzado → desactivar y ver que no genera pendientes.