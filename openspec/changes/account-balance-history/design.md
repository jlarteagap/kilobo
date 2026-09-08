## Context

Ver proposal.md — Why. El balance de una cuenta en `accounts` es un campo escalar mutable que se
sobrescribe desde múltiples servicios: `balance.service.ts` (transacciones vía `batch`),
`accounts.service.ts` (edición manual), `investments.service.ts` y `debt.service.ts` (ambos con
`accountsRepository.update()`). No existe ningún mecanismo de auditoría ni colección de historial en
el proyecto (sin Cloud Functions). Los puntos de mutación son el requisito central para garantizar
que todo cambio quede registrado.

## Goals / Non-Goals

**Goals:**
- Registrar de forma persistente y atómica cada cambio de balance desde todos los orígenes.
- Exponer el último cambio con un badge consistente con "Minimal · Zinc".

**Non-Goals:**
- No implementar un panel/lista de historial completo en la UI (solo se muestra el último cambio; la
  colección queda lista para un futuro explorador).
- No reconstruir balances calculándolos desde cero.
- No agregar Cloud Functions ni listeners en tiempo real.

## Decisions

**D1 — Colección `account_balance_changes` (no un array en el documento de la cuenta).**
Una colección permite historial ilimitado, queries simples (`where account_id` + `orderBy created_at
desc`) y crecimiento acotado de cada documento de cuenta. Alternativa descartada: array en la cuenta
limita a N cambios y hace crecer documentos leídos en cada lista.

**D2 — Escritura atómica en el mismo batch de la operación.**
Donde la mutación ya usa un `batch` de Firestore (transacciones, inversiones), se agrega el `set` del
registro de cambio al mismo batch para mantener atomicidad. Donde la mutación usa `update()` directo
(debt y edición manual), se reescribe usando un `batch` que actualice el balance y cree el registro
juntos. Esto evita el sesgo actual de escrituras no atómicas.

**D3 — Un facades central de registro para calcular el delta y normalizar el documento.**
Un helper `createBalanceChange(accountId, previous, current, source)` (en el repository/servicio)
calcula el delta automáticamente y devuelve el documento a persistir, evitando lógica duplicada en
los 4 orígenes.

**D4 — Lectura del último cambio por lote (no N queries).**
El hook `useAccountBalanceChanges(accountIds)` hace una query por cuenta con `limit(1)` en paralelo
o una sola query filtrada por los ids de la página. El badge se pinta leyendo el primer registro de
cada cuenta. Con máximo 10 cuentas por usuario, la carga es despreciable.

**D5 — Badge "Minimal · Zinc" en `AccountCard`.**
Acento emerald `#059669` para subidas, zinc `#27272A` para bajadas, `rounded-full`, `text-xs`
`tabular-nums`, mismo `rounded-[22px]` y legibilidad de la tarjeta existente. Referencia temporal
relativa ejecutada en el cliente con `Intl.RelativeTimeFormat` (copada a una utilidad reutilizable).

## Risks / Trade-offs

- Escrituras no atómicas existentes (debt, inversions) → Mitigación: reescribirlas como `batch`;
  verificar con tests de servicio.
- Coste/perf de la query del último cambio por cada cuenta en páginas grandes → Mitigación: `limit(1)`
  + índice compuesto `account_id + created_at`; pocas cuentas (máx 10) hace la carga despreciable.
- Multiplicidad de orígenes puede quedar incompleta si se omite un punto de mutación → Mitigación:
  lista explícita de los 4 orígenes en tasks y revisión con `codegraph` de todos los escritores de
  `balance`.

## Migration Plan

- Backfill opcional: para cuentas sin historial, no se crean registros retroactivos; el badge aparece
  desde el primer cambio posterior al deploy. Se documenta como comportamiento esperado en Non-Goals.
- Rollback: eliminar la escritura del registro y el badge; la colección puede conservarse sin afectar
  el resto del sistema.

## Open Questions

- (Ninguna que cambie specs, enfoque o desglose de tareas.)
