# driver/tips Delta

## MODIFIED Requirements

### Requirement: Campo de propinas por app en el turno

El sistema SHALL aceptar propinas por cada app (UBER, YANGO, INDRIVE) desglosadas por método de pago (efectivo o QR) al crear y editar un turno. `ShiftInput` SHALL incluir `tips: Record<DriverApp, { CASH: number; QR: number }>` y `DriverShift` SHALL persistir `tips` (valor por defecto `{ CASH: 0, QR: 0 }` por app en datos antiguos sin el campo). El formulario `ShiftForm` SHALL exponer dos inputs "Propinas" por app — Efectivo y QR — (numéricos, >= 0, moneda Bs) junto a los existentes de Bonos/Comisión, editables al crear y editar. El detalle e historial del turno SHALL mostrar el desglose de propinas por método además del total.

#### Scenario: Registrar propina al crear turno
- **WHEN** el conductor completa el turno con propinas en efectivo, `tips.UBER.CASH = 5`, y UBER efectivo `= 20`
- **THEN** el turno se guarda con `tips.UBER = { CASH: 5, QR: 0 }` y el formulario muestra el desglose incluyendo la propina

#### Scenario: Registrar propina por QR
- **WHEN** el conductor completa el turno con `tips.UBER = { CASH: 0, QR: 12 }`
- **THEN** el turno se guarda con el desglose `{ CASH: 0, QR: 12 }` y la propina queda distinguida como QR

#### Scenario: Editar propina de un turno existente
- **WHEN** el conductor edita un turno guardado y cambia `tips.YANGO.QR` de 0 a 3
- **THEN** el sistema reprocesa el turno con la propina actualizada y revierte/recrea las transacciones de propina anteriores

#### Scenario: Turnos antiguos sin campo tips
- **WHEN** se lee un turno creado antes de este cambio (sin `tips`) o con `tips` numérico (p.ej. `{ UBER: 5 }`)
- **THEN** el sistema trata las propinas como `{ UBER: { CASH: 5, QR: 0 }, YANGO: { CASH: 0, QR: 0 }, INDRIVE: { CASH: 0, QR: 0 } }` sin errores

### Requirement: Propina como ingreso con transacción según método

Al cerrar o editar un turno, por cada app y método con monto `> 0` el servicio SHALL crear una transacción `INCOME`: las propinas en efectivo hacia la cuenta de efectivo del conductor (`config.incomeCashAccountId`) con descripción "`APP` propina", y las propinas en QR hacia la cuenta QR del conductor (`config.incomeQrAccountId`) con descripción "`APP` propina QR". Ambas SHALL usar el subtipo del app (`config.subtypeMapping.uber/yango/indrive`) y la fecha del turno. Cada transacción SHALL registrarse en `generatedTransactionIds` para revertirse automáticamente al editar o eliminar el turno.

#### Scenario: Propina positiva genera transacción
- **WHEN** se guarda un turno con `tips.INDRIVE = { CASH: 8, QR: 0 }`
- **THEN** se crea una transacción INCOME de 8 en `incomeCashAccountId` y su id queda en `generatedTransactionIds`

#### Scenario: Propina en QR genera transacción a la cuenta QR
- **WHEN** se guarda un turno con `tips.UBER = { CASH: 0, QR: 12 }`
- **THEN** se crea una transacción INCOME de 12 en `incomeQrAccountId` y su id queda en `generatedTransactionIds`

#### Scenario: Editar turno revierte la propina previa
- **WHEN** se edita un turno que tenía propinas y ahora quedan en 0
- **THEN** el sistema elimina las transacciones de propina anteriores (balances revertidos) y no crea nuevas