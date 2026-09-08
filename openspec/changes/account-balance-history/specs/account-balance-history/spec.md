## Purpose

Registra de forma persistente cada cambio sobre el balance de una cuenta (valor anterior, valor
nuevo, delta y origen) y muestra el cambio más reciente como un badge en la tarjeta de la cuenta.

## ADDED Requirements

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

### Requirement: Mostrar el último cambio en la tarjeta de cuenta

El sistema SHALL mostrar, en cada `AccountCard`, el cambio de balance más reciente de esa cuenta como
un badge que indique la dirección (subió/bajó), el delta con signo y formato de moneda, y una
referencia temporal relativa legible ("ahora", "hace 5 min", "hace 2 h", "ayer", "hace N días"). El
badge SHALL usar los colores y formas del diseño "Minimal · Zinc": acento emerald `#059669` para
subidas y zinc `#27272A` para bajadas.

#### Scenario: Cambio reciente positivo
- **WHEN** el último cambio de la cuenta fue un incremento de 8 Bs ocurrido ayer
- **THEN** el badge muestra "+8" con acento emerald y la referencia relativa "ayer"

#### Scenario: Cambio reciente negativo
- **WHEN** el último cambio de la cuenta fue una baja de 10 Bs ocurrida hace 2 horas
- **THEN** el badge muestra "-10" con color zinc y la referencia relativa "hace 2 h"

#### Scenario: Cuenta sin registros de cambio
- **WHEN** la cuenta no tiene ningún registro de cambio de balance
- **THEN** el badge no se muestra y la tarjeta no presenta ruido visual

### Requirement: Persistencia y orden del historial

El sistema SHALL conservar el historial completo de cambios por cuenta, ordenado por fecha, de modo
que el cambio más reciente sea el que se muestra. La colección de cambios SHALL estar aislada por
usuario.

#### Scenario: Orden por fecha
- **WHEN** existen varios cambios para una misma cuenta
- **THEN** el sistema identifica como último cambio el de fecha más reciente
