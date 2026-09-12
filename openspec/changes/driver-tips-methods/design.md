# driver-tips-methods — Design

## Contexto

Hoy las propinas son `tips: Record<DriverApp, number>` y siempre se contabilizan como efectivo hacia `incomeCashAccountId`. El conductor necesita poder marcar que las propinas de una app llegaron por QR (transferencia), para que el ingreso caiga en la cuenta QR correcta.

## Modelo de datos

- Nuevo tipo: `export type TipsByMethod = { CASH: number; QR: number }` (reusa las claves de `PaymentMethod`, sin `CARD`).
- `tips: Record<DriverApp, TipsByMethod>` en `ShiftInput` y `DriverShift`.
- Helpers en `src/types/driver.ts`:
  - `DEFAULT_TIPS_PER_APP: TipsByMethod = { CASH: 0, QR: 0 }`
  - `emptyTips()` → `{ UBER: default, YANGO: default, INDRIVE: default }`
  - `sumTips(tips?)` → total general (compat: acepta el shape viejo numérico y `undefined`).
  - `sumTipsByMethod(tips?, method)` → total por método.
- `tipsSchema` en `driver.schema.ts`: `TipsByMethodSchema = { CASH: appAmount, QR: appAmount }` aplicado por app.

## Migración / normalización

- En `normalizeShift` (repository): un `tips` numérico o ausente → `{ CASH: valor, QR: 0 }`; un `tips` ya desglosado se respeta. Mismas reglas en `shiftToInput` de `ShiftForm`.
- `sumTips` tolera `undefined`, `number` y objeto `{ CASH, QR }` para no romper lecturas intermedias.

## Transacciones (`processShiftTransactions`)

Por cada app:
- `cashTips = tips[app].CASH`; si `> 0`, transacción `INCOME` → `config.incomeCashAccountId`, subtipo del app (`subtypeMapping[app]`), descripción `` `${APP_LABEL} propina` ``, fecha del turno; id → `generatedTransactionIds`.
- `qrTips = tips[app].QR`; si `> 0`, transacción `INCOME` → `config.incomeQrAccountId`, subtipo del app, descripción `` `${APP_LABEL} propina QR` ``, fecha del turno; id → `generatedTransactionIds`.

Las métricas no cambian: `totalTips = sumTips(tips)`; `grossEarnings` y `liquidEarnings` suman `totalTips`; `pendingAmount = tarjeta + bonos`.

## UI

- `ShiftForm`: la fila "Propinas" por app pasa a dos inputs: "Propinas en efectivo" y "Propinas en QR" (estado `tips` como `Record<DriverApp, TipsByMethod>`). `SummaryCard` agrega, además del total, el desglose Efectivo/QR cuando haya QR.
- `ShiftDetailSheet`: muestra `Propinas: +X (Ef +e · QR +q)`.
- `ShiftHistory`: badge del app suma cash + qr (igual que hoy, `sumTips`).

## Verificación

- `npx tsc --noEmit` y `npm run lint` (sin errores nuevos).
- Prueba manual: turno con propina mixta → 2 transacciones (efectivo y QR a sus cuentas); editar a 0 → se revierten ambas.