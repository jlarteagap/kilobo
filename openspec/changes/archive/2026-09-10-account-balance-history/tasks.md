## 1. Datos y repositorio

- [x] 1.1 Crear tipos para un `AccountBalanceChange` (id, user_id, account_id, previous_balance,
      new_balance, delta, source, created_at) en `src/types/account.ts`
- [x] 1.2 Crear `src/repositories/account-balance-history.repository.ts` con `addInBatch` y
      `findLastBefore(accountId, userId, before)`
- [x] 1.3 Agregar índice Firestore compuesto `account_id` (asc) + `created_at` (desc) en
      `firestore.indexes.json`

## 2. Registro desde todos los orígenes

- [x] 2.1 Crear helper central de registro (cálculo de delta + normalización) en el repository/servicio
- [x] 2.2 Integrar el registro en `balance.service.ts` (`applyForCreate`/`applyForDelete`) vía batch
- [x] 2.3 Integrar el registro en `accounts.service.ts` (edición manual del balance) usando batch
- [x] 2.4 Integrar el registro en `investments.service.ts` (crear/comprar/vender/editar/eliminar)
- [x] 2.5 Integrar el registro en `debt.service.ts` (crear/pagar/cancelar)
- [x] 2.6 Verificar con codegraph que no queda ningún escritor de `balance` sin registrar

## 3. Lectura y hook (variación diaria)

- [x] 3.1 Crear utilidad `startOfDailyPeriod(date?)`: límite del día a las 4:00 AM locales
- [x] 3.2 Ajustar API route: aceptar `before` y responder con `findLastBefore`
- [x] 3.3 Ajustar hook `useAccountBalanceChanges` para pedir la ancla antes del límite
      (query key con `before`)

## 4. UI del badge (variación diaria)

- [x] 4.1 Ampliar `formatRelativeTime` a meses/años (`Intl.RelativeTimeFormat`)
- [x] 4.2 Componente `AccountChangeBadge` con tres estados: variación firmada ("Hoy"), pill neutro
      "Sin cambios · hace X", y sin ancla → sin badge
- [x] 4.3 Integrar el badge en `AccountCard` con `delta = balance actual − ancla`
- [x] 4.4 Auditoría de la skill `design-taste-frontend` sobre el badge y la tarjeta (color único,
      contraste AA, estados vacío/carga, consistencia de radios)
- [x] 4.5 Correr `npm run lint` y `npx tsc --noEmit`

## 5. Puesta en producción (requerido)

- [x] 5.1 Desplegar el índice compuesto con `firebase deploy --only firestore:indexes`
- [x] 5.2 Correr el backfill de anclas `npx tsx scripts/backfill-account-balance-anchors.ts`