# Conductor — Módulo de Optimización para Choferes de Apps

**Fecha:** 2026-07-29 (v2 — modelo definitivo)
**Autor:** Jorge / Agente
**Estado:** Aprobado

---

## 1. Resumen

Módulo dentro de Kilo para que un chofer de ride-hailing (Uber, Yango, InDrive) registre
sus turnos de trabajo con desglose por método de pago (efectivo, tarjeta, QR), capture
bonos y comisiones, y obtenga métricas de optimización como **neto líquido del día**
(excluyendo ingresos pendientes no cobrados).

Se integra con:
- **Gasolina**: lectura automática del odómetro al check-in + registro del trip al cerrar turno
- **Transacciones**: creación automática solo de ingresos líquidos (efectivo + QR) y gastos
- **Configuración**: mapeo único de campos → actividad + subtipo + cuenta

---

## 2. Historias de Usuario

1. **Como chofer**, quiero hacer check-in y que el sistema lea el odómetro de Gasolina
   automáticamente, para no tener que escribirlo dos veces.
2. **Como chofer**, quiero cerrar turno desglosando ganancia por app y por método de pago
   (efectivo, tarjeta, QR), para tener visibilidad real de lo que entra hoy.
3. **Como chofer**, quiero que las tarjetas y bonos NO generen transacciones (son pendientes),
   solo efectivo y QR, para no inflar mis ingresos con plata que aún no tengo.
4. **Como chofer**, quiero registrar gastos del turno (peaje, gasolina, mantenimiento)
   con su método de pago, para que cada gasto vaya a la cuenta correcta.
5. **Como chofer**, quiero que al cerrar turno se cree automáticamente un trip en Gasolina
   con los km recorridos, para mantener el odómetro actualizado sin doble entrada.
6. **Como chofer**, quiero configurar una vez el mapeo de campos → actividad + subtipo + cuenta,
   para que cada cierre use esa configuración sin repetirla.
7. **Como chofer**, quiero ver analytics con neto líquido real (sin pendientes) para saber
   cuánto gané realmente hoy.

---

## 3. Flujo Principal

```
[Settings]             ─── se configura 1 vez
  Actividad: "Conductor de apps"
  Subtipos: uber, yango, indrive, bonos, comisiones, peaje, gasolina, varios
  Cuentas: efectivo → [X], QR → [Y], comisiones → [Z], gastos → [Z]

[Check-in]
  │
  ├── Lee getActiveCycle() de Gasolina
  ├── Obtiene lastTrip.finalKm como startKm
  └── Crea turno ACTIVE

[Trabaja con apps alternando Uber, Yango, InDrive]

[Check-out] — formulario de cierre
  │
  ├── Por app (Uber / Yango / InDrive):
  │     Efectivo: [__] Bs  → va a cuenta efectivo
  │     Tarjeta:  [__] Bs  → pendiente (sin transacción)
  │     QR:       [__] Bs  → va a cuenta QR
  │     Bonos:    [__] Bs  → pendiente (sin transacción)
  │
  ├── Comisiones:
  │     Uber [__] │ Yango [__] │ InDrive [__]  → van a cuenta gastos
  │
  ├── Gastos del turno:
  │     Peaje:       [__] Bs → [Efectivo/QR ▼]
  │     Gasolina:    [__] Bs → [Efectivo/QR ▼]
  │     Mantenim.:   [__] Bs → [Efectivo/QR ▼]
  │     Otros:       [__] Bs → [Efectivo/QR ▼]
  │
  └── Resumen:
        Total bruto:     368 Bs
        Pendiente app:  -148 Bs  (tarjeta + bonos)
        Comisiones:      -59 Bs
        Gastos:          -92 Bs
        ─────────────────────
        🔵 NETO LÍQUIDO:  69 Bs

[Al guardar]
  │
  ├── Crea transacciones INCOME (solo efectivo + QR)
  │   Cada una con: actividad=Conductor de apps, subtipo={app}, cuenta={según config}
  ├── Crea transacciones EXPENSE (comisiones + gastos)
  │   Cada una con: actividad=Conductor de apps, subtipo={tipo}, cuenta={según config}
  ├── Crea trip en Gasolina: userName=Jorge, initialKm=startKm, finalKm=endKm
  ├── Guarda DriverShift con metadata completa (incluyendo pendientes)
  └── Revalida paths
```

---

## 4. Arquitectura

### 4.1 Tipos de datos

```typescript
// types/driver.ts

export type DriverApp = 'UBER' | 'YANGO' | 'INDRIVE'
export type DriverShiftStatus = 'ACTIVE' | 'CLOSED'
export type PaymentMethod = 'CASH' | 'CARD' | 'QR'
export type ExpenseType = 'TOLL' | 'GAS' | 'MAINTENANCE' | 'OTHER'

export interface DriverConfig {
  activityId: string           // category_id de "Conductor de apps"
  incomeCashAccountId: string
  incomeQrAccountId: string
  expenseAccountId: string     // para comisiones y gastos
  subtypeMapping: {
    uber: string               // "uber"
    yango: string              // "yango"
    indrive: string            // "indrive"
    bonus: string              // "bonos"
    commission: string         // "comisiones"
    toll: string               // "peaje"
    gas: string                // "gasolina"
    maintenance: string        // "mantenimiento"
    other: string              // "varios"
  }
}

export interface DriverShift {
  id: string
  user_id: string
  startTime: string
  endTime: string | null
  status: DriverShiftStatus
  startKm: number | null
  endKm: number | null
  totalKm: number | null
  // Desglose completo por app (se guarda aunque algunos no generen transacciones)
  earnings: Record<DriverApp, Record<PaymentMethod, number>>  // { UBER: { CASH: 20, CARD: 70, QR: 30 }, ... }
  bonuses: Record<DriverApp, number>
  commissions: Record<DriverApp, number>
  // Gastos del turno
  expenses: Array<{
    type: ExpenseType
    amount: number
    paymentMethod: PaymentMethod
  }>
  // Totales calculados
  totalEarnings: number        // suma de todo (efectivo + tarjeta + QR)
  totalBonuses: number
  totalCommissions: number
  totalExpenses: number
  grossEarnings: number        // totalEarnings + totalBonuses
  pendingAmount: number        // tarjeta + bonos (no generan transacción)
  liquidEarnings: number       // efectivo + QR - comisiones - gastos
  // Transacciones generadas
  generatedTransactionIds: string[]
  notes: string | null
  createdAt: string
  updatedAt: string
}
```

### 4.2 Nuevos archivos

```
src/
  features/
    driver/
      hooks/
        useDriverConfig.ts       ← leer/guardar config
      components/
        DriverSettings.tsx       ← formulario de configuración
  app/
    conductor/
      settings/
        page.tsx                 ← página de configuración
  repositories/
    driver-config.repository.ts  ← CRUD DriverConfig en Firestore
```

### 4.3 Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/types/driver.ts` | Nuevos tipos: DriverConfig, PaymentMethod, ExpenseType, DriverShift modificado |
| `src/services/driver.service.ts` | startShift: leer Gasolina. closeShift: nuevo modelo transaccional + crear trip Gasolina |
| `src/features/driver/components/ActiveShiftCard.tsx` | Sin input km, solo mostrar valor leído |
| `src/features/driver/components/ShiftCloseForm.tsx` | Rediseño completo con cash/card/qr + gastos + resumen neto líquido |
| `src/features/driver/components/ShiftAnalytics.tsx` | Actualizar métricas |
| `src/components/layout/Sidebar.tsx` | + Settings si aplica |

---

## 5. Integraciones

### 5.1 Con Gasolina

- **Check-in**: `carSharingRepository.getActiveCycle()` → último trip finalKm
- **Check-out**: `addTripAction({ userName: "Jorge", initialKm, finalKm })`

### 5.2 Con Transacciones

Solo se crean transacciones para:
- **Efectivo** (INCOME) → cuenta efectivo configurada
- **QR** (INCOME) → cuenta QR configurada
- **Comisiones** (EXPENSE) → cuenta gastos configurada
- **Gastos** (EXPENSE) → cuenta gastos configurada (o la que el usuario elija por método pago)

No se crean transacciones para:
- Tarjeta (pendiente en app)
- Bonos (pendiente en app)

### 5.3 Con Configuración

DriverConfig se guarda en `driver_config/{userId}` en Firestore.
Si no existe, el sistema guía al usuario a crearla antes de cerrar su primer turno.

---

## 6. UI

### 6.1 Settings (`/conductor/settings`)

```
Actividad: [Conductor de apps ▼]

Subtipos (se auto-completan según actividad):
  uber, yango, indrive, bonos, comisiones, peaje, gasolina, varios

Cuentas destino:
  Efectivo   → [Efectivo ▼]
  QR         → [Banco Mercantil ▼]
  Comisiones → [Gastos ▼]
  Gastos     → [Gastos ▼]
```

### 6.2 Cierre de turno

Ver ASCII en sección 3.

### 6.3 Analytics

- Neto líquido (métrica principal)
- Pendiente en app
- Comisiones totales
- Bs/h líquido
- Breakdown por app (efectivo vs tarjeta)
