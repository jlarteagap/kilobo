# Car Maintenance Tracking Design

## 1. Overview
The goal is to add a maintenance tracking system to the existing `/gasolina` page to log specific vehicle upkeep expenses and predict future maintenance needs based on odometer readings.

## 2. Core Features
- **Absolute Odometer Tracking**: The main trip system only uses a 3-digit odometer (0-999). This system introduces an "Absolute Odometer" (e.g., 145,250 km) that automatically increments behind the scenes by accumulating `totalKm` from every new trip logged in the `gasolina` system.
- **Maintenance Categories**:
  - **Aceite (Oil Change)**: Target interval is every 10,000 km.
  - **Inyectores (Injector Cleaning)**: Target interval is every 4,000 km.
  - **Lavado (Car Wash)**: No interval limit, tracked purely for historical and cost purposes.
- **Widgets**: A new row of 3 widgets at the top of the `/gasolina` page, showing visual progress bars for Oil and Injectors based on the Absolute Odometer, and a days-since counter for Car Wash.
- **History Modal**: Clicking a widget opens a dialog to register a new maintenance event and view the history of past events for that specific category.

## 3. Data Model (Firebase Firestore)
We will introduce two new models:

**1. `car_config` (Collection)**
Stores global configuration, specifically the absolute odometer.
- `id`: `main_config`
- `absoluteOdometer`: `number` (The running total of the vehicle's mileage).

**2. `car_maintenance_logs` (Collection)**
Stores the historical logs of maintenance.
- `id`: `string`
- `type`: `'oil' | 'injectors' | 'wash'`
- `cost`: `number`
- `odometer`: `number` (The absolute odometer reading at the time of maintenance).
- `date`: `number` (Timestamp).

## 4. Business Logic
- **Initialization**: If `absoluteOdometer` is missing or 0, the UI will prompt the user to input the current full odometer reading.
- **Trip Integration**: In `addTripAction` and `updateTripAction`, the system will calculate the delta (`totalKm`) and add it to the `absoluteOdometer` in the `car_config` collection.
- **Progress Calculation**: 
  - `remainingOilKm = (lastOilLog.odometer + 10000) - currentAbsoluteOdometer`
  - `remainingInjectorsKm = (lastInjectorsLog.odometer + 4000) - currentAbsoluteOdometer`

## 5. UI Components
- **`MaintenanceWidgets`**: A component displaying the three cards. Uses a responsive grid. Renders visual progress bars for intervals.
- **`MaintenanceModal`**: A generic modal for registering a new log (Input: Cost. Odometer is auto-filled) and listing the historical table.

## 6. Testing & Validation
- Ensure adding a trip correctly increments the absolute odometer.
- Ensure deleting/editing a trip adjusts the absolute odometer proportionally.
- Validate that the progress bars correctly calculate percentages and change colors (green > yellow > red) as they approach 100%.
