## Purpose

Permite al conductor visualizar y analizar sus turnos por ciclos mensuales, filtrando lecturas y metricas por mes para evitar sobrecarga y facilitar comparacion de rentabilidad entre periodos.

## ADDED Requirements

### Requirement: Listar turnos filtrados por ciclo mensual

El sistema SHALL exponer la lista de turnos filtrada por ciclo mensual. `GET /api/driver/shifts` SHALL aceptar query params opcionales `year` (YYYY, 1900-2100) y `month` (1-12). Cuando se proveen, SHALL retornar solo turnos cuyo `date` cae en ese mes calendario (inclusive desde `YYYY-MM-01` hasta `< YYYY-MM_next-01`). Cuando no se proveen, SHALL default al mes en curso en zona horaria del servidor (comportamiento post-cambio: antes retornaba ultimos 50 globales). SHALL ordenar por `date` descendente. El hook `useShifts({year, month})` SHALL construir la query string y usar `queryKey` que incluye el ciclo para cache separado.

#### Scenario: Listar mes solicitado
- **WHEN** el cliente hace `GET /api/driver/shifts?year=2026&month=3`
- **THEN** el sistema retorna solo turnos con `date` entre `2026-03-01` y `2026-03-31` ordenados por `date` descendente

#### Scenario: Default a mes actual sin params
- **WHEN** el cliente hace `GET /api/driver/shifts` sin query
- **THEN** el sistema retorna turnos del mes en curso

#### Scenario: Params invalidos
- **WHEN** `year` o `month` estan fuera de rango o no son enteros
- **THEN** el sistema responde 400 con `error: Datos invalidos`

### Requirement: Selector de ciclo mensual en la UI

La pagina `/conductor` SHALL mostrar un selector de ciclo mensual (mes/anio) por encima de la lista. SHALL default al mes actual al cargar. SHALL permitir navegar a mes anterior/siguiente y seleccionar mes/anio via picker. Al cambiar de ciclo, SHALL refetch shifts y analytics del ciclo. SHALL mostrar estado vacio especifico por ciclo ("No hay turnos en marzo 2026") con CTA a registrar. `DashboardSummary` y `ShiftHistory` SHALL consumir el mismo ciclo seleccionado.

#### Scenario: Navegar entre meses
- **WHEN** el usuario esta en marzo 2026 y toca "mes anterior"
- **THEN** la UI cambia a febrero 2026, recarga lista y cabecera muestra "Febrero 2026"

#### Scenario: Ciclo sin turnos
- **WHEN** el ciclo seleccionado no tiene turnos
- **THEN** la UI muestra estado vacio con mensaje del mes y CTA "Registrar turno"

### Requirement: Analytics reutilizado por ciclo mensual

El sistema SHALL reutilizar el pipeline existente de analytics filtrado por ciclo. `GET /api/driver/analytics` SHALL aceptar `year` y `month` opcionales; cuando se proveen SHALL calcular `summary`, `byApp` y `dailyTrend` solo sobre turnos del mes. Cuando no se proveen SHALL mantener calculo global actual. `useDriverAnalytics({year, month})` SHALL propagar el filtro y su `queryKey` SHALL incluir el ciclo. La pagina `/conductor/analytics` (si se navega con ciclo) o el `ShiftAnalytics` embebido SHALL reflejar metricas del ciclo; `dailyTrend` SHALL contener hasta 31 entradas del mes ordenadas por fecha.

#### Scenario: Analytics de mes especifico
- **WHEN** el cliente hace `GET /api/driver/analytics?year=2026&month=3`
- **THEN** el sistema retorna `summary.shiftCount` y `byApp` calculados solo sobre turnos de marzo 2026

#### Scenario: Analytics global sin params (compatibilidad)
- **WHEN** el cliente hace `GET /api/driver/analytics` sin query
- **THEN** el sistema retorna analytics sobre todos los turnos

### Requirement: Persistencia filtrada por rango de fecha con indice

El repositorio SHALL proveer `findByMonth(userId, year, month)` y `findByDateRange(userId, fromIncl, toExcl)` usando `where('user_id','==', userId).where('date','>=', fromIncl).where('date','<', toExcl).orderBy('date','desc')`. El sistema SHALL declarar indice compuesto Firestore sobre `driver_shifts` (`user_id` ASC, `date` DESC) en `firestore.indexes.json`. SHALL limitar por seguridad a max 200 docs por mes si se detecta abuso (no pagination inicial).

#### Scenario: Query por rango usa indice
- **WHEN** se consulta marzo 2026 para un usuario
- **THEN** Firestore resuelve con indice `user_id + date` sin error de indice faltante

### Requirement: Validacion y compatibilidad de ciclo

El sistema SHALL validar `year` y `month` con Zod (`monthQuerySchema`: `year` integer 1900-2100, `month` integer 1-12, coerce desde string de query). SHALL retornar 401 si no hay `userId`. SHALL preservar shape de respuesta `{ data: DriverShift[] }` y `{ data: DriverAnalytics }` para no romper clientes existentes. No SHALL requerir migracion de datos (campo `date` YYYY-MM-DD ya existe).

#### Scenario: Falta de autenticacion
- **WHEN** no hay sesion valida y se pide `/api/driver/shifts?year=2026&month=3`
- **THEN** el sistema responde 401

