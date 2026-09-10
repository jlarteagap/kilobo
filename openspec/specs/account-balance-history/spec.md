# account-balance-history Specification

## Purpose

Registra de forma persistente cada cambio sobre el balance de una cuenta (valor anterior, valor
nuevo, delta y origen) y muestra la variación diaria del balance (vs el cierre de ayer) como un
badge en la tarjeta de la cuenta.

## Requirements

### Requirement: Registrar un cambio de balance

El sistema SHALL registrar un cambio cada vez que el balance de una cuenta se modifica, por
cualquier origen: creación o edición manual de la cuenta, creación o eliminación de una transacción
(ingreso, egreso, transferencia o ahorro), operaciones de inversión (crear, comprar, vender, editar,
eliminar) y operaciones de deuda (crear, pagar, cancelar). Cada registro SHALL guardar el id de la
cuenta, el balance anterior, el balance nuevo, el delta (balance nuevo menos anterior), el origen
del cambio y la fecha. El registro del último cambio SHALL reflejar siempre el valor previo que
tenía la cuenta.

#### Scenario: Registrar un ingreso
- **WHEN** se crea una transacción de ingreso que incrementa el balance de 120 a 128 en una cuenta
- **THEN** el sistema persiste un registro de cambio con balance anterior 120, balance nuevo 128,
  delta +8 y origen transacción

#### Scenario: Registrar una edición manual
- **WHEN** el usuario edita manualmente el balance de una cuenta de 100 a 90
- **THEN** el sistema persiste un registro de cambio con delta -10 y origen edición manual

#### Scenario: Eliminar una transacción revierte el cambio
- **WHEN** se elimina la transacción que incrementó el balance de 120 a 128
- **THEN** el sistema persiste un nuevo registro de cambio con balance anterior 128 y balance nuevo
  120, reflejando la reversión

### Requirement: Mostrar la variación diaria del balance en la tarjeta de cuenta

El sistema SHALL mostrar, en cada `AccountCard`, el delta neto del balance desde el inicio del
periodo diario actual, comparado contra el balance al inicio de ese periodo (el cierre del día
anterior). El límite del día SHALL ser las **4:00 AM** en hora local: los cambios registrados después
de la medianoche pero antes de las 4:00 pertenecen al día que cierra y no se incluyen en la variación
del día que inicia. El badge SHALL indicar la dirección (subió/bajó), el delta con signo y formato
numérico compacto, la etiqueta "Hoy" y los colores del diseño "Minimal · Zinc": acento emerald
`#059669` para subidas y zinc `#27272A` para bajadas.

El sistema SHALL mostrar un estado neutro para cuentas en las que el delta del periodo sea cero
(sin movimientos): en lugar de mostrar "+0" o "0", SHALL mostrar un pill de aviso "Sin cambios"
junto al tiempo relativo desde el último cambio registrado. Cuando la cuenta no tenga ningún registro
previo al inicio del periodo (no existe ancla de comparación), el badge SHALL ocultarse y la tarjeta
no presenta ruido visual.

#### Scenario: Variación neta positiva del día
- **WHEN** el usuario realiza varias transacciones que en conjunto incrementan el balance de 120 a 128
  frente al cierre de ayer
- **THEN** el badge muestra "+8" con acento emerald y la etiqueta "Hoy" (variación acumulada, no el
  último cambio puntual)

#### Scenario: Variación neta negativa
- **WHEN** el balance actual es 10 Bs menor al cierre de ayer
- **THEN** el badge muestra "-10" con color zinc y la etiqueta "Hoy"

#### Scenario: Múltiples transacciones el mismo día
- **WHEN** se realizan varias transacciones durante el periodo diario
- **THEN** el badge muestra la variación **neta** acumulada del periodo (no salta con cada transacción
  individual)

#### Scenario: Actividad después de la medianoche
- **WHEN** se registra un cambio a las 2:00 AM (después de la medianoche, antes de las 4:00)
- **THEN** el cambio pertenece al día que cierra: el ancla del nuevo periodo (4:00 AM) ya incluye ese
  cambio y la variación del día actual parte de él

#### Scenario: Cuenta sin movimientos en el periodo
- **WHEN** el delta del periodo es 0 (la cuenta no recibe transacciones por días o meses)
- **THEN** el badge no muestra ningún signo numérico ("+0"/"0"); SHALL mostrar el pill de aviso
  "Sin cambios · hace N meses" con la referencia temporal al último cambio

#### Scenario: Cuenta sin historial previo al inicio del periodo
- **WHEN** la cuenta no tiene ningún registro de cambio anterior al inicio del periodo actual
- **THEN** el badge no se muestra y la tarjeta no presenta ruido visual

### Requirement: Persistencia y orden del historial

El sistema SHALL conservar el historial completo de cambios por cuenta, ordenado por fecha, de modo
que el cambio más reciente anterior al inicio del periodo diario sea la ancla de la comparación. La
colección de cambios SHALL estar aislada por usuario.

#### Scenario: Orden por fecha
- **WHEN** existen varios cambios para una misma cuenta
- **THEN** el sistema identifica como ancla el cambio de fecha más reciente anterior al inicio del
  periodo diario (4:00 AM local)