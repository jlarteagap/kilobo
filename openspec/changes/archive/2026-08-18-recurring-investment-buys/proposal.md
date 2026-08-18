## Why

Los usuarios que invierten por DCA (comprar la misma acción cada semana) no tienen forma de planificar ni repetir esa compra: cada semana deben entrar a "Comprar", re-teclear cuenta, unidades, precio y fecha. No existe un plan visible ni un recordatorio de "próxima compra", por lo que comprar semanalmente es manual, repetitivo y fácil de olvidar.

## What Changes

- Agregar un **plan de compra recurrente semanal** a una inversión existente que tenga posiciones (units): monto fijo por periodo, día de la semana, cuenta, activado/desactivado.
- Hacer el plan **visible en la UI**: badge/indicador en la fila de la inversión y una sección "Próximas compras" en la página de inversiones.
- Calcular y mostrar la **próxima fecha de compra** (siguiente día configurado a partir de hoy) y una lista de **compras pendientes** cuando vence.
- Al vencerse, el usuario **confirma la compra pendiente** entrando el precio del día; la app calcula `units = monto / precio`, ejecuta el servicio `buy()` existente (crea `InvestmentTransaction`, descuenta saldo, recalcula posición) y avanza el plan a la siguiente fecha.
- Backend: extender el tipo `Investment` con configuración de recurrencia, validaciones, servicio de CRUD del plan y consulta de pendientes/próximas compras.
- Sin cambios de modelo de datos destructivos. **No es BREAKING** para la data existente.

## Capabilities

### New Capabilities

- `investments/recurring-buys`: compras recurrentes semanales por monto fijo para inversiones, con agenda de próximas compras y confirmación manual del pendiente.

### Modified Capabilities

<!-- Ninguna: no existen specs previas y el requisito es nuevo. -->
- _(ninguna)_

## Impact

- `src/types/investment.ts` — nuevos campos de recurrencia en `Investment`.
- `src/lib/validations/investment.schema.ts` — schema de recurrencia (`recurringBuySchema`).
- `src/services/investments.service.ts` — CRUD del plan, cálculo de `next_due`, listado de pendientes, reuso de `buy()`.
- `src/repositories/investments.repository.ts` — consultas para próximas/pendientes.
- Rutas API en `src/app/api/investments/**` — endpoint(s) para el plan recurrente.
- UI `src/features/investments/**`: `InvestmentForm` (campos del plan), `InvestmentsList` (sección "Próximas compras" + badge), hooks nuevos de query/mutation.
- Widget de dashboard (`InvestmentsWidget`) — muestra la próxima compra del plan (opcional).
- Dependencias: sin nuevas librerías (usa `date-fns` ya presente para fechas).