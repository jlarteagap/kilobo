# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.8] - 2026-10-05

### Added
- **Gasolina — Editar un ciclo cerrado**: Botón de lápiz por ciclo con monto, litros y pagador. Existía un problema real aquí: los ciclos anteriores a `gasLiters` nunca lo tuvieron, y sin una forma de completarlo la card de consumo no arrancaba nunca — había que acumular 3 ciclos nuevos con litros para ver algo. También resuelve el typo del monto, que antes solo se arreglaba borrando el ciclo y perdiendo los viajes. Al cambiar el monto, `debtSummary` se recalcula; si no, los costos por persona dejarían de sumar el total.
- **Gasolina — Aviso de odómetro implausible**: Un viaje que da más de 500 km (más que un tanque lleno) pide confirmación antes de guardarse. No bloquea, porque el wrap del odómetro de 3 dígitos genera kilometrajes grandes legítimos. `computeTripKm` se extrajo a `src/types/car-sharing.ts` y ahora el repositorio y el cliente usan la misma cuenta: si divergieran, la advertencia mentiría.
- **Gasolina — Historial del auto** (`/gasolina/historial`): Gasolina y mantenimiento en una misma línea de tiempo, en página aparte para no recargar la principal. Cada servicio muestra el promedio de L/100km de los 3 ciclos cerrados que le siguieron, que es la forma de ver si el aditivo de inyectores sirvió de algo.
- **Gasolina — Recuperado el botón "Borrar historial completo"**, que se había perdido al descomponer el dashboard y dejaba `resetAllAction` como código muerto. Vive en un collapsible "Configuración" y el diálogo aclara que **no** borra el odómetro absoluto, porque ese es un dato real del auto y no una derivación de los viajes.

### Fixed
- **Gasolina — Un baseline arruinado contaminaba la serie entera**: `isComparable` solo acotaba por arriba (30 L/100km). Teclear el odómetro en el campo de litros (500 en vez de 50) daba 0,32 L/100km, que pasaba el filtro y como el baseline es el mínimo histórico, dejaba todos los ciclos siguientes con +2000% y la alerta dejaba de significar nada. Ahora hay piso de 2 L/100km.
- **Gasolina — Ciclos pendientes sin transferencias desaparecían**: El estado vacío se guiaba por `transfers.length === 0`, así que un ciclo abierto donde el pagador manejó todo el tramo no se listaba —decía "Nada por cobrar" mientras el encabezado decía que había un ciclo abierto, y no había forma de liquidarlo ni borrarlo.
- **Gasolina — Borrar un viaje no pedía confirmación**: No era cosmético: borra los km y recalcula el reparto del ciclo, así que un clic de más cambia cuánto debe cada quien en un ciclo ya cerrado.
- **Gasolina — La fecha del viaje no se podía ordenar**: Era el string `"DD/MM HH:mm"` armado por el cliente: sin año, en la zona horaria de quien escribía, y no ordenable. Ahora es un timestamp. Los 7 viajes existentes se migraron (el string original queda en `legacyDate`), y `normalizeTrips` rellena el timestamp en lectura para documentos que no migraron.

## [1.7.7] - 2026-10-05

### Added
- **Gasolina — Consumo por kilómetro**: Nueva card que compara el L/100km de cada ciclo cerrado y avisa cuando el último supera en más de 15% tu mejor registro histórico. Muestra las tres métricas del último ciclo juntas — L/100km, Bs/km y Bs/L — porque si el consumo sube y el precio del litro no, el problema es el auto; si suben las dos, es el precio. La serie es CSS, no Recharts, para no cargar el chart en una página pública que se abre con datos de red lentos.
- **Gasolina — Litros opcionales al cerrar un ciclo**: Campo `gasLiters` en `CarCycle`. El precio del litro cambia con los subsidios, así que convertir Bs a litros con un precio fijo falsea la comparación entre ciclos; el dato se pide directamente. Un ciclo sin litros sigue aportando Bs/km y deudas, pero no entra en la comparación de consumo.
- **Gasolina — Cuentas pendientes con liquidación**: Botón para marcar cada ciclo como pagado, sección colapsada de liquidados, y detalle desplegable por ciclo con los viajes, el Bs/km y **todos** los deudores.
- **Gasolina — Total neto compensado entre ciclos**: `computeNetBalances` + liquidación greedy (`settleBalances`) en `src/app/gasolina/utils/debts.utils.ts`. Si en un ciclo te deben Bs 200 y en otro tú debes Bs 150, la transferencia real es de Bs 50, no dos. Funciona para N personas y siempre resuelve en N-1 transferencias.

### Fixed
- **Gasolina — Deudores múltiples**: El panel lateral usaba `debtSummary.find(d => d.name !== paidBy)`, que con tres conductores encontraba solo al primero y descartaba al resto en silencio. Ahora se listan todos.
- **Gasolina — Fechas de ciclo en el servidor**: `new Date(cycle.startDate).toLocaleDateString('es-ES')` renderizaba `'...'` en el servidor y se rellenaba en un `useEffect`, porque el servidor corre en UTC y el cliente en UTC-4: un timestamp de las 23:00 local salía con el día siguiente a un lado y con el día correcto al otro. Reemplazado por `formatCycleDate` con `timeZone: 'America/La_Paz'`.
- **Gasolina — Borrado accidental de cuentas**: El 🗑 estaba a 8px del nuevo botón de liquidar y no pedía confirmación. Ahora ambas acciones pasan por `window.confirm`.
- **Gasolina — Página caída sin el índice**: `getClosedCycles` ahora filtra y ordena en Firestore (`status ASC + endDate DESC`) con `limit(200)` en vez de traer la colección entera. **Requiere `npx firebase deploy --only firestore:indexes --project kiposbo`**, sin el cual la query lanza `FAILED_PRECONDITION`.

### Changed
- **Gasolina — Reskin completo a Minimal·Zinc**: `page.tsx`, `CarSharingDashboard`, `MaintenanceWidgets` y `MaintenanceModal`. Se elimina el `dark:` inerte (110 ocurrencias en 4 archivos), el bloque `blur-[120px]` decorativo, el emoji 🚗 y el título gigante centrado. Neutros zinc, un solo acento `#059669` reservado para montos positivos, `tabular-nums` en todas las cifras, cards `rounded-[22px]` y el orden de severidad de barras que ya usa `MaintenanceFundCard`.
- **Gasolina — `CarSharingDashboard` descompuesto**: De 563 líneas monolíticas a un componente que compone `ConsumptionCard` y `PendingAccounts`, con el cálculo puro separado en `src/app/gasolina/utils/`.
- **Gasolina — Tipos movidos a `src/types/car-sharing.ts`**: `CarTrip`, `CarTripSource`, `DebtResult` y `CarCycle` salen del repositorio para que los componentes cliente los usen sin arrastrar `firebase-admin` al bundle. El repositorio los re-exporta y normaliza los campos opcionales a `null` en lectura.
- **Gasolina — Carga de datos en paralelo**: `page.tsx` usaba 4 `await` secuenciales; ahora un `Promise.all` sobre datos de dos colecciones distintas.

## [1.7.6] - 2026-10-02

### Changed
- **Conductor — Reskin completo a Minimal·Zinc**: `/conductor`, `/conductor/settings` y `/conductor/analytics`, junto con `ShiftForm`, `ShiftHistory`, `ShiftDetailSheet`, `ShiftAnalytics`, `DriverDeposits`, `DashboardSummary`, `MonthCyclePicker`, `DriverWidget` y `MaintenanceFundCard`. Neutros zinc, un solo acento `#059669` reservado para montos positivos, `tabular-nums` en todas las cifras y eliminación de los `dark:` inertes.

## [1.7.5] - 2026-10-01

### Added
- **Conductor — Fondo de mantenimiento como cuenta real**: Campo `maintenanceSavingsAccountId` en `DriverConfig` (con su schema Zod) para elegir en qué cuenta se acumula la reserva del 6% de cada turno.
- **Conductor — Endpoint `/api/driver/maintenance`**: Devuelve en una sola llamada el saldo del fondo, el odómetro absoluto y el estado de cada servicio (km restantes, ratio de avance y `shortfall` = cuánto dinero falta para el próximo). Alimenta el nuevo hook `useMaintenance` y la `MaintenanceFundCard`.
- **Conductor — Métricas del turno por periodo**: `useShiftPeriodStats` para el resumen Hoy / Semana / Mes, más un badge con la reserva de mantenimiento en el historial y el detalle del turno.
- **Script `backfill-shift-maintenance.ts`**: Recomputa `maintenanceReserve` y `liquidEarnings` de los turnos anteriores al fix usando la **misma** `computeShiftMetrics` que el runtime, para que un rerun no escriba cifras con una fórmula distinta a la de los turnos nuevos.

### Changed
- **Gasolina/Mantenimiento — El gasto pasa a ser real**: `addMaintenanceLogAction` crea una transacción `EXPENSE` desde la cuenta del fondo cuando hay sesión iniciada y devuelve un aviso si el costo supera el saldo disponible. Como `/gasolina` es pública, sin sesión solo se guarda el log histórico.
- **Mantenimiento — Reversión al borrar**: `deleteMaintenanceLogAction` revierte la transacción asociada antes de eliminar el log, para no dejar el gasto cobrando después de borrar el registro.
- **Mantenimiento — Tipos movidos a `src/types/car-maintenance.ts`**: `CarMaintenanceLog`, `MaintenanceType` y `CarConfig` salen del repositorio para que los componentes cliente los usen sin arrastrar `firebase-admin` al bundle.
- **Gasolina — Origen de los viajes**: `CarTrip.source` distingue `shift` de `manual` para separar los km que ya entraron al odómetro desde un turno de `/conductor`, evitando contarlos dos veces y partir a la mitad los intervalos de mantenimiento.

### Fixed
- **Reserva de mantenimiento siempre en 0**: Los turnos creados antes del fix persistían `maintenanceReserve` y `liquidEarnings` en `0` aunque la transacción de la reserva sí se registrara, por lo que el historial y las tarjetas mostraban cero.
- **Transferencias a la misma cuenta**: `transactions.service` ahora rechaza crear una transferencia cuyo `to_account_id` sea igual al `account_id` de origen.

## [1.7.4] - 2026-09-16

### Added
- **Transacciones — Exportación CSV**: Utilidad `csv-export.utils.ts` que resuelve los nombres de cuenta, categoría y proyecto (con fallback `Personal`), normaliza la moneda de cada monto y traduce los tipos a `Ingreso` / `Gasto` / `Transferencia` / `Ahorro`. Botón "Exportar CSV" en `/transacciones` que descarga `transacciones-{fecha}.csv`.

### Changed
- **Cuentas — Acciones flotantes en las cards**: Acciones de editar y eliminar ancladas abajo a la derecha en desktop, sobre fondo `zinc-100` con borde, y siempre visibles en mobile (antes solo emergían al hover). El icono de la cuenta deja de usar el color por tipo y pasa a neutro `zinc-100` / `zinc-400`.
- **Transacciones — Reskin Minimal·Zinc**: `TransactionList`, `TransactionTotal`, `SummaryCards`, `CategoryOverview`, `IncomeExpenseChart` y `trend-badge` alineados al sistema visual vigente.

## [1.7.3] - 2026-09-12

### Added
- **Módulo Conductor — Propinas por App y Método de Pago**: Soporte para registrar propinas individualizadas por plataforma (Uber, Yango, InDrive) y método de cobro (`CASH`, `QR`) en el formulario de turnos (`ShiftForm`). Cálculo automático de propinas totales (`totalTips`) y visualización en el desglose de turno (`ShiftDetailSheet`) y analíticas.
- **Módulo Conductor — Depósitos de Apps y Reconciliación**: Nuevo submódulo `DriverDeposits` y endpoint `/api/driver/deposits` para registrar depósitos bancarios de las plataformas, deducción de comisiones sobre bonos/tarjetas y reconciliación automática de montos pendientes vs depositados (`DriverDepositReconciliation`).
- **Módulo Conductor — Reserva de Mantenimiento Estimada**: Cálculo y persistencia del campo `maintenanceReserve` por turno para proyectar el fondo sugerido de ahorro para el desgaste y mantenimiento del vehículo.
- **Módulo Conductor — Configuración de Cuenta de Bonos**: Soporte para configurar la cuenta de depósito de bonos (`bonusDepositAccountId`) en `DriverConfig` y ajustes de conductor (`/conductor/settings`).

### Changed
- **Esquemas de validación y tipos de Conductor**: Actualización de `driver.schema.ts` y `src/types/driver.ts` con tipos `TipsByMethod`, helpers `sumTips`, `sumTipsByMethod`, `sumAppTips`, `emptyTips` y esquemas Zod `tipsSchema`, `depositSchema`.
- **Persistencia y normalización en Repositorio**: `driver.repository.ts` normaliza de forma segura `tips` (soportando números legacy o el nuevo objeto `{ CASH, QR }`), `totalTips`, `maintenanceReserve` y `totalMaintenance` en analíticas.
- **Índices de Firestore**: Nuevos índices compuestos en `firestore.indexes.json` para consultar depósitos de conductor por `user_id`, `app` y `date desc`.

## [1.7.2] - 2026-09-11

### Added
- **Cuentas — Variación Diaria de Saldo**: Indicador visual en tiempo real (`AccountChangeBadge`) en la lista de cuentas que refleja la variación neta de saldo en las últimas 24 horas con badges de estado (positivo, negativo o sin cambio) y montos formateados.
- **Cuentas — Diálogo de Historial de Auditoría**: Componente modal `AccountHistoryDialog` para auditar el historial cronológico y deltas diarios de saldo de cada cuenta (`useAccountBalanceHistory`, `useAccountDailyDeltas`, `useAccountBalanceChanges`).
- **Inversiones — Planes de Compra Recurrente**: Modales `RecurringPlanDialog` y `ConfirmRecurringBuyDialog` para definir planes de inversión periódicos y automatizar el registro de compras con cálculo de rendimientos.
- **Inversiones — Vistas y Widgets Modulares**: Componentes desacoplados para la gestión integral de inversiones (`InvestmentsWidget`, `InvestmentsByAccount`, `UpcomingPurchases`, `TxHistory`, `PlanStatus`, `InvestmentRow`).
- **Metas de Ahorro — Formulario de Depósitos**: Componente `SavingsGoalDepositForm` para registrar depósitos y transferencias directas hacia metas de ahorro desde las tarjetas de metas (`SavingsGoalCard`, `SavingsGoalsList`).
- **Preferencias de Usuario**: Repositorio y hook `usePreferences` / `user-preferences.repository.ts` para persistir configuraciones personalizadas del usuario.

### Changed
- **Servicios de Inversión y Ahorro**: `investments.service.ts` y `savings-goal.service.ts` refactorizados para soportar transacciones atómicas con Firestore batch en depósitos, retiros y planes recurrentes.
- **Tipos y Validaciones**: Esquemas de Zod y tipos TypeScript ampliados para `investment.schema.ts`, `savings-goal.schema.ts` y `account.schema.ts`.

### Fixed
- **Carga de cuentas y Suspense**: Corrección de estados de carga y transiciones de Suspense en la lista de cuentas (`AccountsList.tsx`) para evitar parpadeos y desincronización de badges de variación.

## [1.7.1] - 2026-09-07

### Added
- **Módulo Conductor — Filtro de Ciclos Mensuales**: Selector de ciclos (`MonthCyclePicker`) y hook `useMonthCycle` que permite filtrar turnos y analíticas por períodos mensuales personalizados o ciclos estándar (ej. del 1 al fin de mes), adaptando las consultas de `/api/driver/shifts` y `/api/driver/analytics`.
- **Sistema de Diseño Kilo Sage (B2)**: Implementación integral de la nueva identidad visual de Kilo: paleta Sage (`#F2FBE0` background, `#4F6A35` CTA), tipografía Inter, radios simétricos de 22px (`rounded-[22px]`) sin bordes duros y sombras sólidas.
- **Shell y Navegación Rediseñados**: Nueva barra lateral (sidebar rail), títulos de página consistentes (30px), barra de navegación móvil (`bottom-nav`) y eliminación de clases obsoletas de modo oscuro.
- **Paleta Unificada de Gráficos**: Token global `CHART_COLORS` para estandarizar las series de datos en Recharts, Flujo de Caja (Sankey) y widgets analíticos.
- **Landing Page & Login Reskin**: Rediseño de la página de bienvenida con cuadrícula Bento (`BentoGrid`), widget interactivo Pulse y pantalla de autenticación adaptada a la estética Sage.

### Changed
- **Dashboard — Sección de Flujo de Caja (Sankey)**: Rediseño completo de `CashflowSection`, optimizando `SankeyCustomNode`, `SankeyCustomLink` y `chart-tooltip.tsx` con soporte responsivo y mejor jerarquía visual.
- **Reskin de Todos los Módulos**: Adaptación visual de Cuentas, Presupuestos, Deudas, Créditos, Categorías, Insights y Metas de Ahorro bajo los estándares de `docs/DESIGN-MANUAL.md`.

## [1.7.0] - 2026-08-06

### Added
- **Módulo Conductor — Registro Manual de Turnos**: Reemplazo del flujo de "turno activo con timer" por un formulario único (`ShiftForm`) que registra turnos al final del día o días atrás. Permite elegir la fecha (con máximo hoy), ingresar horas trabajadas manualmente (paso 0.25), registrar odómetro de inicio/fin (odómetro de 3 dígitos con wrap), desglosar ingresos por app (Uber/Yango/InDrive) y método de pago (efectivo/tarjeta/QR), sumar bonos y comisiones, agregar gastos (peaje/gasolina/mantenimiento/varios) con su método de pago y notas. Soporta múltiples turnos por día.
- **Widget Conductor en Dashboard**: Nuevo widget en el dashboard principal (`DriverWidget`) que resume el líquido de hoy, esta semana (con Bs/hora), este mes, el promedio por turno, los km de la semana y el último turno registrado, con acceso directo a `/conductor`. Incluye estados de carga (skeleton), error y vacío con CTA para registrar el primer turno.
- **Desglose de Turno (Bottom Sheet)**: Componente `ShiftDetailSheet` que muestra el detalle completo de un turno (fecha con día de la semana, horas trabajadas, km, desglose por app/método, neto líquido y Bs/hora). Accesible desde el historial de turnos con acciones de editar y eliminar.
- **Resumen de Dashboard en Conductor**: Mini-tarjetas "Hoy / Esta semana / Este mes" (`DashboardSummary`) en la página `/conductor`.
- **Métricas de Analytics ampliadas**: Promedio por turno (`avgPerShift`), Bs/hora, tendencia diaria de líquido, desglose por app y bruto/líquido en `/conductor/analytics`.

### Changed
- **Modelo de datos del turno**: `DriverShift` ahora usa `date` (YYYY-MM-DD) y `hoursWorked` (input manual) como fuente de verdad; se eliminaron `status`, `startTime` y `endTime`. Los turnos se agrupan por día y el historial se ordena por `date desc`.
- **API de turnos**: `POST /api/driver/shifts` crea turnos con el nuevo esquema `shiftSchema` (validación de fecha, horas 0.25–24 y km 0–999); `PATCH [id]` y `DELETE [id]` soportan edición/eliminación con reprocesamiento en cascada de transacciones y regresión del trip en Gasolina.
- **Repositorio**: `normalizeShift` con defaults seguros y migración en lectura de turnos legacy (deriva `date` y `hoursWorked` desde `startTime`/`endTime`).
- **Alias y formato**: Fechas y day-of-week se calculan en hora local de Bolivia (UTC-4) para evitar desfases.

### Fixed
- **Neto líquido sin persistir**: Los campos financieros calculados (`liquidEarnings`, `totalEarnings/Bonuses/Commissions/Expenses`, `grossEarnings`, `pendingAmount`, `generatedTransactionIds`, `gasolinaTripCreatedAt`, `totalKm`) quedaban guardados en `0` al crear un turno porque el repositorio los hardcodeaba. Ahora `create()` persiste los valores reales calculados por `processShiftTransactions`, lo que también habilita la eliminación/reprocesamiento en cascada correcta.
- **Desfase de fecha por timezone**: `new Date("YYYY-MM-DD")` se interpretaba como medianoche UTC y en Bolivia (UTC-4) mostraba el día anterior en el historial, detalle y gráficos. Se reemplazó por parseo de fecha local (`parseLocalDate`) y conversión ISO→local (`isoToLocalDateStr`) en todos los componentes.
- **Crasheos por datos nulos**: Turns legacy sin campos nuevos ya no rompen con "Cannot read properties of null (reading 'toFixed')"; se agregó sanitización con defaults en el repositorio y defensas `?? 0` en componentes de UI, analytics y summary.

## [1.6.2] - 2026-07-06

### Added
- **Módulo de Inversiones**: Implementación del modelo de datos, esquemas de validación Zod, tipos TypeScript y API endpoints (`/api/investments` y `/api/investments/[id]`) para registrar y administrar inversiones vinculadas a cuentas.
- **Componentes de Interfaz de Inversiones**: Creación del listado de inversiones agrupado por cuentas (`InvestmentsList`), formularios de registro (`CreateInvestmentForm`, `InvestmentForm`) y un widget resumen en el Dashboard que consolida montos invertidos por tipo de moneda.
- **Interactividad en Gráfico de Flujo de Caja (Sankey)**: Integración de `SankeySelectionContext` y componentes personalizados (`SankeyCustomNode`, `SankeyCustomLink`) que permiten resaltar nodos y enlaces seleccionados, atenuando el resto del diagrama para facilitar el análisis visual.
- **Integración de Inversiones en Transacciones**: Opción de registrar transferencias o egresos como inversiones directamente desde el formulario de transacciones.

### Changed
- **Pestañas de Navegación en Cuentas**: Reestructuración de la página de cuentas (`/accounts`) para separar el listado tradicional de cuentas y el nuevo listado de inversiones mediante un selector de pestañas (Tabs).
- **Desglose Multidivisa en Dashboard**: Actualización del encabezado del dashboard (`DashboardHeader`) y del hook `useAccountsDashboard` para mostrar el balance total segregado por moneda y destacar el monto acumulado de inversiones.
- **Flujo de Transferencias en Sankey**: Inclusión de las transacciones de tipo `TRANSFER` dentro de la visualización de flujo de caja, canalizándolas a través de un nodo unificado de "Transferencias".
- **Refactorización del Repositorio de Inversiones** (`investments.repository.ts`): Adición de helpers para operaciones en Firestore Write Batch (`createInBatch`, `updateInBatch`, `deleteInBatch`) que encapsulan el acceso directo a Firestore, mejorando el desacoplamiento y cumplimiento SOLID. Reemplazo de `Timestamp.now()` por `FieldValue.serverTimestamp()` en actualizaciones.
- **Refactorización del Servicio de Inversiones** (`investments.service.ts`): Eliminación del acoplamiento directo a Firestore mediante el consumo de los helpers batch del repositorio. Toda la lógica transaccional (crear, actualizar, eliminar inversión junto con ajuste de saldo de cuenta) se ejecuta en un único Firestore Batch para garantizar atomicidad.
- **CSS Helper para Colores de Cuenta** (`InvestmentsList.tsx`): Reemplazo de la manipulación frágil de strings de clases Tailwind por la función helper estática `getAccountColors()`, evitando el purging incorrecto de clases en producción.

### Fixed
- **Doble Débito en Inversiones Vinculadas a Transacciones**: Corregido el bug donde crear una inversión desde el formulario de transacciones descontaba el saldo dos veces (una por la transacción y otra por el servicio de inversiones). Ahora, si la inversión tiene un `transaction_id`, se omite la deducción de saldo.
- **Relación Bidireccional Transacción↔Inversión**: Al crear una inversión vinculada a una transacción, el campo `investment_id` de la transacción se actualiza atómicamente en el mismo batch, completando la relación en Firestore y permitiendo que el listado de transacciones muestre el indicador visual de "Inversión".
- **Bug de Renderizado en `TransactionList.tsx`**: Corregido el error "Cannot create components during render" causado por definir el componente `TypeIcon` como función de renderizado inline. Se reemplazó por renderizado dinámico del ícono de Lucide inyectado directamente.
- **Diálogo de Edición de Inversiones**: Implementado el flujo completo de edición de inversiones (botón lápiz → diálogo con `InvestmentForm` → mutación `useUpdateInvestment` → cierre automático al éxito) que anteriormente no estaba conectado.

## [1.6.1] - 2026-06-23

### Added
- **Live Exchange Rates API**: Added an API route (`/api/exchange-rate`) that fetches live USD/BOB Binance P2P exchange rates from `bo.dolarapi.com` with a fallback to 6.96 BOB and a 5-minute CDN cache.
- **Exchange Rate Client Provider**: Implemented `ExchangeRateProvider` to initialize and periodically update (every 10 minutes) live exchange rates across the client application.
- **Server-Side Live Rate Cache**: Integrated an active rate fetching check (`ensureLiveRate`) with a 5-minute TTL inside transaction service operations to minimize external network requests.

### Changed
- **Cross-Currency Balance Logic**: Enhanced Firestore batch operations (`createWithBalance` / `deleteWithBalance`) to compute and record `converted_amount` and `to_currency` when transferring/saving between accounts with mismatching currencies.
- **Unified Multi-Currency Calculations**: Updated financial metrics hooks, budget tracking, debt calculations, transaction lists, projections, charts, and AI insights to perform real-time cross-currency conversions using live rates.

## [1.6.0] - 2026-06-10

### Added
- **Savings Goals**: Implemented a comprehensive savings goals feature including CRUD operations, UI components, and balance projection forecasting.
- **Legacy Debts**: Added support for legacy debts and automated synchronization between debt creation/payments and transactions.
- **Custom Dates Support**: Enabled custom date selection for debts, transactions, and car sharing trips.

### Changed
- **Activities & Labels**: Refactored the application to rename "Project" entities to "Activities" and "Subtypes" to "Labels" for better conceptual alignment.
- **Dependencies & Routing**: Updated node modules dependencies and refined transaction route logic.

### Fixed
- **Hydration Mismatches**: Resolved React hydration mismatch errors related to custom date implementations.
- **Savings Goals & UI**: Updated savings goal form validation, fixed repository type casting, and standardized empty state UI.

## [1.5.6] - 2026-05-30

### Added
- **Transactional Balance Updates**: Shifted transaction creation (`createWithBalance`) and deletion (`deleteWithBalance`) processes from separate clientside/serverside steps into atomic Firestore write batches. This ensures that account balance updates and transaction records succeed or fail together, eliminating API race conditions and partial states.

### Changed
- **Firestore Read Minimization**: Refactored all data repositories (`accounts`, `budget`, `categories`, `debt`, `project`, `transactions`) to return the locally-constructed payload directly after write operations (`add`/`set`) rather than performing a redundant subsequent `.get()` read. This decreases database access latency and lowers Firestore read operation costs.
- **Concurrent DB Validation**: Upgraded the account-in-use check (`isUsedInTransactions`) to execute the database queries concurrently via `Promise.all` instead of sequentially, reducing the validation check response time by half.
- **Insights Computation Reuse**: Optimized AI insights and health calculation algorithms (`detectAnomalies`, `detectSavingOpportunities`, `calculateHealthScore`) to reuse pre-computed `CategoryTrend` arrays, eliminating redundant O(N) recalculations during dashboard loading.
- **Parallel Category Updates**: Refactored removed tags verification in category updates to run asynchronously using `Promise.all` instead of a sequential `for...of` loop, reducing latency on category updates.
- **Consistent Static Timestamps**: Replaced dynamic server-side timestamps (`FieldValue.serverTimestamp()`) with stabilized client-side timestamps (`Timestamp.now()`) across repositories, resolving issues with local state synchronization.

## [1.5.5] - 2026-05-21

### Added
- **CategoryComparison Component**: Integrated a beautiful visual comparison tool `CategoryComparison` to analyze month-to-month changes across different categories.
- **Firebase Setup Integration**: Initialized Firebase configurations on client and server sides to enable real-time features.

### Changed
- **Session Cookie Policy**: Tightened session security rules and cookie configurations.
- **Budget Endpoint Authorization**: Reinforced security by validating budget ownership and user authorization on all budget API endpoints.
- **CodeGraph Configuration**: Added a workspace index tracker using `.codegraph` structure.

## [1.5.4] - 2026-05-14

### Changed
- **Standardized UI Components**: Reorganized interface layouts to use premium, consistent design elements across all pages.
- **Global Error Boundaries**: Added global error boundary overlays to gracefully catch and display runtime exceptions.
- **Mobile Responsiveness**: Adapted layout configurations to properly scale tables and forms on small viewport sizes.

### Fixed
- **AI insights connection**: Resolved connection issues in the AI narrator services and polished narrative text formatting.
- **Dashboard charts**: Fixed alignment and rendering errors in dashboard visual widgets.

## [1.5.3] - 2026-05-13

### Added
- **Car Maintenance & Oil Odometer Tracker**: Implemented a comprehensive car logs tracking system with repositories, server actions, and management UIs to monitor odometer mileage and oil change warnings.
- **3-Month Account Expense Comparison**: Added a feature to compare account spending over the last three months, suggesting dynamic budget optimizations.
- **Gasoline & Trip Breakdown**: Introduced a trip tracking layout under `/gasolina` allowing inline trip editing, detailed breakdowns by user, and time-stamped logs.

### Changed
- **Category UI Simplification**: Streamlined the categories page to focus solely on expense categories, completely removing the legacy income categories for a cleaner structure.
- **Anomaly Detection UI**: Redesigned `AnomalyCard` using beautiful visual boundaries and premium status badges.

### Removed
- **CarSharing Feature**: Removed the deprecated car sharing system to prioritize the Gasoline and Car Maintenance trackers.

## [1.5.1] - 2026-04-16

### Changed
- **Analytics Visualization**: Interactive data visualization features for transaction analysis. Added drill-down capability in the `CategoryOverview` donut chart to display specific subtypes and project breakdowns.
- **Cashflow Dashboard**: Improved the `CashflowSection` visual components and associated hooks.

## [1.5.0] - 2026-03-31

### Added
- **Budget Enhancements**: Added support for budget types (budget vs saving), status tracking (active/completed/paused), category association, recurrence (`is_recurring`), and specific due days.
- **Transaction Tags**: Added support for nullable `tag` and `category_id` fields in transactions for more flexible categorization.

### Changed
- **Form Optimization**: Migrated from `form.watch()` to `useWatch()` across forms for improved reactivity and reduced component re-renders.
- **Code Quality**: Undertook comprehensive refactoring to resolve TypeScript type mismatches, enforce strict type safety, and refine React hooks.

### Fixed
- **Linting & Unused Code**: Removed unused repository parameters across services, cleaning up the codebase and resolving React Compiler warnings.
- **Form Type Definitions**: Fixed null and undefined handling for various form fields, particularly concerning `currency`, `due_day`, and `description` types in `BudgetForm` and `TransactionForm`.

## [1.4.0] - 2026-03-27

### Added
- **Projects Feature**: New module to manage business units or specific projects. Includes support for custom icons, colors, and business-specific subtypes.
- **Project-Transaction Association**: Transactions can now be tagged with a project and a specific subtype for granular tracking.
- **Project API**: Implemented CRUD operations for projects, including automated ownership validation.

### Changed
- **Transaction Filters**: Enhanced filtering capabilities to include projects, subtypes, and "Personal" (non-project) transactions.
- **Transaction Management**: Updated forms and hooks to support the new project-based fields and improved client-side balance synchronization.

### Fixed
- **API Consistency**: Resolved missing individual project endpoints and standardized response formats across the new modules.

## [1.3.0] - 2026-03-24

### Added
- **Quick Action Menu**: A new dropdown in the header for rapid creation of transactions, accounts, budgets, categories, and debts.
- **CreateAccountForm**: New dedicated form for account creation.
- **Page Metadata**: Added unique titles and descriptions for all main routes (Dashboard, Accounts, Budgets, Transactions, Categories, Debts, Forecast).
- **Quiet Wealth Landing Page**: Transitioned the root route to a premium landing page and moved the dashboard to `/dashboard`.

### Changed
- **Mobile Responsiveness**: Improved layout and table formatting for mobile devices across the application.
- **Simplified Transactions**: Streamlined the transaction creation process by removing the required payment method selection.
- **Dashboard Overview**: Enhanced the dashboard with budget and debt summary components and updated sidebar navigation.
- **Authentication**: Implemented automatic redirection for logged-in users and improved session handling.

### Fixed
- **Debt Metrics**: Resolved calculation issues with net worth and liability metrics related to debt accounts.
- **Payment Methods Cleanup**: Removed redundant references to legacy payment method logic in forms and hooks.

## [1.2.2] - 2026-03-11
- Initial version found in this log.

[Unreleased]: https://github.com/jlarteagap/kilobo/compare/v1.7.3...HEAD
[1.7.3]: https://github.com/jlarteagap/kilobo/compare/v1.7.2...v1.7.3
[1.7.2]: https://github.com/jlarteagap/kilobo/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/jlarteagap/kilobo/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/jlarteagap/kilobo/compare/v1.6.2...v1.7.0
[1.6.2]: https://github.com/jlarteagap/kilobo/compare/v1.6.1...v1.6.2
[1.6.1]: https://github.com/jlarteagap/kilobo/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/jlarteagap/kilobo/compare/v1.5.6...v1.6.0
[1.5.6]: https://github.com/jlarteagap/kilobo/compare/v1.5.5...v1.5.6
[1.5.5]: https://github.com/jlarteagap/kilobo/compare/v1.5.4...v1.5.5
[1.5.4]: https://github.com/jlarteagap/kilobo/compare/v1.5.3...v1.5.4
[1.5.3]: https://github.com/jlarteagap/kilobo/compare/v1.5.1...v1.5.3
[1.5.1]: https://github.com/jlarteagap/kilobo/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/jlarteagap/kilobo/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/jlarteagap/kilobo/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/jlarteagap/kilobo/compare/v1.2.2...v1.3.0

