# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[Unreleased]: https://github.com/jlarteagap/kilobo/compare/v1.6.0...HEAD
[1.6.0]: https://github.com/jlarteagap/kilobo/compare/v1.5.6...v1.6.0
[1.5.6]: https://github.com/jlarteagap/kilobo/compare/v1.5.5...v1.5.6
[1.5.5]: https://github.com/jlarteagap/kilobo/compare/v1.5.4...v1.5.5
[1.5.4]: https://github.com/jlarteagap/kilobo/compare/v1.5.3...v1.5.4
[1.5.3]: https://github.com/jlarteagap/kilobo/compare/v1.5.1...v1.5.3
[1.5.1]: https://github.com/jlarteagap/kilobo/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/jlarteagap/kilobo/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/jlarteagap/kilobo/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/jlarteagap/kilobo/compare/v1.2.2...v1.3.0
