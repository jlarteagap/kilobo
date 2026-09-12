## Purpose

Permite registrar los depósitos que las apps de transporte acreditan al conductor (pagos con tarjeta + bonos que llegan al banco), con la comisión que la app descuenta, para conocer la ganancia neta de cada depósito y reconciliarla con lo pendiente registrado en los turnos.

## ADDED Requirements

### Requirement: Entidad depósito de app

El sistema SHALL modelar un `DriverDeposit` con: `id`, `user_id`, `app` (UBER | YANGO | INDRIVE), `date` (YYYY-MM-DD), `grossAmount` (monto bruto depositado), `commission` (comisión cobrada por la app sobre bonos/tarjetas), `netAmount` (bruto − comisión), `notes` opcional y `createdAt`/`updatedAt`. El insumo de entrada `DepositInput` SHALL contener app, date, grossAmount, commission, netAmount calculado y notes, sin id ni timestamps. Los datos SHALL persistir en la colección Firestore `driver_deposits` con `serverTimestamp` y un índice compuesto `(user_id, date ASC/DESC)` declarado en `firestore.indexes.json`.

#### Scenario: Depósito correctamente normalizado
- **WHEN** se lee un depósito guardado con app, bruto y comisión
- **THEN** el sistema lo devuelve con `netAmount = grossAmount − commission` y timestamps presentes

#### Scenario: Montos inválidos rechazados
- **WHEN** se intenta guardar un depósito con `grossAmount` negativo o `commission` negativa
- **THEN** la validación falla y la API responde 400

### Requirement: CRUD de depósitos vía API

El sistema SHALL exponer `POST /api/driver/deposits` (creación), `GET /api/driver/deposits` (listado propio, ordenado por `date` descendente, con `limit` opcional), `PATCH /api/driver/deposits/[id]` (actualización) y `DELETE /api/driver/deposits/[id]` (eliminación). Todas las rutas SHALL requerir sesión válida (`getUserId()`, 401 si no) y validar el cuerpo con un `depositSchema` Zod. Las operaciones de un solo depósito SHALL operar solo sobre registros del usuario autenticado (404 si no existe o no le pertenece). Las respuestas SHALL usar `{ data }`.

#### Scenario: Crear depósito autorizado
- **WHEN** un usuario autenticado hace `POST /api/driver/deposits` con un cuerpo válido
- **THEN** el sistema crea el depósito y responde `{ data }` con su id

#### Scenario: Sesión ausente
- **WHEN** se llama cualquier ruta de depósitos sin sesión válida
- **THEN** el sistema responde 401

#### Scenario: Actualizar o eliminar depósito ajeno
- **WHEN** un usuario hace `PATCH` o `DELETE` sobre un depósito de otro usuario
- **THEN** el sistema responde 404

### Requirement: Ganancia neta y reconciliación por app

El sistema SHALL calcular y mostrar, para cada depósito, la ganancia neta (`netAmount = grossAmount − commission`). Además SHALL reconciliar por app el total depositado (suma de `grossAmount` de los depósitos) contra lo pendiente registrado en turnos (suma de tarjeta + bonos de los turnos del mismo app), presentando ambos montos y su diferencia. Esta diferencia explica que algunas apps descuentan comisión de bonos y pagos con tarjeta. El sistema SHALL recalcular la reconciliación al crear, actualizar o eliminar depósitos y al cambiar turnos. En este cambio los depósitos NO SHALL alterar balances de cuentas (registro y comparación solamente).

#### Scenario: Comparar depositado vs pendiente registrado
- **WHEN** el usuario registra un depósito UBER de bruto 90 (comisión 2) y sus turnos UBER suman 95 de pendiente (tarjeta + bonos)
- **THEN** la UI muestra ganancia neta 88, depositado 90, pendiente registrado 95 y diferencia −5

#### Scenario: Reconciliación tras eliminar depósito
- **WHEN** el usuario elimina un depósito antes listado
- **THEN** la reconciliación por app se actualiza quitando su monto del total depositado

### Requirement: UI de depósitos en /conductor

La página `/conductor` SHALL mostrar una sección "Depósitos de apps" con la lista de depósitos del ciclo (app con color/label, fecha, bruto, comisión, neto) y un botón "Registrar depósito" que abre un formulario (app, fecha, monto bruto, comisión, notas y neto calculado en vivo). Cada depósito SHALL permitir editar y eliminar. La sección SHALL mostrar la reconciliación por app (depositado vs pendiente registrado y su diferencia) y estados de carga, vacío y error. Los hooks SHALL usar `queryKey ['driver','deposits']` dentro del namespace `driver` para que las invalidaciones existentes del driver sigan funcionando.

#### Scenario: Registrar depósito desde la UI
- **WHEN** el usuario llena el formulario con app YANGO, bruto 120 y comisión 4
- **THEN** la lista muestra el depósito con neto 116 y la reconciliación de YANGO se actualiza

#### Scenario: Ciclo sin depósitos
- **WHEN** el usuario no tiene depósitos en el rango consultado
- **THEN** la sección muestra un estado vacío con CTA a "Registrar depósito"
