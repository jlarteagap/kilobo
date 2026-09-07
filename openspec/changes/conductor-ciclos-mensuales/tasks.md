## 1. Validacion y persistencia

- [x] 1.1 Agregar `monthQuerySchema` en `src/lib/validations/driver.schema.ts` (year 1900-2100, month 1-12, coerce, refine juntos).
- [x] 1.2 Extender `src/repositories/driver.repository.ts` con `findByMonth(userId, year, month)` y `findByDateRange(userId, fromIncl, toExcl)` usando `where date >= / <` + `orderBy date desc`; mantener `findAll` para compat si se necesita.
- [x] 1.3 Actualizar `firestore.indexes.json` con indice compuesto `driver_shifts: user_id ASC, date DESC`.

## 2. Servicio y APIs

- [x] 2.1 Extender `src/services/driver.service.ts` con `getShiftsByMonth` / `getShifts(userId, opts?)` y `getAnalytics(userId, opts?)` que filtra shifts del mes antes de agregar (reusar pipeline existente).
- [x] 2.2 Actualizar `src/app/api/driver/shifts/route.ts` GET para parsear `year/month` con Zod, default a mes actual si no vienen, 400 si invalido, 401 sin userId.
- [x] 2.3 Actualizar `src/app/api/driver/analytics/route.ts` GET igual que 2.2 y delegar a `driverService.getAnalytics` con filtro.

## 3. Hooks y estado de ciclo

- [x] 3.1 Actualizar `src/features/driver/hooks/useDriverShifts.ts`: `useShifts({year, month})` con `queryKey` que incluye ciclo y `queryFn` que arma `/api/driver/shifts?year=&month=`.
- [x] 3.2 Actualizar `src/features/driver/hooks/useDriverAnalytics.ts`: `useDriverAnalytics({year, month})` igual, staleTime 2m, queryKey con ciclo.
- [x] 3.3 Crear hook/util `useMonthCycle` o estado local en `src/app/conductor/page.tsx` que defaulta a mes actual, expone `year, month, setCycle, prev/next`.

## 4. UI por ciclos

- [x] 4.1 Crear `MonthCyclePicker` en `src/features/driver/components/MonthCyclePicker.tsx` (nav anterior/siguiente + picker mes/anio, i18n es-BO, a11y).
- [x] 4.2 Integrar picker en `src/app/conductor/page.tsx` y pasar ciclo a `useShifts`, `useDriverAnalytics`, `DashboardSummary` y `ShiftHistory`; mostrar loading skeletons por ciclo.
- [x] 4.3 Actualizar `src/features/driver/components/ShiftHistory.tsx` y `DashboardSummary.tsx` para estado vacio por ciclo ("No hay turnos en {mes} {anio}") y CTA.
- [x] 4.4 Propagar ciclo a `src/features/driver/components/ShiftAnalytics.tsx` (o query param en `/conductor/analytics?year=&month=`) y limitar `dailyTrend` a dias del mes.

## 5. Verificacion

- [x] 5.1 Verificar queries Firestore con indice creado (no FAILED_PRECONDITION) y lecturas limitadas a mes.
- [x] 5.2 Probar escenarios spec: mes con datos, mes vacio, params invalidos 400, sin auth 401, analytics mensual vs global.
- [x] 5.3 Validar que `invalidateQueries(['driver'])` sigue invalidando caches por ciclo tras create/update/delete.
