# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[Unreleased]: https://github.com/jlarteagap/kilobo/compare/v1.6.2...HEAD
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

