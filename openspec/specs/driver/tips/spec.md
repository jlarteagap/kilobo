# driver/tips Specification

## Purpose

Permite registrar la propina (excedente) que el pasajero paga en efectivo por encima de la ganancia que indica la app, de modo que el ingreso real del turno quede reflejado en finanzas y métricas.

## Requirements

### Requirement: Campo de propinas por app en el turno

El sistema SHALL aceptar un monto de propinas por cada app (UBER, YANGO, INDRIVE) al crear y editar un turno. `ShiftInput` SHALL incluir `tips: Record<DriverApp, number>` y `DriverShift` SHALL persistir `tips` (valor por defecto 0 en datos antiguos sin el campo). El formulario `ShiftForm` SHALL exponer un input "Propinas" por app (numérico, >= 0, moneda Bs) junto a los existentes de Bonos/Comisión, editable al crear y editar.

#### Scenario: Registrar propina al crear turno
- **WHEN** el conductor completa el turno con `tips.UBER = 5` y UBER efectivo `= 20`
- **THEN** el turno se guarda con `tips.UBER = 5` y el formulario muestra el desglose incluyendo la propina

#### Scenario: Editar propina de un turno existente
- **WHEN** el conductor edita un turno guardado y cambia `tips.YANGO` de 0 a 3
- **THEN** el sistema reprocesa el turno con la propina actualizada y revierte/recrea la transacción de propina anterior

#### Scenario: Turnos antiguos sin campo tips
- **WHEN** se lee un turno creado antes de este cambio (sin `tips`)
- **THEN** el sistema trata las propinas como `{ UBER: 0, YANGO: 0, INDRIVE: 0 }` sin errores

### Requirement: Propina como ingreso de efectivo con transacción

Al cerrar o editar un turno, por cada app con `tips[app] > 0` el servicio SHALL crear una transacción `INCOME` hacia la cuenta de efectivo del conductor (`config.incomeCashAccountId`), con el subtipo del app (`config.subtypeMapping.uber/yango/indrive`), fecha del turno y una descripción que la distinga (p.ej. "UBER propina"). La transacción SHALL registrarse en `generatedTransactionIds` para revertirse automáticamente al editar o eliminar el turno.

#### Scenario: Propina positiva genera transacción
- **WHEN** se guarda un turno con `tips.INDRIVE = 8`
- **THEN** se crea una transacción INCOME de 8 en `incomeCashAccountId` y su id queda en `generatedTransactionIds`

#### Scenario: Editar turno revierte la propina previa
- **WHEN** se edita un turno que tenía propina y ahora queda en 0
- **THEN** el sistema elimina la transacción de propina anterior (balance revertido) y no crea una nueva

### Requirement: Métricas que incluyen la propina

El sistema SHALL incluir las propinas en el ingreso del turno: `grossEarnings` SHALL sumar propinas al bruto (efectivo + tarjeta + qr + bonos + propinas) y `liquidEarnings` SHALL sumarlas al líquido (efectivo + qr + propinas − comisiones − gastos). El `pendingAmount` SHALL permanecer como tarjeta + bonos (la propina es efectivo ya recibido). Los analytics (`summary.grossEarnings`, `summary.liquidEarnings`, `byApp[].totalGross`) SHALL incluir propinas sin cambiar el shape de la respuesta de la API.

#### Scenario: Propina sube bruto y líquido
- **WHEN** un turno tiene efectivo 20 y propina 5, sin gastos ni comisiones
- **THEN** `grossEarnings` y `liquidEarnings` incluyen los 5 de propina y `pendingAmount` NO se ve afectado

#### Scenario: Analytics por app con propina
- **WHEN** se consulta `GET /api/driver/analytics`
- **THEN** `byApp` de la app incluye la propina en `totalGross` manteniendo los demás campos del shape