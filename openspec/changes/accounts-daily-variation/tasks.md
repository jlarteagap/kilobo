## 1. API y lectura del historial

- [x] 1.1 Extender la API route: `?limit=N` → respuesta `{ changes }` (orderBy createdAt desc);
      mantener `{ change }` cuando no hay `limit`
- [x] 1.2 Crear hook `useAccountBalanceHistory(accountId, limit)` (query lazy, no carga en listado)
- [x] 1.3 Crear util `sourceLabel(source)` y formateo de fecha/hora absoluta para el historial

## 2. Variación consolidada y ordenamiento

- [x] 2.1 Crear hook `useAccountDailyDeltas()` (calcula delta por cuenta; hoisting desde AccountCard)
- [x] 2.2 Mostrar la variación consolidada (en BOB) bajo el Patrimonio Total, con signo y etiqueta "hoy"
- [x] 2.3 Control de orden (Variación (hoy) / Nombre / Balance) + aplicar orden en la grilla
      (delta desc, cuentas sin ancla al final)

## 3. Refinamiento del badge neutro

- [x] 3.1 Aplicar las reglas del estado neutro: prioridad "X invertidos", umbral de periodo
      (`lastChangeAt < startOfDailyPeriod`), nunca "+0"/"0"

## 4. Refetch al cruzar el límite del día

- [x] 4.1 `useRollingBoundary` en `useAccountBalanceChanges` — timer con `useEffect` que
      recalcula el `before` justo después de la siguiente 4:00 AM local

## 5. UI del historial

- [x] 5.1 Hacer clicables el badge y el balance de la tarjeta (abren el diálogo)
- [x] 5.2 Crear `AccountHistoryDialog` (lista de entradas, separador "Cierre de ayer: Bs X",
      skeleton y empty state)

## 6. Desglose por moneda

- [x] 6.1 Separar el patrimonio por moneda (sin total único en BOB); cada fila muestra subtotal
      en su moneda; las extranjeras muestran "≈ Bs X" con conversión a BOB
- [x] 6.2 Variación diaria por moneda: chip compacto en cada fila del breakdown (delta en la
      moneda nativa, sin símbolo para cripto, silencioso en 0)

## 7. Formato por moneda

- [x] 7.1 Crear `formatAssetAmount` en `account-display.utils.ts` (BOB/USD con símbolo;
      cripto como número plano hasta 8 decimales) y usarlo en tarjetas, diálogo de historial
      y tooltip del badge

## 8. Verificación

- [x] 8.1 Correr `npm run lint` y `npx tsc --noEmit`
- [x] 8.2 Auditoría de la skill `design-taste-frontend` del diálogo y los nuevos estados
      (contraste AA, color único, consistencia de radios)
- [ ] 8.3 Verificar en la app (dev con credenciales reales o deploy a prod) que el desglose
      por moneda, la variación por moneda y el formato cripto se ven correctos
