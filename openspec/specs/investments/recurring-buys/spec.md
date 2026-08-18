# investments/recurring-buys Specification

## Purpose
Permite programar compras recurrentes semanales por monto fijo para una inversión con posiciones, mostrar al usuario la agenda de próximas compras y confirmar cada compra cuando vence.

## Requirements

### Requirement: Configurar un plan de compra recurrente semanal

El sistema SHALL permitir crear un plan de compra recurrente semanal sobre una inversión que tenga posiciones (units). El plan SHALL definir: día de la semana (lunes a domingo), monto fijo por periodo (mayor a 0) y estado activo/inactivo. La cuenta y la moneda del plan SHALL ser las de la inversión. El sistema SHALL permitir desactivar, reactivar, editar y eliminar el plan. El sistema SHALL rechazar la creación de un segundo plan activo sobre la misma inversión mientras exista uno activo.

#### Scenario: Crear un plan válido
- **WHEN** el usuario configura un plan semanal con día viernes, monto 200 y lo guarda en una inversión con units
- **THEN** el sistema persiste el plan como activo y lo muestra en la ficha de la inversión

#### Scenario: Monto o día inválido
- **WHEN** el usuario guarda un plan con monto menor o igual a 0, o con un día de semana no reconocido
- **THEN** el sistema rechaza el plan con un mensaje de error y no persiste cambios

#### Scenario: Plan duplicado
- **WHEN** el usuario intenta crear un segundo plan activo para una inversión que ya tiene un plan activo
- **THEN** el sistema rechaza la operación con un mensaje indicando que ya existe un plan activo

#### Scenario: Eliminar un plan
- **WHEN** el usuario elimina el plan de una inversión
- **THEN** la inversión deja de mostrar plan y no genera compras pendientes

### Requirement: Calcular y mostrar la próxima compra

El sistema SHALL calcular la próxima fecha de compra como la siguiente ocurrencia del día configurado en el plan a partir del día actual. El sistema SHALL mostrar en la UI el estado del plan sobre cada inversión (badge activo/inactivo) y una sección "Próximas compras" que liste, por inversión con plan activo, la próxima fecha y el monto programado.

#### Scenario: Cálculo de próxima fecha
- **WHEN** hoy es miércoles 20 de agosto y el plan está configurado para el viernes
- **THEN** la próxima compra se agenda para el viernes 22 de agosto

#### Scenario: Fecha ya vencida en el mismo día
- **WHEN** hoy es viernes 22 de agosto y el plan está configurado para el viernes
- **THEN** la compra se considera pendiente y la próxima fecha mostrada corresponde al viernes siguiente (29 de agosto) tras confirmarse

#### Scenario: Plan inactivo no genera pendientes
- **WHEN** un plan está desactivado
- **THEN** la inversión no aparece en "Próximas compras" ni genera compras pendientes, aunque mantenga su configuración guardada

### Requirement: Confirmar y ejecutar una compra pendiente

El sistema SHALL marcar como pendiente la compra de un plan activo cuando la fecha actual alcanza o supera la próxima fecha programada. El sistema SHALL presentar la compra pendiente con el monto fijo, la cuenta y la moneda del plan pre-llenados. El usuario SHALL ingresar el precio por unidad al confirmar. El sistema SHALL calcular las unidades como monto dividido entre precio, validar que precio sea mayor a 0 y que la cuenta tenga saldo suficiente, y ejecutar la compra creando la transacción BUY, descontando el saldo de la cuenta y recalculando la posición (units y precio promedio). Tras ejecutarse, el sistema SHALL avanzar la próxima fecha del plan a la siguiente ocurrencia.

#### Scenario: Confirmar el pendiente con precio válido
- **WHEN** hay una compra pendiente de 200 Bs, el usuario ingresa precio 100 y confirma
- **THEN** el sistema registra la compra de 2 unidades, descuenta 200 del saldo de la cuenta, recalcula la posición y agrega la compra al historial

#### Scenario: Precio inválido
- **WHEN** el usuario confirma el pendiente con precio menor o igual a 0
- **THEN** el sistema rechaza la confirmación sin registrar nada

#### Scenario: Saldo insuficiente
- **WHEN** la cuenta no tiene saldo suficiente para el monto del pendiente
- **THEN** el sistema rechaza la ejecución, mantiene el pendiente activo y muestra un mensaje de error

### Requirement: Compra pendiente visible en la UI

El sistema SHALL hacer visibles los pendientes de forma destacada: los planes activos con compra pendiente SHALL mostrarse en una sección accesible de la página de inversiones con acción directa de confirmar, y la ficha de la inversión SHALL indicar la próxima compra o el pendiente con su monto y fecha.

#### Scenario: Pendiente con acción directa
- **WHEN** existe una compra pendiente
- **THEN** el usuario ve la entrada en la sección "Próximas compras" con el monto y la fecha, y puede abrir la confirmación con un solo clic

#### Scenario: Sin planes visibles
- **WHEN** no existe ningún plan recurrente
- **THEN** la sección "Próximas compras" muestra un estado vacío amigable sin ruido en la UI
