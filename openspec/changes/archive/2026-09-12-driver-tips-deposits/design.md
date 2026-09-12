## Context

`ShiftForm` registra por app ganancias (efectivo/tarjeta/QR), bonos y comisiones (`src/features/driver/components/ShiftForm.tsx`). `processShiftTransactions` (`src/services/driver.service.ts:33`) crea `INCOME` solo para CASH y QR, `EXPENSE` para comisiones y gastos; tarjeta + bonos `/suman` a `pendingAmount` sin transacción ni registro cuando la app deposita. `DriverShift` persiste en `driver_shifts` con `generatedTransactionIds` que permiten reversión (`deleteWithBalance`) al editar/eliminar. Analytics agregan en memoria (`getAnalytics`). En cuentas, `AccountCard` (`src/features/accounts/AccountsList.tsx:58`) es una fila `flex`: icono + (nombre con `truncate` + institución) + (balance + badge, `text-right`) + botones de acción visibles en hover; en anchos angostos o con nombres/balances largos el texto se recorta o comprime contra el bloque de balance/botones.

Restricciones: Firestore + `serverTimestamp`; guard `getUserId()` (401); validación Zod en `src/lib/validations/driver.schema.ts`; TanStack Query (stale 5min, `queryKey` namespace `driver`); el cambio `driver/monthly-cycles` en curso usa el mismo namespace/specs — no romper sus shapes; cards de cuentas siguen la guía Minimal·Zinc (`docs/DESIGN-MANUAL.md` §11, 22px, neutros zinc + esmeralda `#059669`, sin dark).

## Goals / Non-Goals

**Goals:**
- Propina por app como dato del turno + transacción INCOME a la cuenta de efectivo, incluida en bruto/líquido/analytics.
- Depósito de app como entidad persistida con bruto, comisión y neto, con CRUD e índice Firestore.
- Reconciliación por app: depositado vs pendiente registrado (tarjeta + bonos) con su diferencia.
- Card de cuenta legible: sin truncado ni solapamiento en todos los anchos.

**Non-Goals:**
- Los depósitos NO generan transacciones ni alteran balances de cuentas en este cambio (registro/reconciliación; acreditar a una cuenta bancaria queda como seguimiento).
- Propina no se subdivide por método de pago (siempre efectivo).
- No migrar datos existentes (`tips` default 0, depósitos empiezan vacíos).
- No paginación/cursor para depósitos (lista simple con `limit` defensivo).
- Sin cambios a la regulación de ciclos mensuales ni a la capability `driver/monthly-cycles`.

## Decisions

**D1: Propina como `Record<DriverApp, number>` (campo `tips`).** Alternativa: sumar la propina al efectivo del app — rechazada: pierde trazabilidad y mezcla transacciones. Elegida para que el formulario, `DriverShift` y la UI muestren la propina de forma explícita.

**D2: Transacción de propina reusa el patrón CASH.** `INCOME` → `config.incomeCashAccountId`, subtipo del app, descripción `"${APP} propina"`, fecha del turno. Se agrega el id a `generatedTransactionIds`; con eso `updateShift`/`deleteShift` ya lo revierten/reprocesan sin lógica extra (`deleteWithBalance`).

**D3: Propina sube bruto y líquido, NO el pendiente.** `grossEarnings = efectivo+tarjeta+qr+bonos+propinas`; `liquidEarnings = efectivo+qr+propinas−comisiones−gastos`; `pendingAmount = tarjeta+bonos` (la propina es efectivo ya cobrado). Alternativa de no contarla en líquido — rechazada: es ingreso real.

**D4: `driver_deposits` como colección propia con índice `(user_id, date)`.** Repository dedicado (`driver-deposit.repository.ts`) con `normalize` + `serverTimestamp`, y servicio con guardas de propiedad. Alternativa: guardar depósitos dentro de `driver_shifts` — rechazada: un depósito consolida varios turnos y no pertenece a uno.

**D5: `netAmount` derivado y reconciliación por app.** `netAmount = grossAmount − commission`. Reconciliación: por app, `sum(grossAmount de depósitos)` vs `sum(tarjeta+bonos de turnos)` y su diferencia; se recalcula en cliente desde los datos ya disponibles (hooks). Deja explícita la variación que causan las comisiones que algunas apps cobran sobre bonos/tarjetas.

**D6: API de depósitos con patrón del proyecto.** `POST/GET /api/driver/deposits` y `PATCH/DELETE /api/driver/deposits/[id]`, guard `getUserId()`, `depositSchema` Zod (app enum, date ≤ hoy, gross/commission ≥ 0). Respuestas `{ data }`.

**D7: Hooks con `queryKey ['driver','deposits']`.** Dentro del namespace `driver` para que `invalidateQueries(['driver'])` y los refetches por ciclo sigan funcionando. Formulario con neto calculado en vivo.

**D8: Card de cuenta — layout apilado responsivo.** Reemplazar el `truncate` del nombre por ajuste a línea(s); en md+ columna derecha dedicada al balance con metadata debajo; en móvil apilar (icono/cabecera → nombre → balance → acciones). Botones de acción quedan en fila propia sin flotar sobre texto. Mantener `AccountChangeBadge`, tokens zinc y esmeralda según Minimal·Zinc; sin dark.

## Risks / Trade-offs

- **Reversión de propina depende de `generatedTransactionIds`**: ya es el mecanismo usado para CASH/QR/comisiones; riesgo bajo. Si una reversión falla, queda warning y la transacción huérfana (igual que hoy).
- **Depósitos no acreditan balances**: el usuario podría esperar que el neto impacte una cuenta bancaria. Mitigación: se documenta como registro/reconciliación y queda anotado como seguimiento; no se inventa una cuenta destino sin especificar.
- **Reconciliación con diferencias esperadas**: el pendiente por turno y el depósito consolidado difieren por comisiones/redondeos/ajustes; la UI lo presenta como "depositado vs pendiente registrado", no como error contable.
- **Índice Firestore**: la query por `(user_id, date desc)` requiere índice; se declara en `firestore.indexes.json` y se despliega antes de liberar la UI.
- **Cambio de layout de la card**: pasar de truncado a wrap puede variar alturas/equilibrio del grid `md:grid-cols-2`; mitigación: ajuste mínimo a piezas de texto sin tocar el grid de la página.
- **Compatibilidad con `driver/monthly-cycles`**: se agregan campos (`tips`) y endpoints (`deposits`) sin cambiar shapes existentes; `DriverShift` ganará `tips` con default 0 para datos viejos.
