## Purpose

Mueve al servidor el cálculo de las métricas agregadas del dashboard, de modo que el navegador reciba cifras ya calculadas en lugar de recibir el historial crudo para reducirlo allí.

## ADDED Requirements

### Requirement: Las métricas del dashboard se sirven ya agregadas

El sistema SHALL exponer una vía de consulta que devuelva las métricas agregadas de la cuenta del usuario —ingresos, gastos, balance neto y sus comparativas, desglose por categoría y series temporales— calculadas en el servidor. El navegador SHALL NOT recibir el historial completo de transacciones para performar ese cálculo.

Los valores devueltos SHALL ser equivalentes a los que el cálculo en navegador producía. Ninguna cifra mostrada al usuario SHALL cambiar como consecuencia de dónde se calcule.

#### Scenario: Carga del dashboard con historial extenso
- **WHEN** un usuario con historial extenso carga su dashboard
- **THEN** recibe las métricas agregadas ya calculadas, sin que su historial completo de transacciones haya viajado al navegador

#### Scenario: Equivalencia de cifras
- **WHEN** se calculan las métricas en el servidor y se comparan con las que el navegador obtenía por su cuenta
- **THEN** coinciden en ingresos, gastos, balance neto y series temporales

#### Scenario: Aislamiento entre usuarios
- **WHEN** un usuario consulta sus métricas
- **THEN** el resultado contiene exclusivamente datos de su propia cuenta

### Requirement: El desglose por categoría del flujo de caja se calcula en el servidor

El grafo de flujo de caja que visualiza la procedencia y el destino del dinero entre cuentas, proyectos y categorías SHALL construirse en el servidor a partir de los datos agregados. El navegador SHALL NOT construir ese grafo recorriendo el conjunto completo de transacciones.

#### Scenario: Render del flujo de caja
- **WHEN** el dashboard muestra el diagrama de flujo de caja
- **THEN** el grafo llega ya construido desde el servidor

#### Scenario: Cero transacciones en el periodo
- **WHEN** el usuario no tiene transacciones en el periodo solicitado
- **THEN** el sistema devuelve un grafo vacío sin error, en lugar de una estructura con nodos nulos

### Requirement: El progreso de presupuestos se calcula en el servidor

El importe gastado de cada presupuesto activo dentro del periodo SHALL calcularse en el servidor. El navegador SHALL NOT recibir el historial completo para derivar ese importe, y el cálculo SHALL escalar con el número de presupuestos activos y no con el producto de presupuestos por transacciones.

#### Scenario: Varios presupuestos activos
- **WHEN** el usuario tiene varios presupuestos activos y un historial amplio
- **THEN** el importe gastado de cada uno llega calculado, sin recorrer el historial en el navegador

#### Scenario: Presupuesto sin gasto en el periodo
- **WHEN** un presupuesto activo no registra gasto en el periodo
- **THEN** su progreso se informa en cero, sin error ni valor indefinido

#### Scenario: Presupuesto inactivo
- **WHEN** existe un presupuesto marcado como inactivo
- **THEN** no aparece en el progreso del periodo

### Requirement: El dashboard se alimenta de un número acotado de consultas

La carga del dashboard SHALL resolverse con un conjunto acotado de peticiones al servidor, cuyo número no crezca con el tamaño del historial del usuario. El sistema SHALL evitar el patrón en que un panel dispara una petición por cada elemento de una lista.

#### Scenario: Muchos elementos a los que consultar
- **WHEN** el dashboard muestra paneles que dependen de un conjunto de elementos —por ejemplo, las variaciones de balance de cada cuenta—
- **THEN** esos datos se obtienen en una sola consulta agregada y no en una petición por elemento

#### Scenario: Número de peticiones estable
- **WHEN** se compara el número de peticiones del dashboard entre un usuario con poco historial y otro con mucho
- **THEN** el número es el mismo

### Requirement: Las métricas se sirven desde una caché

Las métricas agregadas y los grafos derivados de ellas SHALL servirse desde una caché con vencimiento, de modo que consultas repetidas en una ventana corta no vuelvan a recorrer los datos. La invalidación SHALL dispararse cuando cambien los datos que la alimentan, para que el usuario no vea métricas desactualizadas tras registrar movimientos.

#### Scenario: Consultas repetidas dentro de la ventana
- **WHEN** el mismo usuario consulta sus métricas varias veces dentro de la ventana de caché
- **THEN** el sistema responde desde la caché sin volver a recorrer los datos

#### Scenario: Registro de un movimiento nuevo
- **WHEN** el usuario registra una transacción que altera las métricas del periodo
- **THEN** la caché se invalida y las métricas devueltas reflejan el cambio

#### Scenario: La caché expira
- **WHEN** la entrada de caché supera su ventana de vigencia
- **THEN** el sistema la recalcula y la almacena de nuevo