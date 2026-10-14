## Why

Firestore factura por documento leído, no por consulta. El gasto actual escala con el tamaño del historial de cada usuario y no tiene techo, mientras el producto no tiene ninguna vía de ingreso que lo compense. Tres factores se multiplican entre sí.

**1. La consulta principal no tiene techo.** `transactions.repository.ts:67-75` lee el historial completo del usuario sin `limit()`, sin ventana de fechas y sin orden, ordenando en JS después de pagar cada documento. Un usuario con cinco años de movimientos diarios genera ~1.800 lecturas por carga del dashboard, y esa misma consulta alimenta el dashboard, la página de transacciones, el progreso de presupuestos, la proyección de balance, el Sankey y cada fallo de caché de insights.

**2. No existe agregación en servidor.** No hay ruta `/api/dashboard` ni de resumen. `useFinancialMetrics.ts` (204 líneas de `useMemo`), `useCashflowData.ts` (grafo Sankey completo) y `calcProgress` en `useBudgets.ts` reducen el array completo en el navegador en cada ciclo de render, con bucles anidados del orden `O(presupuestos × transacciones)`. Ninguna consulta de agregación (`sum`, `count`) se usa en todo el repositorio.

**3. Los patrones N+1 se multiplican en las escrituras.** `transactions.service.ts:27` hace `accountsRepository.findAll(userId)` en cada `createWithBalance`. `driver.service.ts:51-166` invoca esa ruta hasta 17 veces en un solo registro de turno —17 lecturas completas de cuentas y 17 batches separados—. Lo mismo ocurre en `credits.service.ts:150-164` y en el borrado/edición de turnos.

A esto se suma que **12 patrones de consulta carecen de índice compuesto** en `firestore.indexes.json` (que solo define 7). Hoy pasan en desarrollo o fallan silenciosamente; en producción se comportan de forma distinta.

## What Changes

**Consultas acotadas**
- `transactions.findAll` deja de ser la única forma de listar. Pasa a aceptar ventana de fechas y paginación por cursor, con el filtro empujado a la base de datos en lugar de aplicarse en JS.
- La ruta de listado de transacciones deja de devolver el historial completo y devuelve una página.
- Se aplica `limit()` a las lecturas hoy sin cota.

**Índices**
- Añadir los 12 patrones de índice compuesto que faltan, para `investments`, `credits`, `projects`, `categories`, `transactions`, `debts` y `savings_goals`.
- Empuje de los índices de las colecciones compartidas, al que hoy no se declara `user_id` pero que se consultará por propietario en el cambio de seguridad.

**Agregación en servidor**
- Nueva ruta de resumen que devuelve las métricas del dashboard ya calculadas, en lugar de enviar el historial crudo para reducirlo en el navegador.
- Los hooks de métricas, Sankey y progreso de presupuestos consumen esa ruta.

**Eliminación de N+1**
- El registro de un turno del conductor pasa de hasta 17 lecturas de cuentas y 17 commits a un conjunto acotado de lecturas y un único lote.
- El pago de cuotas y el reprocesado de turnos dejan de releer todas las cuentas por cada elemento procesado.
- Se elimina la lectura previa a un incremento que la base de datos ya resuelve de forma atómica.

**Correcciones de lectura**
- Se deja de filtrar y ordenar en JS lo que la base de datos puede filtrar y ordenar.
- Se corrige el `refetchInterval` global de 10 minutos de la tasa de cambio, que hoy dispara una petición de red en cada página y cada 10 minutos con el navegador abierto.

## Capabilities

### New Capabilities

- `data-access/bounded-queries`: las lecturas de datos del usuario están acotadas por ventana de fechas y paginación, se resuelven con índices que existen, y las operaciones que hoy releen conjuntos completos un número no acotado de veces lo hacen con un número acotado de lecturas.
- `data-access/aggregate-reporting`: las métricas agregadas del dashboard —totales de ingreso y gasto, series temporales, desglose por categoría para el Sankey y progreso de presupuestos— las calcula el servidor y las entrega ya agregadas, sin enviar el historial crudo al navegador para reducirlo allí.

### Modified Capabilities

Ninguna. Los cinco specs existentes (`account-balance-history`, `accounts/card-preview`, `driver/app-deposits`, `driver/tips`, `investments/recurring-buys`) describen comportamiento observable de sus dominio, no el modo de acceso a datos. Este cambio no altera ninguno de esos comportamientos: la paginación y la agregación devuelven los mismos totales, solo dejan de calcularse donde se calculaban. La única excepción posible es `account-balance-history`, si el script de auditoría de índices altera el orden de las lecturas de historial; se documenta en `design.md` como riesgo, no como cambio previsto.

## Impact

**Código afectado**
- `src/repositories/transactions.repository.ts` — `findAll` pasa a ser acotada; es el punto de mayor impacto.
- `src/app/api/transactions/route.ts` — deja de devolver el historial completo.
- `src/services/transactions.service.ts:23-49` — hoist de `accountsRepository.findAll` fuera del bucle.
- `src/services/driver.service.ts:51-166, 233-235, 272-278` — registro y reprocesado de turnos.
- `src/services/credits.service.ts:150-164` — pago de cuotas.
- `src/repositories/car-maintenance.repository.ts:20-28` — lectura previa a un incremento atómico.
- `src/repositories/categories.repository.ts:11-18` — filtro en JS de subcategorías migradas.
- `src/repositories/investments.repository.ts:61-65` — `findByName` lee el conjunto completo y filtra en JS.
- `src/features/dashboard/hooks/` y `src/features/budgets/hooks/useBudgets.ts` — pasan a consumir la ruta agregada.
- `src/providers/ExchangeRateProvider.tsx:7, 29-34` — temporizador global.

**Aparición de comportamiento en el cliente**
- `GET /api/transactions` pasa a devolver una página con cursor en lugar del array completo. Es el cambio de contrato más visible: **rompe el supuesto de que el array esté completo** en `useTransactions` y en todo lo que deriva de él. Es un cambio compatible con la especificación pero disruptivo para el código existente, y por eso el orden de `tasks.md` pone la ruta agregada antes de cambiar el contrato del listado.

**Índices**
- `firestore.indexes.json` crece de 7 a 19 entradas. Los índices compuestos en Firestore se construyen de forma asíncrona y **consumen lecturas de construcción** mientras se crean. Hay que desplegarlos **antes** que el código que los necesita.
- Los índices sobre las colecciones compartidas (`car_sharing_cycles`, `car_maintenance_logs`) no requieren campo de propietario: el estado es compartido entre varias personas y no se va a scopear por usuario. Para esas colecciones el trabajo es aplicar `limit()`, no añadir índices por propietario.

**Coste del propio cambio**
- El despliegue de índices y la nueva ruta agregada requieren una ventana de despliegue en dos fases, no un cambio único. Es lo contrario de lo que se suele hacer, pero es lo que evita una caída.

**Fuera de alcance**
- La ausencia de rate limiting y el vector abierto de escritura en `/gasolina` se tratan en `security-legal-hardening`.
- El coste de `verifySessionCookie` por petición se documenta en `design.md` pero no se cambia aquí: el cambio natural es cachear la verificación dentro de la petición, lo que requiere middleware activo sobre `/api`, decisión que pertenece al otro cambio.