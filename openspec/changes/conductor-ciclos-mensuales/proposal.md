## Why

La pagina `/conductor` hoy carga los ultimos 50 turnos sin filtro temporal (`driver.repository.findAll` con `limit 50` y `orderBy date desc`) y sin paginacion por periodo. Con uso prolongado el historial crece, sobrecarga lectura en Firestore y UI, y no permite analizar rentabilidad por mes. Se necesita una vista por ciclos mensuales, con API filtrada por mes y reuso del pipeline de analytics ya existente.

## What Changes

- **Vista por ciclos:** La lista de registros en `/conductor` se muestra agrupada por ciclo mensual (por defecto mes en curso), con selector de mes/anio y navegacion anterior/siguiente.
- **API filtrada por mes:** `GET /api/driver/shifts` acepta `?year=YYYY&month=MM` (opcional, default mes actual) y delega a `driverRepository.findByMonth` / `driverService.getShiftsByMonth`. Mantiene compatibilidad: sin query params retorna mes actual en vez de 50 ultimos sin filtro.
- **Repositorio con query por rango:** Nuevo `findByMonth(userId, year, month)` y `findByDateRange` que usa `where date >= YYYY-MM-01` y `where date < YYYY-MM+1-01` + `orderBy date desc` con indice compuesto (`user_id`, `date`).
- **Analytics mensual reutilizado:** `GET /api/driver/analytics` acepta `?year&month` opcional y `driverService.getAnalytics(userId, {year, month})` filtra shifts del ciclo antes de calcular `summary`, `byApp`, `dailyTrend`. Sin params mantiene comportamiento actual (global). El hook `useDriverAnalytics({year, month})` y `useShifts({year, month})` propagan el filtro.
- **UI por ciclo:** `ShiftHistory` y `DashboardSummary` consumen el mes seleccionado; header de `/conductor` incluye `MonthCyclePicker`. Estado vacio por mes explica que no hay turnos en ese ciclo.
- **Performance:** Evita sobrecarga de info al limitar lecturas a un mes; reduce payload y costo Firestore. No cambia escritura de turnos ni transacciones.

## Capabilities

### New Capabilities
- `driver/monthly-cycles`: Listado de turnos por ciclo mensual con selector de periodo, lectura filtrada por mes en API/repositorio/servicio, y analytics mensual derivado del mismo filtro. Cubre UI, hooks, validacion de params y estados por ciclo.

### Modified Capabilities
- (ninguna existente a modificar; `investments/recurring-buys` no se toca)

## Impact

- **APIs:** `src/app/api/driver/shifts/route.ts` y `src/app/api/driver/analytics/route.ts` — nuevo query param opcional; respuesta shape sin cambios.
- **Servicio/Repositorio:** `src/services/driver.service.ts`, `src/repositories/driver.repository.ts` — nuevos metodos filtrados + indice Firestore `firestore.indexes.json`.
- **Validacion:** `src/lib/validations/driver.schema.ts` — schema `monthQuerySchema`.
- **Hooks/UI:** `src/features/driver/hooks/useDriverShifts.ts`, `useDriverAnalytics.ts`, `src/features/driver/components/ShiftHistory.tsx`, `DashboardSummary.tsx`, `ShiftAnalytics.tsx`, `src/app/conductor/page.tsx` — selector mensual y consumo de ciclo.
- **Compatibilidad:** Sin query params el comportamiento cambia de "ultimos 50 globales" a "mes actual"; documentado como mejora intencional, no **BREAKING** para cliente nuevo.
