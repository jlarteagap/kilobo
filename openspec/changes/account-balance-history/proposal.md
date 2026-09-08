## Why

Los usuarios no pueden ver rápidamente cómo ha cambiado el balance de una cuenta sin navegar al
historial de transacciones. Hoy el campo `balance` de una cuenta es una cifra mutable que se
sobrescribe directamente desde transacciones, inversiones, deudas y ediciones manuales, sin dejar
rastro del valor anterior. Esto impide darse cuenta de movimientos recientes (p. ej. "ayer esta
cuenta subió 8 Bs") con un vistazo.

## What Changes

- Crear una nueva colección Firestore `account_balance_changes` que registre cada cambio sobre el
  balance de una cuenta (valor anterior, valor nuevo, delta, fuente/origen, timestamp).
- Escribir un registro de cambio cada vez que el balance de una cuenta se modifica desde cualquiera
  de sus orígenes: creación/edición manual de cuenta, transacciones (ingreso/egreso/transferencia/
  ahorro), compra/venta/edición/eliminación de inversiones y operaciones de deuda.
- Leer el último cambio de balance por cuenta y mostrarlo como un badge sutil en cada `AccountCard`,
  indicando dirección (+/-), monto y referencia temporal relativa ("ayer", "hace 2 h"), bajo el
  diseño "Minimal · Zinc".
- El badge muestra únicamente el cambio más reciente; el historial completo queda almacenado en
  Firestore para uso futuro.

## Capabilities

### New Capabilities
- `account-balance-history`: registro persistente de cambios sobre el balance de una cuenta
  (colección, escritura desde todos los orígenes, lectura del último cambio) y su visualización como
  badge de último cambio en las tarjetas de cuentas.

### Modified Capabilities
- Ninguna. (No hay spec existente para `accounts`; el cambio introduce una capacidad nueva sin
  alterar requisitos de capacidades ya definidas.)

## Impact

- **Nuevos archivos de datos**: `src/repositories/account-balance-history.repository.ts`, servicio de
  escritura/lectura.
- **Puntos de escritura**: `accounts.service.ts`, `balance.service.ts` (transacciones),
  `investments.service.ts`, `debt.service.ts` — cada operación que muta `balance` debe persistir un
  registro de cambio en el mismo batch para mantener atomicidad.
- **Lectura/UI**: `src/features/accounts/AccountsList.tsx` (nuevo badge en `AccountCard`), hook de
  TanStack Query, tipos en `src/types/account.ts`.
- **Diseño**: badge siguiendo `docs/DESIGN-MANUAL.md` §11 "Minimal · Zinc" (zinc neutros, acento
  emerald `#059669`, `rounded-full`, `text-xs`, `tabular-nums`), con auditoría de la skill
  `design-taste-frontend`.
- **Base de datos**: nueva colección Firestore `account_balance_changes` con índices por
  `account_id` + `created_at`.
- Sin cambios de dependencias ni infraestructura (no se agregan Cloud Functions).
