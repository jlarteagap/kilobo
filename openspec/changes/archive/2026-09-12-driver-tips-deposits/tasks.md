## 1. Propinas por app en el turno

- [x] 1.1 `src/types/driver.ts`: agregar `tips: Record<DriverApp, number>` a `DriverShift` y `ShiftInput`; helpers `emptyTips()`, `DEFAULT_TIPS` y suma de propinas.
- [x] 1.2 `src/repositories/driver.repository.ts`: `normalizeShift` default `tips` a `{ UBER:0, YANGO:0, INDRIVE:0 }` para turnos viejos.
- [x] 1.3 `src/lib/validations/driver.schema.ts`: `tipsSchema` (números >= 0 coerced) y sumarlo al schema de turno.
- [x] 1.4 `src/services/driver.service.ts` (`processShiftTransactions`): crear `INCOME` por app con `tips[app] > 0` → `incomeCashAccountId`, subtipo del app, descripción `"${APP} propina"`, registrar id en `generatedTransactionIds`; incluir propinas en `grossEarnings` y `liquidEarnings`; dejar `pendingAmount = tarjeta + bonos` sin cambios.
- [x] 1.5 `src/services/driver.service.ts` (`getAnalytics`): incluir propinas en `summary.grossEarnings`/`liquidEarnings` y en `byApp` (sumar tips al desglose y `totalGross`) sin cambiar el shape.
- [x] 1.6 `src/features/driver/components/ShiftForm.tsx`: input "Propinas" por app (junto a Bonos/Comisión), `shiftToInput`, estado y `emptyEarnings`/defaults; sumar propinas a `gross`/`liquid` del `SummaryCard` y a `appTotals` (no a `pending`).
- [x] 1.7 `src/features/driver/components/ShiftDetailSheet.tsx` y `ShiftHistory.tsx`: mostrar "Propinas" por app/turno en el detalle y resumen.
- [x] 1.8 Verificación: `npm run lint` + `npx tsc --noEmit`; prueba manual registrar turno con propina y editar/eliminar (reversión de transacción).

## 2. Depósitos de apps (registro + conciliación)

- [x] 2.1 `src/types/driver.ts`: tipos `DriverDeposit`, `DepositInput`, `DriverDepositReconciliation`.
- [x] 2.2 `src/lib/validations/driver.schema.ts`: `depositSchema` (app, fecha YYYY-MM-DD no futura, bruto/comisión >= 0, notas máx 500) + `DepositInputSchema`.
- [x] 2.3 `src/repositories/driver-deposit.repository.ts`: CRUD con guarda `user_id` (`findAllByUser`, `findById`, `create`, `update`, `delete`), `serverTimestamp`, `normalizeDeposit` y orden por `date desc`.
- [x] 2.4 `src/services/driver-deposit.service.ts`: `netAmount = bruto − comisión`; `getReconciliation` por app (depositado = suma grossAmount de depósitos; pendiente = tarjeta + bonos de turnos; diferencia = depositado − pendiente).
- [x] 2.5 Rutas API under `src/app/api/driver/deposits/`: `route.ts` (GET lista por mes / POST crear), `[id]/route.ts` (PATCH / DELETE) y `reconciliation/route.ts` (GET conciliación). Guard `getUserId()` → 401, Zod → 400, `{ data }`.
- [x] 2.6 `src/features/driver/hooks/useDriverDeposits.ts`: `useDriverDeposits(cycle)`, `useDriverDepositsReconciliation()`, `useCreateDriverDeposit`, `useUpdateDriverDeposit`, `useDeleteDriverDeposit` (queryKeys dentro del namespace `driver`).
- [x] 2.7 `src/features/driver/components/DriverDeposits.tsx` integrado en `src/app/conductor/page.tsx`: lista por ciclo, formulario con neto en vivo (bruto − comisión), eliminar, conciliación por app, estados carga/vacío/error.
- [x] 2.8 `firestore.indexes.json`: índice `driver_deposits` (`user_id` ASC, `date` DESC).
- [x] 2.9 Verificación: `npx tsc --noEmit` + `npm run lint` (sin errores nuevos sobre el lote baseline en archivos del feature).

## 3. Cards de cuentas - texto legible

- [x] 3.1 `src/features/accounts/AccountsList.tsx`: `AccountCard` — nombre con wrap (sin `truncate`), columna derecha dedicada al balance, acciones hover sin tapar texto, en móvil apilar bloques.
- [x] 3.2 Mantener `AccountChangeBadge` y tokens zinc/esmeralda (Minimal · Zinc, sin dark).
- [x] 3.3 Verificación: `npx tsc --noEmit` + `npm run lint`.
