# driver-tips-methods

## Why

Las propinas que recibe el conductor al cerrar un turno pueden llegarle por dos vías: efectivo en mano o transferencia QR. Hoy el sistema trata toda propina como efectivo y la contabiliza únicamente contra la cuenta de efectivo (`incomeCashAccountId`), lo que distorsiona el ingreso real cuando el conductor recibe propinas por QR.

## What Changes

- El monto de propinas por app pasa de un número único a un desglose por método de pago: `tips: Record<DriverApp, { CASH: number; QR: number }>`.
- Al cerrar/editar un turno se crean transacciones `INCOME` según el método: propinas en efectivo → `incomeCashAccountId` ("`APP` propina"); propinas en QR → `incomeQrAccountId` ("`APP` propina QR").
- El formulario `ShiftForm` expone dos inputs "Propinas" por app (Efectivo y QR); el detalle e historial del turno muestran el desglose.
- Los turnos guardados antes de este cambio (propina numérica) se leen como `{ CASH: <monto>, QR: 0 }`.
- Las métricas no cambian su fórmula: `grossEarnings`/`liquidEarnings` siguen sumando el total de propinas y `pendingAmount` (tarjeta + bonos) sigue intacto.

## Impact

- **Archivos con lógica**: `src/types/driver.ts`, `src/repositories/driver.repository.ts`, `src/services/driver.service.ts`.
- **UI**: `src/features/driver/components/ShiftForm.tsx`, `ShiftDetailSheet.tsx`, `ShiftHistory.tsx`.
- **Validación**: `src/lib/validations/driver.schema.ts` (`tipsSchema`).
- **Alcance**: no toca depósitos de apps ni la reconciliación (las propinas no forman parte del pendiente).

## Capabilities

- `driver/tips`