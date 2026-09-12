# Driver Maintenance Reserve — 6% sobre neto líquido

**Fecha:** 2026-09-12  
**Estado:** Diseño aprobado, pendiente implementación

## Resumen

Calcular un 6% de mantenimiento sobre el neto líquido pre-mantenimiento de cada turno, crear una transacción de gasto automática (MAINTENISM) en `expenseCashAccountId`, y mostrar el cálculo en SummaryCard (por turno), DashboardSummary "Hoy", y ShiftAnalytics (resumen mensual).

## Base de cálculo

```
preMaintenanceLiquid = cash + qr + propinas − comisiones − gastos_estandar
maintenanceReserve   = preMaintenanceLiquid > 0 ? preMaintenanceLiquid × 0.06 : 0
liquidEarnings       = preMaintenanceLiquid − maintenanceReserve
```

El porcentaje (6%) es fijo por ahora. En el futuro podría pasarse a `DriverConfig` si el usuario lo pide.

## Modelo de datos

### DriverShift (nuevo campo)

```ts
maintenanceReserve: number  // 0 si turno anterior al feature
```

### DriverAnalyticsSummary (nuevo campo)

```ts
totalMaintenance: number
```

### Campos existentes sin cambio

- `liquidEarnings` — ahora **incluye** la deducción de mantenimiento (es el neto real después de todo).
- `pendingAmount` — sin cambio (`card + bonos`).
- `grossEarnings` — sin cambio.
- `totalExpenses` — **no incluye** el mantenimiento (se calcula después de los gastos estándar).

## Lógica en `processShiftTransactions`

Ubicación: después del bloque de expenses estándar, antes de calcular `liquidEarnings`.

```ts
// 1. Liquid pre-mantenimiento
const preMaintenanceLiquid = cashEarnings + qrEarnings + totalTips - totalCommissions - totalExpenses

// 2. Cálculo del 6%
const maintenanceReserve = preMaintenanceLiquid > 0 ? preMaintenanceLiquid * 0.06 : 0

// 3. Crear transacción de gasto si hay monto
if (maintenanceReserve > 0) {
  await createTx({
    account_id: config.expenseCashAccountId,
    project_id: config.projectId,
    subtype: config.subtypeMapping.maintenance,
    type: 'EXPENSE',
    amount: maintenanceReserve,
    date: shiftDate,
    description: 'Mantenimiento (6%)',
  })
  createdTxIds.push(result.id)
}

// 4. liquidEarnings final
const liquidEarnings = preMaintenanceLiquid - maintenanceReserve
```

`maintenanceReserve` se agrega al objeto retornado por `processShiftTransactions` y se almacena en Firestore vía `driverRepository.create/update`.

### Normalización en `normalizeShift`

```ts
maintenanceReserve: typeof data.maintenanceReserve === 'number' ? data.maintenanceReserve : 0,
```

## getAnalytics

```ts
// Summary
const totalMaintenance = shifts.reduce((s, sh) => s + (sh.maintenanceReserve ?? 0), 0)

// return { summary: { ...existing, totalMaintenance } }
```

`liquidEarnings` en el summary ya refleja el neto post-mantenimiento (ya está restado en cada turno).

## UI

### SummaryCard (por turno)

Añadir fila entre "Neto líquido" y la línea separadora:

```
Neto líquido              Bs 100.00
Mantenimiento 6%           -6.00     ← destructive
───────────────────────────────────
Total bruto                ...
```

La fila solo aparece si `maintenanceReserve > 0`.

Componente: `Row` existente con label `"Mantenimiento 6%"`, value negativo, color `text-destructive`.

Para el cálculo display, `preMaintenanceLiquid = liquidEarnings + maintenanceReserve`.

### DashboardSummary — tarjeta "Hoy"

El valor principal sigue siendo `liquidEarnings` (ya incluye mantenimiento). Añadir sub-label bajo el valor:

```tsx
{maintenanceToday > 0 && (
  <p className="text-[11px] font-medium opacity-60 tabular-nums">
    {formatBs(maintenanceToday)} mant.
  </p>
)}
```

Requiere agregar `maintenanceToday` al useMemo del componente (sumar `maintenanceReserve` de turnos de hoy).

### ShiftAnalytics — Desglose bruto

Añadir quinta tarjeta en la grid `2×2` → `grid-cols-2 lg:grid-cols-3` para acomodar 5 tarjetas:

```
┌──────────────────┐
│  Mantenimiento   │
│   Bs 120.00      │
│  6% del neto     │
└──────────────────┘
```

Color: amber (similar a bonos/pending).

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/types/driver.ts` | `maintenanceReserve` en `DriverShift`, `totalMaintenance` en `DriverAnalyticsSummary` |
| `src/repositories/driver.repository.ts` | `normalizeShift` — default 0 para `maintenanceReserve` |
| `src/services/driver.service.ts` | `processShiftTransactions` — cálculo + transacción; `getAnalytics` — `totalMaintenance` |
| `src/features/driver/components/ShiftForm.tsx` | `SummaryCard` — fila Mantenimiento 6% |
| `src/features/driver/components/DashboardSummary.tsx` | sub-label "mant." bajo tarjeta Hoy |
| `src/features/driver/components/ShiftAnalytics.tsx` | quinta tarjeta en desglose bruto |

## Backward compatibility

- Turnos antiguos sin `maintenanceReserve`: normalizado a 0 en `normalizeShift`.
- No se recalculan turnos existentes — el feature solo aplica a turnos nuevos y editados.
- `totalExpenses` no se modifica (mantiene solo gastos estándar del usuario).

## Verificación

- [ ] `npx tsc --noEmit` limpio
- [ ] `npm run lint` sin errores nuevos sobre baseline
- [ ] Prueba manual: turno con liquid > 0 crea gasto "Mantenimiento (6%)" en `expenseCashAccountId`
- [ ] SummaryCard muestra fila Mantenimiento 6%
- [ ] DashboardSummary Hoy muestra sub-label
- [ ] ShiftAnalytics muestra tarjeta Mantenimiento en desglose
- [ ] Turno con liquid ≤ 0 no crea gasto ni reserva
