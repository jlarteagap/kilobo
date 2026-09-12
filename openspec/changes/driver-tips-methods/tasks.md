## 1. Modelo y helpers

- [x] 1.1 `src/types/driver.ts`: tipo `TipsByMethod = { CASH: number; QR: number }`; `tips` pasa a `Record<DriverApp, TipsByMethod>` en `ShiftInput` y `DriverShift`; `DEFAULT_TIPS_PER_APP`, `emptyTips()`, `sumTips()` (compat numérico + objeto, tolera undefined) y `sumTipsByMethod()`.
- [x] 1.2 `src/lib/validations/driver.schema.ts`: `tipsSchema` desglosado `{ CASH, QR }` por app (números >= 0 coerced).

## 2. Persistencia y servicio

- [x] 2.1 `src/repositories/driver.repository.ts`: `normalizeShift` convierte `tips` numérico/ausente → `{ CASH:n, QR:0 }` y respeta el shape desglosado.
- [x] 2.2 `src/services/driver.service.ts` (`processShiftTransactions`): totales con `sumTips` y dos `INCOME` por app según método — CASH → `incomeCashAccountId` ("`APP` propina"), QR → `incomeQrAccountId` ("`APP` propina QR") — subtipo del app, ambos ids en `generatedTransactionIds`. Métricas sin cambio de fórmula.
- [x] 2.3 `src/services/driver.service.ts` (`getAnalytics`): `byApp[].tips` usa `sumTips` sobre el shape nuevo (total).

## 3. UI

- [x] 3.1 `src/features/driver/components/ShiftForm.tsx`: `shiftToInput` con tips desglosados; estado `tips: Record<DriverApp, TipsByMethod>`; dos inputs "Propinas" (Efectivo/QR) por app; `SummaryCard` fila Propinas con desglose cuando haya QR.
- [x] 3.2 `src/features/driver/components/ShiftDetailSheet.tsx` y `ShiftHistory.tsx`: mostrar propinas por método (`+X (Ef · QR)`).

## 4. Verificación

- [x] 4.1 `npx tsc --noEmit` + `npm run lint` (sin errores nuevos sobre el baseline).
- [ ] 4.2 Prueba manual: turno con propina mixta crea 2 transacciones en cuentas correctas; editar/eliminar las revierte.