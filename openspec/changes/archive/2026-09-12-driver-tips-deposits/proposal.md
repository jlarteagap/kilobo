## Why

El conductor registra al cierre del turno las ganancias que dictan las apps (efectivo/tarjeta/QR), bonos y comisiones, pero pierde ingresos reales: (1) la propina que el pasajero paga de más en efectivo (excedente) nunca se registra, subestimando lo que realmente gana; (2) los bonos y pagos con tarjeta quedan como "pendiente en la app" y cuando la app hace el depósito al banco ese depósito no queda registrado en ninguna parte; (3) no hay cálculo de la ganancia neta de cada depósito tras la comisión que las apps cobran sobre tarjetas y bonos. Además, las cards de cuentas muestran texto cortado o solapado.

## What Changes

- **Propinas por app en el turno** (`driver/tips`): nuevo campo "Propinas" por app en `ShiftForm`. La propina es efectivo ya recibido: genera una transacción `INCOME` a la cuenta de efectivo (`incomeCashAccountId`), suma al bruto y al líquido del turno, se persiste en `DriverShift.tips` y se refleja en analytics. No entra al "pendiente en app".
- **Registro de depósitos de apps** (`driver/app-deposits`): nueva entidad `DriverDeposit` (app, fecha, monto bruto depositado, comisión cobrada por la app, neto acreditado). CRUD en `GET/POST/PATCH/DELETE /api/driver/deposits`, repositorio sobre colección `driver_deposits`, hooks y UI en `/conductor`. Muestra la **ganancia neta por depósito** (`bruto − comisión`) y la **reconciliación por app** entre lo pendiente registrado en turnos (tarjeta + bonos) y lo realmente depositado.
- **Rediseño de cards de cuentas** (`accounts/card-preview`): revisión y propuesta de `AccountCard` en `AccountsList` para que nombre+institución, balance, badge de variación y "X invertidos" queden totalmente visibles y legibles, sin solapamiento ni recorte en anchos angostos ni al hacer hover.

## Capabilities

### New Capabilities
- `driver/tips`: propina (excedente) por app registrada como efectivo en el turno — campo en el formulario, transacción de ingreso a la cuenta de efectivo y métricas (bruto/líquido/analytics) que la incluyen sin tocar el "pendiente".
- `driver/app-deposits`: registro manual de depósitos que hacen las apps (monto bruto, comisión, neto) con ganancia neta por depósito y reconciliación contra el pendiente (tarjeta + bonos) acumulado en turnos.
- `accounts/card-preview`: diseño de la tarjeta de cuenta que garantiza texto totalmente visible, legible y sin solapamiento entre bloques.

### Modified Capabilities
- (ninguna existente a modificar; `driver/monthly-cycles` en curso no se toca)

## Impact

- **Tipos:** `src/types/driver.ts` — `tips` en `DriverShift`/`ShiftInput` y nueva interfaz `DriverDeposit`/`DepositInput`.
- **Servicio/Repositorio driver:** `src/services/driver.service.ts` (transacción de propina + persistencia), `src/repositories/driver.repository.ts` (normalize `tips`) y nuevos `driver-deposit.service.ts` / `driver-deposit.repository.ts` sobre la colección `driver_deposits` (timestamps con `serverTimestamp`).
- **APIs:** `src/app/api/driver/shifts` acepta `tips`; nuevos `src/app/api/driver/deposits/route.ts` y `deposits/[id]/route.ts` con guard de `getUserId()` y validación Zod.
- **Validación:** `src/lib/validations/driver.schema.ts` — schema de propina y `depositSchema`.
- **UI driver:** `ShiftForm.tsx`, `DashboardSummary.tsx`, `ShiftHistory.tsx`, `ShiftDetailSheet.tsx` y nueva sección/componentes de depósitos en `/conductor`.
- **Analytics:** `driverService.getAnalytics` suma propinas al ingreso; shape de respuesta sin cambios (el **pendiente** sigue siendo tarjeta + bonos).
- **UI cuentas:** `AccountsList.tsx` (`AccountCard`) rediseñado; sin cambios de API ni de datos.
- **Datos:** nueva colección `driver_deposits` (sin migración de existentes; la transacción de propina se revierte reusando `generatedTransactionIds` al editar/eliminar el turno).
