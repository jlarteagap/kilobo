## Context

Ver proposal.md — Why. El badge diario (change `account-balance-history`) ya persiste la colección
`account_balance_changes`, expone la ancla por `GET /api/account-balance-changes?account_id&before` y
calcula `delta = balance actual − ancla`. La página `AccountsList.tsx` calcula el delta dentro de
`AccountCard`, muestra el Patrimonio Total como suma cruda de balances y no aprovecha el historial
ni consolida la variación del día. Este change agrupa cinco refinamientos observables de la página de
cuentas sobre esa base ya desplegada (índice `(user_id, account_id, createdAt DESC)` en producción).

## Goals / Non-Goals

**Goals:**
- Hacer explicable la variación diaria: historial reciente por cuenta con origen y ancla visible.
- Mostrar la variación del día por moneda y consolidada (en BOB) en la Overview Card.
- Desglosar el patrimonio por moneda, con conversión a BOB de monedas extranjeras.
- Mostrar montos en su moneda nativa con formato correcto (sin símbolo "Bs" en cripto).
- Permitir ordenar la grilla por variación del día, nombre o balance.
- Reducir ruido del estado neutro (prioridad de inversiones, umbral de periodo, nunca "+0").
- Recalcular el periodo de la ancla automáticamente al cruzar la 4:00 AM local.

**Non-Goals:**
- No paginar el historial (solo los N más recientes en un diálogo).
- No corregir la suma cruda de balances de cuentas mixtas (ya se resuelve separando por moneda).
- No agregar un explorador completo de historial con filtros.
- No cambiar la persistencia ni los orígenes de registro ya implementados.

## Decisions

**D1 — API `limit` sin romper la ancla.**
`GET /api/account-balance-changes?account_id=X&limit=N` responde `{ changes }` (newest-first, `orderBy
createdAt desc`, `limit N`, sin filtro `before`). Sin `limit`, la respuesta actual `{ change }` (ancla)
se mantiene intacta. La query del historial reusa el mismo índice desplegado.

**D2 — Hoisting del delta en `useAccountDailyDeltas()`.**
El cálculo `account.balance − ancla.new_balance` (hoy dentro de `AccountCard`) sube a un hook que
combina `useAccounts` + anclas y devuelve `Record<accountId, { delta, anchorBalance, lastChangeAt }>`.
Consumido por `AccountCard`, Patrimonio Total y el ordenamiento — un solo punto de cálculo.

**D3 — Variación consolidada y por moneda.**
Variación consolidada: `Σ convertToBOB(delta, account.currency)` sobre cuentas con ancla, mostrada
como pill "Hoy" junto al título "Patrimonio Total" (sin total grande en BOB). Variación por moneda:
`Σ delta` de cuentas de cada moneda (en la moneda nativa), mostrada como chip compacto en cada fila
del desglose; silenciosa en 0.

**D4 — Ordenamiento con control segmentado.**
Select/chips en el header: "Variación (hoy)" (default, delta desc, sin ancla al final), "Nombre" y
"Balance". El orden por variación es por **delta neto** (mayor subida primero).

**D5 — Reglas del estado neutro del badge.**
En orden de prioridad por tarjeta: (1) `delta ≠ 0` → badge firmado; (2) `delta = 0` con inversiones →
"X invertidos" (indigo, como antes del change previo); (3) `delta = 0` sin inversiones y
`lastChangeAt < startOfDailyPeriod()` (último cambio de un periodo anterior) → "Sin cambios · hace X";
(4) resto → sin pill. Nunca "+0"/"0".

**D6 — Recalcular el periodo de la ancla al cruzar las 4:00 AM local.**
`useRollingBoundary` en `useAccountBalanceChanges` — un `useState` + `useEffect` que programa un
`setTimeout` hasta la siguiente 4:00 AM (`startOfDailyPeriod() + 1 día − now + 1 s`). Al
dispararse, se recalcula `before`, la query key cambia y las anclas se re-piden; el resto de los
widgets se derivan de ese hook. Más robusto que `refetchInterval` porque actualiza el `before`
capturado en cada render sin depender de closures stale.

**D8 — Desglose del patrimonio por moneda.**
La Overview Card no muestra un total grande en BOB. Cada fila muestra una moneda: label ("Bolivianos",
"Dólares"…), subtotal en esa moneda (`formatAssetAmount`), y para monedas extranjeras su conversión
aproximada a BOB ("≈ Bs X"). BOB queda en Bs sin conversión. Separador `divide-y`; sin cajas extra.

**D9 — Formato de montos por moneda (`formatAssetAmount`).**
Solo BOB/USD tienen símbolo de moneda en `formatCurrency`. El resto (cripto) se muestra como número
plano (hasta 8 decimales) usando `formatAssetAmount` en todas las tarjetas de cuenta, el diálogo de
historial y el tooltip del badge. `formatCurrency` se mantiene sin cambios para el resto de la app.

**D7 — Historial en diálogo "Minimal · Zinc".**
`AccountHistoryDialog`: lista de entradas con etiqueta de origen (`sourceLabel`), delta con signo
(emerald/zinc), prev→nuevo y fecha/hora absoluta; separador "Cierre de ayer: Bs X" arriba cuando el
historial incluye la ancla; skeleton y empty state. El badge y el balance se hacen clicables
(`cursor-pointer`, `role="button"`).

## Risks / Trade-offs

- La query del historial requiere el índice `(user_id, account_id, createdAt DESC)` → ya desplegado en
  el change previo; se verifica en tareas.
- El "Refetch al cruzar las 4:00" usa `setTimeout` de hasta 24 h → se cancela y reprograma si la
  página pierde el foco; precisión segura gracias a `useRollingBoundary`.
- El formato de variación por moneda para cripto usa hasta 8 decimales; montos muy pequeños (satoshis)
  pueden mostrar hasta 8 dígitos — aceptado por la naturaleza de la app.
- El orden "Variación (hoy)" cambia posiciones que el usuario puede haber memorizado → mitigación:
  control explícito con opción "Nombre".

## Migration Plan

- No hay migración de datos ni cambios de colecciones o índices. Solo deploy de código Next.js.
- Rollback: quitar los nuevos hooks/componentes y restablecer `AccountCard` al estado previo; la API
  sigue respondiendo la ancla sin `limit`.