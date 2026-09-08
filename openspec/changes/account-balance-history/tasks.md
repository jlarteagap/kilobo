## 1. Datos y repositorio

- [x] 1.1 Crear tipos para un `AccountBalanceChange` (id, user_id, account_id, previous_balance,
      new_balance, delta, source, created_at) en `src/types/account.ts`
- [x] 1.2 Crear `src/repositories/account-balance-history.repository.ts` con `add(batch, change)`
      (para atomicidad) y `findLatestByAccount(accountId, userId)`
- [x] 1.3 Agregar índice Firestore compuesto `account_id` (asc) + `created_at` (desc) en `firebase.json`

## 2. Registro desde todos los orígenes

- [x] 2.1 Crear helper central de registro (cálculo de delta + normalización) en el repository/servicio
- [x] 2.2 Integrar el registro en `balance.service.ts` (`applyForCreate`/`applyForDelete`) vía batch
- [x] 2.3 Integrar el registro en `accounts.service.ts` (edición manual del balance) usando batch
- [x] 2.4 Integrar el registro en `investments.service.ts` (crear/comprar/vender/editar/eliminar)
- [x] 2.5 Integrar el registro en `debt.service.ts` (crear/pagar/cancelar)
- [x] 2.6 Verificar con codegraph que no queda ningún escritor de `balance` sin registrar

## 3. Lectura y hook

- [x] 3.1 Crear hook TanStack Query `useAccountBalanceChanges(accountIds)`
- [x] 3.2 Crear API route (o ampliar la existente) para leer el último cambio por cuenta(s)

## 4. UI del badge (diseño "Minimal · Zinc" + auditoría taste)

- [x] 4.1 Crear utilidad de tiempo relativo con `Intl.RelativeTimeFormat` (es-ES)
- [x] 4.2 Crear componente `AccountChangeBadge` (emerald para subidas, zinc para bajadas,
      `rounded-full`, `text-xs`, `tabular-nums`)
- [x] 4.3 Integrar el badge en `AccountCard` (AccountsList.tsx)
- [x] 4.4 Auditoría de la skill `design-taste-frontend` sobre el badge y la tarjeta (color único,
      contraste AA, estados vacío/carga, consistencia de radios)
- [x] 4.5 Correr `npm run lint` y `npx tsc --noEmit`
