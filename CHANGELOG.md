# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.4.0]: https://github.com/jlarteagap/kilobo/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/jlarteagap/kilobo/compare/v1.2.2...v1.3.0
