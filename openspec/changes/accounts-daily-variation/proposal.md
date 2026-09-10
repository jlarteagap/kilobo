## Why

El badge de variación diaria (change `account-balance-history`, ya archivado) entrega solo un
delta por cuenta. La página de cuentas aún no aprovecha el historial persistido para explicar ese
delta, ni consolida la variación del día a nivel patrimonio, ni ordena las cuentas por relevancia,
ni se recupera del exceso de píldoras neutras en cuentas inactivas. Además, una sesión abierta
cruzando las 4:00 AM local no refresca el periodo. El usuario quiere: ver *por qué* cambió una
cuenta (historial), la variación neta de todo el día a nivel total, poder ordenar por esa variación,
un badge neutro menos ruidoso y un recálculo automático del límite del día.

## What Changes

- **Historial reciente por cuenta**: la API `GET /api/account-balance-changes` acepta `?limit=N` y
  devuelve los N cambios más recientes (newest-first). Un clic sobre el badge/balance de la tarjeta
  abre un diálogo "Minimal · Zinc" con origen, delta, balance anterior→nuevo, fecha/hora y un
  separador "Cierre de ayer" (ancla).
- **Variación consolidada en Patrimonio Total**: se suma la variación diaria de todas las cuentas con
  ancla, convertida a BOB, y se muestra con signo y etiqueta del periodo bajo el total.
- **Orden por variación del día**: control de orden en el header (Variación (hoy) / Nombre /
  Balance); las cuentas sin ancla quedan al final en el modo variación.
- **Badge neutro refinado**: el pill "Sin cambios · hace X" solo aparece con el último cambio en un
  periodo anterior y sin inversiones; con inversiones tiene prioridad "X invertidos"; nunca "+0"/"0".
- **Refetch automático del límite del día**: los hooks recalculan la ancla al cruzar la 4:00 AM
  local, sin requerir interacción.

## Capabilities

### New Capabilities
- `account-daily-variation`: variación diaria consolidada y explicable de las cuentas — historial
  reciente consultable, suma en patrimonio, ordenamiento, estados neutros refinados del badge y
  recálculo del periodo al cruzar el límite del día.

### Modified Capabilities
- Ninguna (la capability `account-balance-history` ya está archivada como spec principal; estas son
  ampliaciones de UI/lectura sobre ella, no cambios a sus requisitos de persistencia).

## Impact

- **API**: `src/app/api/account-balance-changes/route.ts` — nuevo parámetro `limit` (respuesta
  `{ changes }`), sin romper la respuesta `{ change }` usada por el badge. Reusa el índice
  `(user_id, account_id, createdAt DESC)` ya desplegado.
- **Hooks**: nuevo `useAccountDailyDeltas.ts` (hoisting del delta hoy calculado en `AccountCard`),
  `useAccountBalanceHistory.ts` (lazy), y `refetchInterval` dinámico en `useAccountBalanceChanges`.
- **UI**: `AccountsList.tsx` (Patrimonio Total, control de orden, tarjeta clicable),
  `AccountChangeBadge.tsx` (reglas neutras), nuevo `AccountHistoryDialog.tsx`, util
  `source-label.utils.ts`.
- **Datos**: sin cambios de colecciones ni índices; suma BOB usando `convertToBOB`.
- Sin cambios de dependencias ni infraestructura.