## Purpose

Establece quién puede leer y mutar datos en las superficies públicas de la aplicación (`/gasolina` y `/car-sharing`) y limita la tasa de operaciones costosas para que no puedan usarse como medidor de consumo ajeno.

## ADDED Requirements

### Requirement: Las superficies autenticadas exigen sesión válida para mutar

Toda acción que modifique datos persistidos en el interior de la aplicación SHALL requerir una sesión autenticada válida. Si no hay sesión válida, el sistema SHALL rechazar la operación con estado 401 y SHALL NOT efectuar ninguna escritura. El rechazo SHALL ocurrir antes de cualquier lectura o escritura costosa, no después.

Esta regla aplica a las superficies bajo sesión —cuentas, transacciones, presupuestos, deudas, créditos, inversiones, turnos de conductor y demás. Las superficies públicas de compartir auto se rigen por su propio requisito, que reparte el control por consecuencia de la operación.

#### Scenario: Petición sin sesión intenta crear un recurso autenticado
- **WHEN** una petición sin sesión cookie válida intenta crear, por ejemplo, una transacción o un presupuesto
- **THEN** el sistema responde 401 y no persiste ningún cambio

#### Scenario: Usuario autenticado opera con normalidad
- **WHEN** un usuario con sesión cookie válida invoca una acción mutante
- **THEN** la operación se ejecuta y el cambio queda persistido

#### Scenario: Sesión expirada
- **WHEN** la cookie de sesión del usuario está expirada o revocada
- **THEN** el sistema responde 401 y no persiste ningún cambio

### Requirement: La escritura al estado compartido se acota por tasa y reserva lo irreversible a la sesión

El estado de ciclos de compartir auto y de mantenimiento es compartido por varias personas que aportan al mismo vehículo y no pertenece a un usuario individual. Por eso el control de escritura SHALL basarse en la consecuencia de cada operación y SHALL NOT en una credencial que haya que emitir, distribuir ni rotar.

Las Server Actions mutantes de esta superficie pública SHALL quedar sujetas a un límite de frecuencia por identidad de cliente. Toda operación cuyo efecto sea irreversible sobre el estado compartido, o que alcance una transacción financiera de un usuario, SHALL exigir además una sesión autenticada válida.

Las operaciones de registro y consulta de uso diario SHALL permanecer disponibles sin credenciales: el caso de uso es anotar desde el vehículo sin iniciar sesión. La lectura SHALL permanecer pública en su totalidad.

#### Scenario: Visitante sin sesión registra un viaje
- **WHEN** un visitante sin sesión invoca la acción de añadir viaje y opera dentro del límite de tasa
- **THEN** la operación se ejecuta y el viaje queda persistido en el estado compartido

#### Scenario: Visitante sin sesión intenta una operación irreversible
- **WHEN** un visitante sin sesión válida invoca borrar viaje, borrar ciclo, borrar historial o borrar mantenimiento
- **THEN** el sistema rechaza la operación, y lo hace antes de cualquier lectura o escritura

#### Scenario: Visitante sin sesión borra historial completo
- **WHEN** un visitante sin sesión válida invoca la acción de resetear todo el historial
- **THEN** el sistema rechaza la operación y ningún ciclo se elimina

#### Scenario: Exceso de escrituras desde una misma identidad
- **WHEN** una misma identidad de cliente supera el límite de escrituras en su ventana de tiempo
- **THEN** el sistema rechaza antes de escribir y el estado compartido no se modifica

#### Scenario: La lectura sigue siendo accesible sin credenciales
- **WHEN** cualquier visitante abre la página pública sin sesión
- **THEN** puede consultar el ciclo activo, los ciclos cerrados y el historial de mantenimiento sin autenticarse

**Riesgo aceptado y declarado:** el nombre de participante de un viaje y de una carga se recibe del cliente y no se contrasta contra una identidad, de modo que un visitante puede atribuir un movimiento a cualquiera de los participantes. El límite de tasa acota el volumen de esa posibilidad; no resuelve la atribución. El diseño acepta esto de forma explícita porque cerrarlo exigiría credenciales en el registro, que es el uso que la superficie pública debe sostener.

### Requirement: Límite de tasa en endpoints públicos y costosos

El sistema SHALL aplicar un límite de frecuencia a toda operación susceptible de consumos de terceros o de lectura/escritura no acotada. Al superar el límite, el sistema SHALL responder 429 e incluir la cabecera `Retry-After` indicando los segundos restantes. El límite SHALL evaluarse por identidad de cliente y, cuando exista sesión, por usuario.

Los límites SHALL aplicarse como mínimo a: la creación de sesión, el recálculo forzado de insights, y todas las operaciones mutantes de las superficies públicas.

#### Scenario: Exceso de peticiones a creación de sesión
- **WHEN** una misma identidad de cliente supera el límite permitido de creaciones de sesión en la ventana de tiempo
- **THEN** el sistema responde 429 con `Retry-After` y no emite una nueva cookie de sesión

#### Scenario: Exceso de recálculo de insights
- **WHEN** un usuario supera el límite de recálculos forzados de insights
- **THEN** el sistema responde 429 y no invalida la caché ni recalcula

#### Scenario: Peticiones dentro del límite
- **WHEN** un cliente opera por debajo del umbral configurado
- **THEN** la operación se atiende normalmente sin penalización

### Requirement: El límite de tasa sobrevive a reinicios y despliegues

El control de límite de tasa SHALL NOT depender exclusivamente de memoria del proceso de aplicación. En un entorno de ejecución que crea una instancia por petición, el sistema SHALL usar un almacén compartido y persistente para conservar los contadores entre peticiones.

#### Scenario: Peticiones consecutivas desde instancias distintas
- **WHEN** dos peticiones consecutivas de un mismo cliente son atendidas por instancias de aplicación distintas
- **THEN** el contador acumulado es compartido y el límite se aplica de forma acumulativa

### Requirement: Verificación de origen en operaciones mutantes

Toda ruta que modifique estado SHALL validar que la petición provenga del propio origen de la aplicación antes de ejecutar el cambio, con independencia de las cabeceras de control de cookies.

#### Scenario: Petición desde un origen ajeno
- **WHEN** una operación mutante llega con un origen distinto al de la aplicación
- **THEN** el sistema la rechaza sin aplicar el cambio