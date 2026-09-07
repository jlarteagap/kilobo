## Context

Estado actual: `driver.repository.findAll(userId)` hace `where user_id == userId orderBy date desc limit 50` sin filtro temporal (`src/repositories/driver.repository.ts:97`). `driverService.getAnalytics` carga todos los shifts con `findAll` y agrega en memoria (`src/services/driver.service.ts:243`). Hooks `useShifts` y `useDriverAnalytics` hacen fetch sin params (`src/features/driver/hooks/useDriverShifts.ts:19`, `useDriverAnalytics.ts:8`). UI `/conductor` no tiene nocion de ciclo. Campo `date` ya es `YYYY-MM-DD` local, indexado solo por `user_id`+`date`.

Restricciones: Firestore requiere indice compuesto para `where date` + `orderBy date` con equality en `user_id`. No migrar datos. Mantener compatibilidad de shapes. Reusar agregacion existente.

## Goals / Non-Goals

**Goals:**
- Filtrar lecturas por mes calendario con indice.
- Reusar `getAnalytics` pipeline filtrando input shifts, sin duplicar logica de agregacion.
- UI por ciclo mensual con refetch desacoplado por `queryKey`.

**Non-Goals:**
- Paginacion infinita / cursor.
- Ciclos custom (semana, quincena) - solo mensual en este cambio.
- Cambios en escritura de turnos/transacciones.

## Decisions

**D1: Rango `date` string inclusivo/exclusivo vs Timestamp.** Elegido: strings `YYYY-MM-01` inclusivo a proximo mes exclusivo. Alternativa Timestamp requeriria migrar campo y reindexar. Razon: `date` ya es string comparable lexicograficamente y existente.

**D2: Default mes actual en API vs en hook.** Elegido: default en API (server) si no hay query, hook pasa params cuando tiene ciclo; si hook no pasa nada, API defaulta. Alternativa solo hook - mas fragil si se llama API directa. Mitiga compatibilidad: clientes viejos sin params reciben mes actual en vez de 50 ultimos; aceptado como mejora intencional documentada en proposal.

**D3: Reuso analytics filtrando shifts antes de agregar.** Elegido: `getAnalytics(userId, {year, month})` hace `findByMonth` o `findAll`, luego misma agregacion `gross/liquid/byApp/dailyTrend` sobre array filtrado. Alternativa query de agregacion en Firestore no existe; mantener en memoria es simple y para max ~31-60 shifts/mes es barato.

**D4: `queryKey` con ciclo.** `driverKeys.shifts({year, month})` y `analytics({year, month})`. Permite cache por mes y `invalidateQueries(['driver'])` sigue invalidando todo el namespace.

**D5: Validacion Zod coerce.** `monthQuerySchema = z.object({ year: z.coerce.number().int().min(1900).max(2100).optional(), month: z.coerce.number().int().min(1).max(12).optional() }).refine(v => (v.year == null) === (v.month == null), "year y month deben ir juntos")`. En API, si solo uno llega, 400.

**D6: Indice Firestore.** Agregar a `firestore.indexes.json` entrada `collectionGroup: driver_shifts, fields: [{fieldPath: user_id, order: ASCENDING}, {fieldPath: date, order: DESCENDING}]` y opcional `queryScope: COLLECTION`. Alternativa no declarar y dejar que Firebase pida creacion - se declara para CI.

## Risks / Trade-offs

- **Fecha string vs timezone:** `date` ya es local `YYYY-MM-DD` (`src/app/conductor/page.tsx` y `localDateStr`), rango string es consistente. Riesgo bajo.
- **Indice faltante en prod:** Sin indice, query falla con `FAILED_PRECONDITION`. Mitigacion: agregar a `firestore.indexes.json` y desplegar antes de liberar API.
- **Cambio de default (50 ultimos -> mes actual):** Podria sorprender si usuario tiene turnos en meses pasados y espera verlos sin cambiar ciclo. Mitigacion: en UI mostrar picker con badge de count por mes y vacio explicativo; mantener docs.
- **DailyTrend truncado a mes:** Antes era ultimos 14 dias globales; ahora si mes filtrado, sera dias del mes. Es intencional y util.

## Migration Plan

1. Deploy indice Firestore.
2. Deploy codigo API con soporte query opcional (backward compat global si no hay params, luego switch a default mes en siguiente minor si se quiere preservar compat absoluta - aqui se defaulta a mes).
3. Deploy UI con selector; no requiere backfill.
4. Rollback: revertir a `findAll` sin filtro; indice queda inocuo.

## Open Questions

- ¿Ciclo mensual calendario es suficiente o se necesita ciclo "mes de corte" custom (ej 15-15)? Respuesta diferida: por ahora calendario; si se necesita, se parametriza sin cambiar spec shape.
