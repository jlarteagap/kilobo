## Purpose

Define el comportamiento observable de la página de transacciones: resumen del período con tendencia
comparativa correcta, desglose por proyecto, lista de movimientos y descarga CSV de la vista
filtrada para análisis fuera de la app.

## ADDED Requirements

### Requirement: Resumen del período con tendencia comparativa

El sistema SHALL mostrar, para el período seleccionado, las cards de Ingresos, Gastos y Balance
neto con sus montos en BOB. Cada card SHALL mostrar un porcentaje comparativo con el período
inmediatamente anterior, calculado sobre el conjunto completo de transacciones del período anterior
(no sobre la vista filtrada por filtros secundarios). El sistema SHALL tratar el caso de período
anterior sin datos: si el valor actual es positivo, SHALL mostrar 100%; si ambos son cero, SHALL
mostrar "sin cambio". La tendencia de Gastos SHALL invertirse (un aumento de gasto SHALL mostrarse
como variación negativa).

#### Scenario: Mes anterior con datos
- **WHEN** el período actual tiene ingresos de 400 Bs y el período anterior tuvo ingresos de 200 Bs
- **THEN** la card de Ingresos muestra "+100%" y la de Gastos su variación correspondiente (invertida)

#### Scenario: Sin datos en el período anterior
- **WHEN** el período actual tiene ingresos/gastos pero el período anterior está vacío
- **THEN** la card muestra "+100%" para valores positivos y la de Balance neto no muestra un 100%
  engañoso cuando su valor es negativo

#### Scenario: Sin cambios entre períodos
- **WHEN** el valor actual y el del período anterior son ambos cero
- **THEN** la card muestra "sin cambio" sin porcentaje

#### Scenario: Filtros secundarios activos
- **WHEN** el usuario filtra la lista por cuenta, categoría, etiqueta, tipo o proyecto
- **THEN** los totales y la tendencia de las cards de resumen se calculan sobre todo el período
  (ignorando los filtros secundarios) y no se distorsionan por la vista filtrada

### Requirement: Desglose de ingresos y gastos por proyecto

El sistema SHALL mostrar una card por cada proyecto (actividad) con transacciones en el período y
una card "Personal" cuando existan transacciones personales. Cada card SHALL mostrar el nombre del
proyecto, sus ingresos, sus gastos y su neto con signo. Los proyectos sin actividad en el período
SHALL NO mostrar card. El neto SHALL diferenciar visualmente positivo de negativo.

#### Scenario: Proyecto con actividad en el período
- **WHEN** un proyecto tiene transacciones de ingreso y gasto en el período
- **THEN** aparece su card con ingresos, gastos y neto con signo

#### Scenario: Solo transacciones personales
- **WHEN** solo existen transacciones sin proyecto asignado en el período
- **THEN** solo se muestra la card "Personal"

#### Scenario: Proyecto inactivo
- **WHEN** un proyecto no tiene ninguna transacción en el período
- **THEN** no se muestra ninguna card para ese proyecto

### Requirement: Lista de movimientos con totales

El sistema SHALL mostrar la lista de transacciones filtradas agrupadas por fecha (de más reciente a
más antigua), con agrupador de fecha, y por cada fila el tipo/etiqueta, tags, tipo, cuenta, monto
con signo y acciones de editar y eliminar. Al final de la lista SHALL mostrarse un pie con los
totales de Ingresos, Gastos y Neto del conjunto filtrado. El sistema SHALL mostrar un estado de
carga por fila y un estado vacío cuando no haya transacciones.

#### Scenario: Agrupación por fecha
- **WHEN** hay transacciones en fechas distintas dentro del período
- **THEN** la lista muestra separadores de fecha ordenados de más reciente a más antiguo

#### Scenario: Pie de totales
- **WHEN** hay transacciones filtradas
- **THEN** el pie muestra Ingresos, Gastos y Neto (con signo) del conjunto filtrado

#### Scenario: Lista vacía
- **WHEN** no hay transacciones que cumplan los filtros
- **THEN** la lista muestra un estado vacío con orientación para crear una transacción

### Requirement: Descarga CSV de la vista filtrada

El sistema SHALL ofrecer un control para descargar como CSV las transacciones que coinciden con la
vista actual (período y filtros secundarios activos). El CSV SHALL incluir una cabecera con las
columnas Fecha, Categoría, Etiqueta, Cuenta, Descripción, Tipo, Monto (BOB), Moneda y Proyecto; el
monto SHALL expresarse en BOB y la moneda original de la transacción SHALL indicarse en su columna.
El archivo SHALL codificarse en UTF-8 con BOM para que los caracteres en español se muestren
correctamente en Excel y Google Sheets, y SHALL llevar un nombre de archivo descriptivo con la
fecha de descarga. El control SHALL estar deshabilitado (o no ofrecer exportación) cuando no haya
transacciones que exportar.

#### Scenario: Exportar la vista filtrada
- **WHEN** el usuario pulsa "Exportar CSV" con filtros activos
- **THEN** se descarga un CSV con esas transacciones, montos en BOB y las columnas especificadas

#### Scenario: Exportación con caracteres en español
- **WHEN** las categorías o descripciones contienen tildes o "ñ"
- **THEN** el CSV abre correctamente en Excel/Sheets (encoding UTF-8 con BOM)

#### Scenario: Sin transacciones para exportar
- **WHEN** la vista filtrada está vacía
- **THEN** el control de exportación no descarga nada y se muestra deshabilitado