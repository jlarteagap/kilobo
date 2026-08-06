# Plan de Implementación — Módulo Conductor

**Basado en:** `docs/superpowers/specs/2026-07-29-driver-earnings-design.md`
**Orden:** Dependencias primero, UI al final.

---

## Fase 1: Tipos y Validaciones

### 1.1 `src/types/driver.ts` — Tipos base

```typescript
export type DriverApp = 'UBER' | 'YANGO' | 'INDRIVE'
export type DriverShiftStatus = 'ACTIVE' | 'CLOSED'

export interface DriverShift {
  id: string
  user_id: string
  startTime: string
  endTime: string | null
  status: DriverShiftStatus
  startKm: number | null
  endKm: number | null
  totalKm: number | null
  earnings: Record<DriverApp, number>
  bonuses: Record<DriverApp, number>
  commissions: Record<DriverApp, number>
  totalEarnings: number
  totalBonuses: number
  totalCommissions: number
  netEarnings: number
  incomeAccountId: string
  expenseAccountId: string
  generatedTransactionIds: string[]
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type CreateDriverShiftData = Pick<DriverShift, 'startKm' | 'notes'>
export type CloseShiftData = {
  endKm: number | null
  earnings: Record<DriverApp, number>
  bonuses: Record<DriverApp, number>
  commissions: Record<DriverApp, number>
  incomeAccountId: string
  expenseAccountId: string
  notes: string | null
}
```

### 1.2 `src/lib/validations/driver.schema.ts` — Zod schemas

- `closeShiftSchema`: valida earnings, bonuses, commissions (números >= 0), cuentas requeridas
- `CreateDriverShiftInput` / `CloseShiftInput` tipos inferidos con `z.infer`

---

## Fase 2: Repositorio

### 2.1 `src/repositories/driver.repository.ts`

Colección Firestore: `driver_shifts`

Métodos:
- `findAll(userId)` → `DriverShift[]`
- `findById(id, userId)` → `DriverShift | null`
- `findActive(userId)` → `DriverShift | null` (status === 'ACTIVE', limit 1)
- `create(data, userId)` → `DriverShift`
- `update(id, data)` → `DriverShift`
- `delete(id)`

Usar `FieldValue.serverTimestamp()` para `createdAt`/`updatedAt`, consistente con el patrón existente.

---

## Fase 3: Servicio

### 3.1 `src/services/driver.service.ts`

```typescript
export const driverService = {
  // Check-in
  async startShift(userId: string, startKm: number | null): Promise<DriverShift> {
    // 1. Verificar que no haya turno activo
    const active = await driverRepository.findActive(userId)
    if (active) throw new Error('Ya tienes un turno activo.')

    // 2. Crear turno con status ACTIVE
    return driverRepository.create({
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'ACTIVE',
      startKm,
      // ... defaults para earnings, bonuses, etc.
    }, userId)
  },

  // Check-out + generar transacciones
  async closeShift(userId: string, id: string, data: CloseShiftData): Promise<DriverShift> {
    const shift = await driverRepository.findById(id, userId)
    if (!shift) throw new Error('Turno no encontrado.')
    if (shift.status === 'CLOSED') throw new Error('El turno ya está cerrado.')

    // 1. Calcular totales
    const totalEarnings = sum(Object.values(data.earnings))
    const totalBonuses = sum(Object.values(data.bonuses))
    const totalCommissions = sum(Object.values(data.commissions))
    const netEarnings = totalEarnings + totalBonuses - totalCommissions
    const totalKm = data.endKm != null && shift.startKm != null
      ? data.endKm - shift.startKm
      : null

    // 2. Crear transacciones por app
    const txIds: string[] = []
    const DRIVER_APPS: DriverApp[] = ['UBER', 'YANGO', 'INDRIVE']

    for (const app of DRIVER_APPS) {
      if (data.earnings[app] > 0) {
        const tx = await transactionService.createWithBalance({
          account_id: data.incomeAccountId,
          type: 'INCOME',
          amount: data.earnings[app],
          description: `Ganancia ${app}`,
          // category_id: obtener categoryId para "Uber"/"Yango"/"InDrive"
        }, userId)
        txIds.push(tx.id)
      }
      if (data.bonuses[app] > 0) {
        const tx = await transactionService.createWithBalance({
          account_id: data.incomeAccountId,
          type: 'INCOME',
          amount: data.bonuses[app],
          subtype: app.toLowerCase(),
          description: `Bonos ${app}`,
          // category_id: "Bonos"
        }, userId)
        txIds.push(tx.id)
      }
      if (data.commissions[app] > 0) {
        const tx = await transactionService.createWithBalance({
          account_id: data.expenseAccountId,
          type: 'EXPENSE',
          amount: data.commissions[app],
          subtype: app.toLowerCase(),
          description: `Comisión ${app}`,
          // category_id: "Comisiones"
        }, userId)
        txIds.push(tx.id)
      }
    }

    // 3. Actualizar turno
    return driverRepository.update(id, {
      endTime: new Date().toISOString(),
      status: 'CLOSED',
      endKm: data.endKm,
      totalKm,
      earnings: data.earnings,
      bonuses: data.bonuses,
      commissions: data.commissions,
      totalEarnings,
      totalBonuses,
      totalCommissions,
      netEarnings,
      incomeAccountId: data.incomeAccountId,
      expenseAccountId: data.expenseAccountId,
      generatedTransactionIds: txIds,
      notes: data.notes,
    })
  },

  async getShifts(userId: string): Promise<DriverShift[]> { ... },
  async getActiveShift(userId: string): Promise<DriverShift | null> { ... },
  async getAnalytics(userId: string, period?: string): Promise<DriverAnalytics> { ... },
}
```

> **Nota:** Para la v1 se usa `transactionService.createWithBalance()` que ya maneja el batch y el balance. En una versión futura se puede agrupar en un solo batch las 9 transacciones.

---

## Fase 4: Server Actions (mutaciones)

### 4.1 `src/app/conductor/actions.ts`

```typescript
'use server'

import { driverService } from '@/services/driver.service'
import { getUserId } from '@/lib/auth.server'
import { revalidatePath } from 'next/cache'

export async function startShiftAction(startKm: number | null) {
  const userId = await getUserId()
  if (!userId) return { error: 'No autorizado' }
  await driverService.startShift(userId, startKm)
  revalidatePath('/conductor')
}

export async function closeShiftAction(id: string, data: CloseShiftInput) {
  const userId = await getUserId()
  if (!userId) return { error: 'No autorizado' }
  await driverService.closeShift(userId, id, data)
  revalidatePath('/conductor')
  revalidatePath('/conductor/analytics')
}
```

Patrón idéntico a `gasolina/actions.ts`.

---

## Fase 5: Route Handlers (lecturas)

### 5.1 `src/app/api/driver/shifts/active/route.ts`

- GET → `driverService.getActiveShift(userId)`

### 5.2 `src/app/api/driver/shifts/route.ts`

- GET → `driverService.getShifts(userId)` con query params paginación

### 5.3 `src/app/api/driver/analytics/route.ts`

- GET → `driverService.getAnalytics(userId, period?)` con query `?period=week|month`

---

## Fase 6: Hooks (TanStack Query)

### 6.1 `src/features/driver/hooks/useDriverShifts.ts`

- `useActiveShift()` → query key `['driver', 'active']`
- `useShifts()` → query key `['driver', 'list']`
- `useStartShift()` → mutation que invoca `startShiftAction()`
- `useCloseShift()` → mutation que invoca `closeShiftAction()`
- `onSettled`: invalidate `['driver']` queries

Patrón idéntico a `useTransactions.ts`.

### 6.2 `src/features/driver/hooks/useDriverAnalytics.ts`

- `useDriverAnalytics(period)` → query key `['driver', 'analytics', period]`

---

## Fase 7: UI — Componentes

### 7.1 `src/features/driver/types.ts`

Re-exportar desde `@/types/driver` más tipos específicos de UI si aplica.

### 7.2 `src/features/driver/utils/driver-metrics.utils.ts`

Funciones de cálculo:
- `formatDuration(ms)` → "6h 12m"
- `calculateBsPerHour(netEarnings, durationMs)` → number
- `calculateNet(earnings, bonuses, commissions)` → number
- Formateo de moneda y km

### 7.3 `src/features/driver/components/ActiveShiftCard.tsx`

**Props:** `shift: DriverShift`

Muestra:
- Indicador verde "Turno activo" + duración en vivo (useEffect con intervalo)
- Hora de inicio y km inicial
- Botón "Finalizar turno" → setea estado para mostrar `ShiftCloseForm`

### 7.4 `src/features/driver/components/ShiftCloseForm.tsx`

**Props:** `shift: DriverShift, accounts: Account[]`

Formulario con React Hook Form + Zod:
- 3 bloques (Uber, Yango, InDrive) con inputs para ganancia, bonos, comisión
- Km recorridos
- Selector de cuenta destino (ingresos) y cuenta gastos (comisiones)
- Vista previa de transacciones a generar (resumen en vivo)
- Botón "Guardar y generar transacciones"

Al submit → `closeShiftAction()` → notificación toast + recarga

### 7.5 `src/features/driver/components/ShiftHistory.tsx`

**Props:** `shifts: DriverShift[]`

Tabla de turnos recientes (últimos 20):
- Fecha, hora inicio-fin, duración
- Badges por app con ganancia (U:120 Y:88 I:50)
- Neto
- Indicador de tendencia (vs día anterior)

### 7.6 `src/features/driver/components/ShiftAnalytics.tsx`

**Props:** `shifts: DriverShift[]` (período seleccionado)

Cuadrícula de analytics:
- Resumen semanal: bruto, bonos, comisiones, neto, Bs/h, margen
- Tabla rendimiento por app (ingreso, bonos, comisiones, neto, horas, Bs/h)
- Gráfico de evolución diaria (Recharts, como existe en el proyecto)
- Insights automáticos

---

## Fase 8: Páginas

### 8.1 `src/app/conductor/page.tsx`

Server Component:
- Espera data (turno activo, turnos recientes, cuentas)
- Renderiza layout con `ActiveShiftCard` (si hay turno activo) o botón de check-in
- `ShiftCloseForm` (toggle cuando se finaliza turno)
- `ShiftHistory`
- Link a `/conductor/analytics`

### 8.2 `src/app/conductor/analytics/page.tsx`

Server Component:
- Renderiza `ShiftAnalytics`
- Selector de período (semana/mes)

---

## Fase 9: Sidebar + Navegación

### 9.1 Editar `src/components/layout/Sidebar.tsx`

Agregar al `navigation` array:
```typescript
import { SteeringWheel } from "lucide-react"

{ name: "Conductor", href: "/conductor", icon: SteeringWheel }
```

El middleware ya protege rutas privadas automáticamente (no requiere cambios).

---

## Resumen de Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/types/driver.ts` | CREAR |
| `src/lib/validations/driver.schema.ts` | CREAR |
| `src/repositories/driver.repository.ts` | CREAR |
| `src/services/driver.service.ts` | CREAR |
| `src/app/conductor/actions.ts` | CREAR |
| `src/app/conductor/page.tsx` | CREAR |
| `src/app/conductor/analytics/page.tsx` | CREAR |
| `src/app/api/driver/shifts/active/route.ts` | CREAR |
| `src/app/api/driver/shifts/route.ts` | CREAR |
| `src/app/api/driver/analytics/route.ts` | CREAR |
| `src/features/driver/types.ts` | CREAR |
| `src/features/driver/hooks/useDriverShifts.ts` | CREAR |
| `src/features/driver/hooks/useDriverAnalytics.ts` | CREAR |
| `src/features/driver/components/ActiveShiftCard.tsx` | CREAR |
| `src/features/driver/components/ShiftCloseForm.tsx` | CREAR |
| `src/features/driver/components/ShiftHistory.tsx` | CREAR |
| `src/features/driver/components/ShiftAnalytics.tsx` | CREAR |
| `src/features/driver/utils/driver-metrics.utils.ts` | CREAR |
| `src/components/layout/Sidebar.tsx` | MODIFICAR (1 línea) |

**Total: ~20 archivos, 19 crear + 1 modificar**
