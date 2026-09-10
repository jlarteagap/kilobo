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
- Exponer la variación diaria del balance (vs el cierre de ayer) con un badge consistente con
  "Minimal · Zinc".

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

**D4 — Lectura de la ancla diaria (no del último cambio a secas).**
El API `GET /api/account-balance-changes?account_id=X&before=<ISO>` recibe el límite del periodo
calculado en el cliente (fecha local) y el repository responde con `findLastBefore(accountId,
userId, before)`: el cambio de fecha más reciente estrictamente anterior a `before` (`limit(1)` +
índice compuesto). Su `new_balance` es el balance al cierre del día anterior = la ancla de la
comparación. El hook pide una ancla por cuenta en paralelo; con máximo 10 cuentas la carga es
despreciable. Recibir `before` desde el cliente evita desfases de zona horaria entre cliente y
servidor.

**D5 — Badge "Minimal · Zinc" de variación diaria en `AccountCard`.**
`delta = balance_actual − ancla`. Tres estados:
1. `delta ≠ 0` → pill firmado con signo, monto compacto, etiqueta "Hoy"; emerald `#047857`/`#059669`
   para subidas, zinc `#27272A` para bajadas, `rounded-full`, `text-[11px]`, `tabular-nums`.
2. `delta === 0` (sin movimientos en el periodo) → pill neutro de aviso "Sin cambios · {tiempo
   relativo del último cambio}". Nunca se muestra "+0"/"0".
3. Sin ancla (sin registros previos al inicio del periodo) → sin badge; la tarjeta se mantiene limpia.
El signo se pinta en el color del acento y el monto en el texto; la referencia temporal se ejecuta en
el cliente con `Intl.RelativeTimeFormat` (utilidad reutilizable, ampliada a meses/años para el
estado neutro).

**D6 — Límite del periodo diario a las 4:00 AM locales.**
`startOfDailyPeriod(date)` normaliza a la 4:00 AM más reciente en hora local: `setHours(4,0,0,0)` y,
si el resultado supera `now` (es de madrugada), retrocede un día. Los cambios registrados entre 0:00
y 3:59 pertenecen al periodo que cierra — su valor queda capturado en la ancla del nuevo periodo y no
se cuenta como variación del día que inicia.

## Risks / Trade-offs

- Escrituras no atómicas existentes (debt, inversions) → Mitigación: reescribirlas como `batch`;
  verificar con tests de servicio.
- Coste/perf de la query de la ancla por cada cuenta en páginas grandes → Mitigación: `limit(1)`
  + índice compuesto `user_id + account_id + createdAt`; pocas cuentas (máx 10) hace la carga
  despreciable.
- **Sin el índice compuesto desplegado en Firestore, las lecturas del badge fallan (HTTP 500) y no
  se visualiza ningún badge.** El índice se define en `firestore.indexes.json` pero solo se aplica
  con `firebase deploy --only firestore:indexes` → Paso obligatorio de despliegue (ver Migration
  Plan).
- **Sin backfill, las cuentas preexistentes no tienen ancla previa al inicio del periodo y el badge
  queda oculto durante el primer día** → Backfill requerido (ver Migration Plan).
- Desfase de zona horaria al calcular el límite del día → Mitigación: el cliente calcula la 4:00 AM
  local y envía el instante absoluto (ISO); el servidor compara timestamps (instantáneos) sin
  interpretar zonas.
- Cuentas inactivas muestran "Sin cambios" aunque tengan inversiones → Trade-off aceptado: el estado
  del balance tiene prioridad sobre el pill "X invertidos"; se documenta en este mismo change.
- Multiplicidad de orígenes puede quedar incompleta si se omite un punto de mutación → Mitigación:
  lista explícita de los 4 orígenes en tasks y revisión con `codegraph` de todos los escritores de
  `balance`.

## Migration Plan

**Requerido — Índice compuesto.** Antes del primer deploy funcional:
`firebase deploy --only firestore:indexes --project kiposbo`. Sin él, las queries `findLastBefore`
(y la lectura del último cambio original) lanzan error y ningún badge se muestra.

**Requerido — Backfill de anclas.** `npx tsx scripts/backfill-account-balance-anchors.ts` siembra un
registro por cuenta sin historial (previous = new = balance actual, delta 0, source 'ACCOUNT',
timestamps = createdAt de la cuenta). Así toda cuenta preexistente tiene ancla anterior al inicio del
periodo y el badge es visible desde el primer día: firmado ("Hoy") si hubo movimientos, o neutro
("Sin cambios · hace X"). Idempotente: omite cuentas ya sembradas. Correctivo: `npx tsx
scripts/diagnose-balance-badges.ts` confirma si la query falla por índice faltante.

- Cuentas creadas el mismo día del backfill conservan el ancla con fecha de creación; si se crearon
  después de las 4:00, el badge aparece al día siguiente.
- Rollback: eliminar la escritura del registro y el badge; la colección puede conservarse sin afectar
  el resto del sistema.

## Open Questions

- (Ninguna que cambie specs, enfoque o desglose de tareas.)
