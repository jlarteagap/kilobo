# Design Spec: Car Sharing Cycles & Debt Management

## Overview
Expand the existing car-sharing feature to support multiple cycles, historical debt tracking, and payment attribution. The UI will be refined into a minimalist dashboard with an active work area on the left and a pending accounts sidebar on the right.

## Goals
- Support historical tracking of "closed" cycles.
- Attribute gas payment to a specific user.
- Calculate and display debts per cycle.
- Minimalist, high-end UI following the established aesthetic.

## Data Model (Firestore)

### Collection: `car_sharing_cycles`
Each document represents a cycle. There is always exactly one document with `status: 'active'`.

```typescript
interface CarTrip {
  userName: string;
  initialKm: number;
  finalKm: number;
  totalKm: number;
  date: string; // DD/MM format
  createdAt: number; // For sorting
}

interface DebtResult {
  name: string;
  totalKm: number;
  percentage: number;
  cost: number;
}

interface CarCycle {
  id: string;
  status: 'active' | 'closed';
  startDate: number;
  endDate: number | null;
  gasAmount: number;
  paidBy: string | null; // Name of person who paid at the station
  trips: CarTrip[];
  debtSummary: DebtResult[];
}
```

## Functional Requirements

### 1. Active Cycle Tracking
- Automatically records the date (DD/MM) for each trip.
- Maintains the "Last Odometer" logic globally.
- Form to add trips for Melissa, Jorge, or "Other".

### 2. Cycle Closure
- User enters `gasAmount` and selects `paidBy`.
- Upon submission, the system:
  1. Calculates the percentage of total KM per user.
  2. Calculates the cost per user based on `gasAmount`.
  3. Updates the document `status` to `'closed'`.
  4. Sets `endDate` to the current timestamp.
  5. **Creates a new `'active'` cycle** starting with the last known odometer.

### 3. Debt Management
- Display a list of `'closed'` cycles in a right sidebar.
- For each closed cycle, show:
  - Date range.
  - Total gasoline cost and who paid.
  - The amount the "other" person owes to the person who paid.
- Provide a delete button (`X`) for each closed cycle to "settle" it.

### 4. Global Reset
- A "Limpiar Todo" button that deletes ALL documents in `car_sharing_cycles`.

## UI/UX Design (Minimalist)

### Layout
- **Container**: Max-width 4xl, centered. Mesh gradient background.
- **Left Column (2/3)**: Active Cycle.
  - Registration Form.
  - Trip History Table (Columns: User, Range, Date, KM).
  - "Finalizar Ciclo" section with gas amount and payer selection.
- **Right Column (1/3)**: Pending Accounts.
  - Scrollable list of minimalist cards representing closed cycles.
  - High-contrast typography for debt amounts.

### Visual Style
- **Typography**: `Geist` font (loaded in root). Use `tabular-nums` for all kilometers and currency.
- **Colors**: Neutral base (White/Black) with Emerald accents for positive actions/amounts.
- **Motion**: Subtle `fade-in` and `slide-up` animations for new records and cycle movements.

## Edge Cases & Error Handling
- **Odometer Rollover**: The 1000km reset logic must persist.
- **No Trips**: Cannot close a cycle with 0 total KM.
- **Single Driver**: If only one person drove in a cycle, the debt is 0.

## Transition to Implementation
- Refactor `car-sharing.repository.ts` to use the new collection and document structure.
- Update `actions.ts` to handle cycle creation and closure.
- Update `CarSharingDashboard.tsx` to implement the dual-column layout.
