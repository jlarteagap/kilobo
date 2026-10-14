## Purpose

Acota el número de documentos que el sistema lee de la base de datos por petición, de modo que el coste de acceso a datos deje de crecer de forma indefinida con el historial de cada usuario.

## ADDED Requirements

### Requirement: El listado de transacciones devuelve una página acotada

El sistema SHALL devolver las transacciones del usuario en páginas acotadas, no el historial completo en una sola respuesta. Cada respuesta SHALL indicar si existe una página siguiente y el cursor necesario para obtenerla. El orden SHALL ser estable y el sistema SHALL exponer un tamaño de página máximo configurable con un valor por defecto acotado.

El total devuelto en cada página SHALL reflejar los mismos valores que devolvía la consulta sin acotar, de modo que ninguna cifra mostrada al usuario cambie por el hecho de paginar.

#### Scenario: Primera página de un historial largo
- **WHEN** un usuario con historial largo solicita la lista de transacciones
- **THEN** recibe como máximo una página de registros y un indicador de que existen más resultados

#### Scenario: Recorrido completo por páginas
- **WHEN** el consumidor sigue el cursor devuelto hasta el final
- **THEN** obtiene la totalidad de sus transacciones, sin omisiones ni duplicados entre páginas

#### Scenario: Usuario con pocos registros
- **WHEN** el historial del usuario cabe en una sola página
- **THEN** recibe todos sus registros y el indicador indica que no hay páginas siguientes

### Requirement: El filtrado por periodo se resuelve en la base de datos

Cuando el sistema necesiteTransactions dentro de un rango de fechas, SHALL aplicar el filtro como parte de la consulta y SHALL NOT traer el conjunto completo para descartar los ajenos al rango en memoria. El resultado SHALL ser idéntico al que produciría filtrar en memoria.

#### Scenario: Consulta de un periodo reciente
- **WHEN** se solicitan las transacciones de los últimos meses
- **THEN** el sistema devuelve solo las pertenecientes al rango y no lee los documentos fuera de él

#### Scenario: Rango con pocos resultados y mucho historial
- **WHEN** el rango solicitado cubre una ventana pequeña de un historial amplio
- **THEN** el número de documentos leídos es acorde al tamaño del rango, no al del historial

### Requirement: Las lecturas compuestas dispongan de índices que existen

Todo patrón de consulta que combine filtrado por más de un campo, o filtrado más ordenación, SHALL contar con el índice compuesto correspondiente declarado en la configuración de índices y disponible antes de que la consulta llegue a producción. El sistema SHALL exponer una comprobación que detecte patrones de consulta sin índice, de modo que la ausencia se detecte antes del despliegue y no en ejecución.

#### Scenario: Consulta sobre colección con filtro compuesto
- **WHEN** se ejecuta una consulta que combina filtrado por propietario y ordenación por fecha
- **THEN** se resuelve con el índice declarado, sin resorting a un escaneo completo de la colección

#### Scenario: Patrón de consulta sin índice
- **WHEN** la comprobación detecta un patrón de consulta compuesto sin índice declarado
- **THEN** lo señala como fallo antes del despliegue

### Requirement: Las operaciones por lotes no releen conjuntos completos de forma no acotada

Cuando una operación procese varios elementos de forma conjunta —registrar un turno, pagar varias cuotas, editar o borrar un turno— el sistema SHALL preparar el conjunto de datos que necesita UNA sola vez y reutilizarlo para todos los elementos, en lugar de releerlo por cada elemento. El número total de lecturas de esa preparación SHALL ser constante con respecto al número de elementos procesados.

#### Scenario: Registro de un turno con múltiples ingresos y propinas
- **WHEN** se registra un turno que genera muchas transacciones
- **THEN** el sistema prepara las cuentas una sola vez y confirma las escrituras en un conjunto acotado de lotes, en lugar de una lectura y un lote por transacción

#### Scenario: Pago de varias cuotas de un crédito
- **WHEN** se pagan varias cuotas de un mismo crédito en una sola operación
- **THEN** el sistema prepara los datos compartidos una única vez para todas las cuotas

#### Scenario: Reprocesado de un turno ya existente
- **WHEN** se edita un turno y se revierten y recrean sus transacciones
- **THEN** el número de lecturas no crece con el número de transacciones afectadas

### Requirement: Las lecturas auxiliares descartan lo que la base de datos puede descartar

Cuando el sistema necesite filtrar, ordenar o agregar un conjunto de registros, SHALL delegar en la base de datos siempre que la operación esté soportada por un índice o una consulta de agregación disponible. El filtrado en memoria SHALL quedar restringido a lo que la base de datos no puede expresar.

#### Scenario: Exclusión de registros no migrados
- **WHEN** el sistema lista categorías y debe excluir un subconjunto marcado como migrado
- **THEN** la exclusión se resuelve en la base de datos en lugar de descartar documentos ya leídos

#### Scenario: Búsqueda de una inversión por nombre
- **WHEN** el sistema busca una inversión por nombre dentro de una cuenta
- **THEN** la búsqueda no requiere leer el conjunto completo de inversiones de esa cuenta

#### Scenario: Agregación de totales
- **WHEN** el sistema necesita un total o un conteo
- **THEN** lo obtiene mediante una consulta de agregación en lugar de leer los documentos y sumarlos en memoria