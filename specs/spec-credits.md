# Spec: Créditos Institucionales

## 1. Resumen

Módulo para registrar y dar seguimiento a créditos institucionales (bancarios, vehiculares, tarjetas de crédito, hipotecarios, de consumo). Cada crédito tiene cuotas mensuales con desglose de interés, amortización y seguro.

Es un módulo separado del existente `debts` (que maneja préstamos persona-persona tipo GIVEN/RECEIVED).

---

## 2. Tipos de crédito

| Tipo | Label |
|------|-------|
| `BANK` | Bancario |
| `VEHICLE` | Vehicular |
| `CREDIT_CARD` | Tarjeta de crédito |
| `MORTGAGE` | Hipotecario |
| `CONSUMER` | De consumo |

---

## 3. Estados

### Crédito

| Estado | Significado |
|--------|-------------|
| `ACTIVE` | Crédito vigente, con cuotas pendientes |
| `PAID` | Todas las cuotas pagadas |
| `CANCELLED` | Cancelado anticipadamente |

### Cuota

| Estado | Significado |
|--------|-------------|
| `PENDING` | Pendiente de pago |
| `PAID` | Pagada |
| `OVERDUE` | Vencida (fecha pasada y no pagada) |

---

## 4. Data model

### Credit

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Firestore doc ID |
| `user_id` | `string` | Propietario |
| `type` | `CreditType` | Tipo de crédito |
| `institution` | `string` | Nombre de la institución |
| `original_amount` | `number` | Monto original del crédito |
| `disbursed_amount` | `number` | Monto realmente desembolsado (puede diferir por comisiones) |
| `currency` | `string` | Moneda (BOB/USD) |
| `annual_interest_rate` | `number` | Tasa de interés anual (ej: 12.5 = 12.5%) |
| `total_installments` | `number` | Plazo total en meses |
| `paid_installments` | `number` | Cuotas ya pagadas antes de registrar (para créditos con historial) |
| `current_balance` | `number` | Saldo deudor actual al momento de registrar |
| `start_date` | `string` | Fecha de inicio (ISO date) |
| `first_payment_date` | `string` | Fecha del primer pago (ISO date) |
| `account_id` | `string` | Cuenta asociada |
| `insurance_config` | `InsuranceConfig \| null` | Configuración del seguro (ver abajo) |
| `status` | `CreditStatus` | Estado del crédito |
| `disburse_recorded` | `boolean` | Si se registró o no el desembolso como transacción |
| `notes` | `string \| null` | Notas opcionales |
| `created_at` | `string` | ISO date |
| `updated_at` | `string` | ISO date |

### InsuranceConfig

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `type` | `'percentage_on_balance' \| 'percentage_on_original' \| 'fixed_monthly' \| 'annual_premium' \| 'none'` | Tipo de seguro |
| `value` | `number \| null` | Porcentaje o monto según el tipo |

### Installment (subcolección de credit)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Firestore doc ID |
| `credit_id` | `string` | Crédito padre |
| `number` | `number` | Número de cuota (1-indexed, relativo a lo que falta) |
| `due_date` | `string` | Fecha de vencimiento (ISO date) |
| `total_amount` | `number` | Monto total de la cuota |
| `principal` | `number` | Amortización de capital |
| `interest` | `number` | Interés del período |
| `insurance` | `number` | Seguro del período |
| `remaining_balance` | `number` | Saldo deudor después de pagar esta cuota |
| `status` | `InstallmentStatus` | Estado |
| `paid_at` | `string \| null` | Fecha de pago |
| `transaction_id` | `string \| null` | ID de la transacción generada |
| `created_at` | `string` | ISO date |

---

## 5. Flujo de registro

### 5.1 Crédito nuevo (sin historial)

1. Usuario completa formulario con tipo, institución, monto, tasa, plazo, fecha inicio, cuenta, seguro (opcional), moneda
2. `original_amount = disbursed_amount` (son iguales)
3. Sistema calcula N cuotas hacia adelante usando sistema francés:
   - Tasa mensual = `(1 + tasa_anual)^(1/12) - 1`
   - Cuota fija = `P * [i(1+i)^n] / [(1+i)^n - 1]` donde P = monto, i = tasa mensual, n = plazo
   - Por cuota: interés = `saldo_anterior * i`, amortización = `cuota - interés - seguro`, seguro = según `insurance_config`
4. Checkbox "Registrar desembolso" (default: true)
   - Si marcado → crea transacción INCOME en `account_id` por `disbursed_amount`
   - Si no marcado → no crea transacción

### 5.2 Crédito con historial (ya tiene cuotas pagadas)

1. Usuario ingresa: `saldo_deudor_actual`, `cuotas_restantes`, `tasa_interes_anual`, `fecha_primer_pago` (de la primera cuota restante)
2. `original_amount` = monto original del crédito (para referencia)
3. `paid_installments` = cuotas ya pagadas
4. `total_installments` = `paid_installments + cuotas_restantes`
5. Sistema calcula cuotas solo hacia adelante desde `saldo_deudor_actual`
6. No se genera ni se crean transacciones por cuotas pasadas
7. Checkbox "Registrar desembolso" igual que 5.1

---

## 6. Flujo de pago de cuota

1. Usuario selecciona cuota(s) a pagar
2. Sistema verifica que la cuenta tenga saldo suficiente
3. Crea transacción EXPENSE en la cuenta asociada
4. Marca cuota como `PAID`, guarda `paid_at` y `transaction_id`
5. Actualiza `current_balance` del crédito (`-= principal`)
6. Si era `OVERDUE` y se paga → pasa a `PAID`
7. Si es la última cuota → crédito pasa a `PAID`

### Pago múltiple

El usuario puede pagar varias cuotas a la vez (ej: 3 cuotas vencidas). Cada cuota genera su propia transacción.

---

## 7. Cancelación

1. Usuario cancela el crédito
2. Todas las cuotas `PENDING`/`OVERDUE` pasan a `CANCELLED`
3. Crédito pasa a `CANCELLED`
4. No se revierte balance de la cuenta

---

## 8. Dashboard

- Módulo de créditos en sidebar (`/credits`)
- En dashboard principal:
  - Widget resumen: total prestado, cuotas pendientes, próxima cuota (monto + fecha)
  - Barra de progreso: cuotas pagadas / total
- En página de detalle de crédito:
  - Tabla de cuotas con estado, fecha, montos desglosados
  - Gráfico de amortización: saldo deudor vs tiempo (línea descendente)
  - Acción: pagar cuota(s)

---

## 9. Estados de cuota vencida

- Un proceso (server-side o client-side) detecta cuotas con `due_date < hoy` y `status = PENDING`
- Se marcan como `OVERDUE` automáticamente (al cargar o vía cron)
- En UI se muestran con indicador visual (rojo, badge "Vencida")

---

## 10. API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/credits` | Listar créditos del usuario |
| POST | `/api/credits` | Crear crédito (genera cuotas) |
| GET | `/api/credits/[id]` | Detalle + cuotas |
| PATCH | `/api/credits/[id]` | Cancelar crédito |
| DELETE | `/api/credits/[id]` | Eliminar (solo si está CANCELLED) |
| POST | `/api/credits/[id]/pay` | Pagar una o más cuotas |

---

## 11. Stack y patrones

- **Rutas API**: `src/app/api/credits/` (misma estructura que `debts`)
- **Repositorio**: `src/repositories/credits.repository.ts`
- **Servicio**: `src/services/credits.service.ts`
- **Validaciones Zod**: `src/lib/validations/credit.schema.ts`
- **Tipos**: `src/types/credit.ts`
- **Feature components**: `src/features/credits/`
- **Hooks TanStack Query**: `src/features/credits/hooks/useCredits.ts`
- **Autenticación**: `getUserId()` de `src/lib/auth.server.ts` — mismo patrón
- **Dashboard widgets**: `src/features/dashboard/components/` con componentes como `DashboardCredits.tsx`
- **Cálculo de cuotas**: función pura en `src/lib/amortization.ts` (fórmula francés)
