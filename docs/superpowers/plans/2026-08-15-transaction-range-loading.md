# Transaction Range Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fetch only the transaction date ranges needed by each view, cache those ranges independently, and keep every affected cached range accurate after a mutation.

**Architecture:** The route parses a mandatory, validated inclusive date range and delegates a bounded query to Firestore using a normalized date-only field. Client hooks resolve UI periods to `YYYY-MM-DD` ranges and use those bounds in their TanStack Query keys. Consumers request explicit current, previous, or 60-day ranges; mutations update every already-cached range containing the original or returned transaction.

**Tech Stack:** Next.js 16 route handlers, TypeScript 5.9, Firebase Admin Firestore, TanStack Query v5, date-fns 4, Node test runner via `tsx`.

**Spec:** `docs/superpowers/specs/2026-08-15-transaction-monthly-fetch-design.md`

## Global Constraints

- `GET /api/transactions` requires both `from` and `to` as valid inclusive `YYYY-MM-DD` values; missing, partial, invalid, and inverted ranges return `400`.
- Query by `user_id` and a normalized `transaction_date` date-only string, ordered descending by that field; create the Firestore composite index required by that query before rollout.
- Do not retain a client fallback that fetches the complete transaction history.
- Preserve the existing `{ data }` API response wrapper and unauthorized response behavior.
- Use a separate cached query for comparison periods; do not infer previous-period metrics from the current range.
- The balance projection must request exactly today minus 60 days through today.
- Cache updates must retain descending transaction-date order and must roll back every changed query entry on request failure.

---

## File structure

- `src/lib/transactions/date-range.ts` — validates request query bounds, serializes `DateRange` values, and determines whether a transaction is inside a cached range.
- `src/repositories/transactions.repository.ts` — persists `transaction_date` and queries Firestore by a bounded range.
- `src/services/transactions.service.ts` — exposes the bounded transaction read to route handlers.
- `src/app/api/transactions/route.ts` — parses `NextRequest` search parameters and returns range validation errors.
- `src/features/transactions/hooks/useTransactions.ts` — defines date-range query keys, range-aware fetching, and range-aware optimistic cache updates.
- `src/app/transactions/page.tsx` and `src/features/transactions/hooks/useTransactionMetrics.ts` — fetch the active and comparison periods separately.
- `src/features/dashboard/hooks/useDashboard.ts`, `src/features/dashboard/hooks/useFinancialMetrics.ts`, `src/features/dashboard/hooks/useBalanceProjection.ts`, `src/features/budgets/hooks/useBudgets.ts`, and `src/features/dashboard/CashflowSection.tsx` — pass the exact ranges their calculations need.
- `src/lib/transactions/date-range.test.ts` — covers request/range boundaries without Firebase.
- `package.json` — adds the repeatable TypeScript test command.

### Task 1: Establish and test the date-range contract

**Files:**
- Create: `src/lib/transactions/date-range.ts`
- Create: `src/lib/transactions/date-range.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces `parseTransactionDateRange(searchParams: URLSearchParams): { from: string; to: string } | { error: string }`.
- Produces `toTransactionDateRange(period: Period): { from: string; to: string }`.
- Produces `isTransactionInRange(transaction: Pick<Transaction, 'date'>, range: TransactionDateRange): boolean`.

- [ ] **Step 1: Write the failing date-range tests**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { parseTransactionDateRange, toTransactionDateRange } from './date-range'

test('accepts inclusive ISO date bounds', () => {
  assert.deepEqual(
    parseTransactionDateRange(new URLSearchParams('from=2026-08-01&to=2026-08-31')),
    { from: '2026-08-01', to: '2026-08-31' },
  )
})

test('rejects missing, malformed, and inverted bounds', () => {
  for (const query of ['', 'from=2026-08-01', 'from=08-01-2026&to=2026-08-31', 'from=2026-08-31&to=2026-08-01']) {
    assert.ok('error' in parseTransactionDateRange(new URLSearchParams(query)))
  }
})

test('serializes a custom period without UTC shifting', () => {
  assert.deepEqual(toTransactionDateRange({ type: 'CUSTOM_RANGE', from: '2026-01-01', to: '2026-01-31' }), {
    from: '2026-01-01', to: '2026-01-31',
  })
})
```

- [ ] **Step 2: Add and run the test command to confirm it fails**

Add `"test": "tsx --test"` to `package.json`, then run:

```bash
npm test -- src/lib/transactions/date-range.test.ts
```

Expected: FAIL because `date-range.ts` does not exist.

- [ ] **Step 3: Implement date-only parsing and serialization**

```ts
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export type TransactionDateRange = { from: string; to: string }

export function parseTransactionDateRange(searchParams: URLSearchParams): TransactionDateRange | { error: string } {
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  if (!from || !to || !DATE_ONLY.test(from) || !DATE_ONLY.test(to) || from > to) {
    return { error: 'El rango de fechas debe incluir from y to válidos en formato YYYY-MM-DD.' }
  }
  return { from, to }
}

export function toTransactionDateRange(period: Period): TransactionDateRange {
  const { from, to } = resolvePeriod(period)
  return { from: getLocalDateString(from), to: getLocalDateString(to) }
}
```

Also implement `isTransactionInRange` with `transaction.date.slice(0, 10) >= from && transaction.date.slice(0, 10) <= to` so legacy ISO values are compared as dates, not timestamps.

- [ ] **Step 4: Run the focused tests and static checks**

```bash
npm test -- src/lib/transactions/date-range.test.ts
npx tsc --noEmit
```

Expected: both commands exit `0`.

- [ ] **Step 5: Commit the contract**

```bash
git add package.json src/lib/transactions/date-range.ts src/lib/transactions/date-range.test.ts
git commit -m "feat(transactions): add bounded date range contract"
```

### Task 2: Enforce bounded Firestore reads and normalized storage

**Files:**
- Modify: `src/repositories/transactions.repository.ts:49-82`
- Modify: `src/services/transactions.service.ts:28-31`
- Modify: `src/app/api/transactions/route.ts:6-20`

**Interfaces:**
- Consumes `TransactionDateRange` from Task 1.
- Produces `transactionsRepository.findByDateRange(userId: string, range: TransactionDateRange): Promise<Transaction[]>`.
- Produces `transactionService.getTransactions(userId: string, range: TransactionDateRange): Promise<Transaction[]>`.

- [ ] **Step 1: Write a failing repository-facing test seam**

Extract the query construction into an exported pure helper and test it before touching Firebase:

```ts
test('builds the three bounded Firestore constraints', () => {
  assert.deepEqual(transactionRangeConstraints('uid-1', { from: '2026-08-01', to: '2026-08-31' }), [
    ['user_id', '==', 'uid-1'],
    ['transaction_date', '>=', '2026-08-01'],
    ['transaction_date', '<=', '2026-08-31'],
    ['transaction_date', 'desc'],
  ])
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

```bash
npm test -- src/lib/transactions/date-range.test.ts
```

Expected: FAIL because `transactionRangeConstraints` has not been exported.

- [ ] **Step 3: Persist and query `transaction_date`**

In `buildPayload`, derive `transaction_date` as `data.date.slice(0, 10)`. In `update`, when `data.date` is present, set both `date` and `transaction_date`. Replace unbounded `findAll` for API reads with:

```ts
async findByDateRange(userId: string, range: TransactionDateRange): Promise<Transaction[]> {
  const snapshot = await transactionsCollection
    .where('user_id', '==', userId)
    .where('transaction_date', '>=', range.from)
    .where('transaction_date', '<=', range.to)
    .orderBy('transaction_date', 'desc')
    .get()
  return snapshot.docs.map((doc) => mapTransaction(doc.id, doc.data()))
}
```

Keep `findAll` only for server-side insights until that feature receives its own bounded aggregation design; do not expose it through `/api/transactions`.

Change the route signature to `GET(req: NextRequest)`, call `parseTransactionDateRange(req.nextUrl.searchParams)`, return `400` for an error, then pass the range to the service. Create the required Firestore composite index `(user_id ASC, transaction_date ASC)` through the project’s existing Firebase deployment workflow before shipping.

- [ ] **Step 4: Run validation checks**

```bash
npm test -- src/lib/transactions/date-range.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all exit `0`; manually call `/api/transactions?from=2026-08-01&to=2026-08-31` with an authenticated session and confirm no response has `date` outside the bounds.

- [ ] **Step 5: Commit the server boundary**

```bash
git add src/repositories/transactions.repository.ts src/services/transactions.service.ts src/app/api/transactions/route.ts src/lib/transactions/date-range.test.ts
git commit -m "feat(transactions): query Firestore by date range"
```

### Task 3: Make transaction queries and mutations range-aware

**Files:**
- Modify: `src/features/transactions/hooks/useTransactions.ts:13-143`

**Interfaces:**
- Consumes `TransactionDateRange`, `toTransactionDateRange`, and `isTransactionInRange` from Task 1.
- Produces `useTransactions(period: Period)` and `useTransactionsRange(range: TransactionDateRange)`.
- Produces `useUpdateTransaction()` accepting `{ transaction: Transaction; data: EditableTransactionFields }`.

- [ ] **Step 1: Add failing cache helper tests**

Move the cache entry update into exported pure helpers and add tests that prove insertion stays sorted and a moved transaction leaves its source range:

```ts
test('upserts only ranges containing the returned transaction and orders newest first', () => {
  const range = { from: '2026-08-01', to: '2026-08-31' }
  assert.deepEqual(
    upsertRangeTransactions([{ id: 'old', date: '2026-08-02' }], { id: 'new', date: '2026-08-20' }, range),
    [{ id: 'new', date: '2026-08-20' }, { id: 'old', date: '2026-08-02' }],
  )
})
```

Use `node:assert/strict` rather than introducing a second test framework.

- [ ] **Step 2: Run the focused tests to verify they fail**

```bash
npm test -- src/features/transactions/hooks/useTransactions.test.ts
```

Expected: FAIL because the cache helpers do not exist.

- [ ] **Step 3: Implement keyed fetching and exact cache updates**

Use a range key, URL, and hook shape:

```ts
lists: (range: TransactionDateRange) => [...transactionKeys.all, 'list', range.from, range.to] as const

export function useTransactions(period: Period) {
  return useTransactionsRange(toTransactionDateRange(period))
}

export function useTransactionsRange(range: TransactionDateRange) {
  return useQuery({
    queryKey: transactionKeys.lists(range),
    queryFn: () => fetchTransactions(range),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
  })
}
```

For each mutation, inspect cached queries with `queryClient.getQueriesData<Transaction[]>({ queryKey: transactionKeys.listsPrefix() })`. Snapshot every `[queryKey, data]` pair before changing it. Create inserts the server-returned transaction into matching cached ranges; update removes the original then upserts the server return; delete removes the original. On error, restore every snapshot with `setQueryData(queryKey, data)`. On success, invalidate `accountKeys.lists()` only; do not invalidate transaction list queries.

- [ ] **Step 4: Update mutation callers and run checks**

Change `TransactionEditForm` to call `mutate({ transaction, data })`; ensure delete callers already pass the full transaction. Run:

```bash
npm test -- src/features/transactions/hooks/useTransactions.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all exit `0`.

- [ ] **Step 5: Commit cache behavior**

```bash
git add src/features/transactions/hooks/useTransactions.ts src/features/transactions/hooks/useTransactions.test.ts src/features/transactions/TransactionEditForm.tsx
git commit -m "perf(transactions): cache and update date ranges"
```

### Task 4: Migrate the transaction page and comparisons

**Files:**
- Modify: `src/app/transactions/page.tsx:48-80`
- Modify: `src/features/transactions/hooks/useTransactionMetrics.ts:29-126`

**Interfaces:**
- Consumes `useTransactions(period)` and `getPreviousPeriod(period)`.
- Changes metrics signature to `useTransactionMetrics(currentTransactions: Transaction[], previousTransactions: Transaction[], categories: Category[], period: Period): TransactionMetrics`.

- [ ] **Step 1: Write failing metrics tests for previous-period values**

Extract the calculation from the React hook as `calculateTransactionMetrics(current, previous, categories, period)` and add:

```ts
test('uses the separately fetched prior range for comparisons', () => {
  const result = calculateTransactionMetrics([], [{ id: 'p', type: 'INCOME', amount: 50, currency: 'BOB', status: 'COMPLETED', date: '2026-07-31' } as Transaction], [], { type: 'THIS_MONTH' })
  assert.equal(result.prevIncome, 50)
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- src/features/transactions/hooks/useTransactionMetrics.test.ts
```

Expected: FAIL because the calculator has only one transaction input.

- [ ] **Step 3: Fetch both required ranges and remove redundant local period filters**

In the page, initialize filters before queries, then request:

```ts
const currentQuery = useTransactions(filters.period)
const previousQuery = useTransactions(getPreviousPeriod(filters.period))
```

Pass `currentQuery.data ?? []` to `useTransactionFilters`; pass it and `previousQuery.data ?? []` to the metrics hook. Treat the page analytics as loading until both queries finish. Inside metrics, treat `currentTransactions` and `previousTransactions` as already bounded; retain only status/type/project filtering needed for the displayed calculation.

- [ ] **Step 4: Run checks and manually verify navigation**

```bash
npm test -- src/features/transactions/hooks/useTransactionMetrics.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all exit `0`. In browser devtools, opening the page makes two bounded requests (active and previous); changing to a previously visited period makes no new request while fresh.

- [ ] **Step 5: Commit the page migration**

```bash
git add src/app/transactions/page.tsx src/features/transactions/hooks/useTransactionMetrics.ts src/features/transactions/hooks/useTransactionMetrics.test.ts
git commit -m "perf(transactions): fetch comparison periods on demand"
```

### Task 5: Migrate dashboard, budgets, cash flow, and projection consumers

**Files:**
- Modify: `src/features/dashboard/hooks/useDashboard.ts:10-22`
- Modify: `src/features/dashboard/hooks/useFinancialMetrics.ts:12-205`
- Modify: `src/features/dashboard/hooks/useBalanceProjection.ts:7-19`
- Modify: `src/features/budgets/hooks/useBudgets.ts:130-140`
- Modify: `src/features/dashboard/CashflowSection.tsx:173-188`

**Interfaces:**
- Consumes `useTransactions(period)` and `useTransactionsRange({ from, to })` from Task 3.
- Changes `useFinancialMetrics` input to `{ currentTransactions, previousTransactions, debts, budgetProgress }`.

- [ ] **Step 1: Write failing range-selection tests**

Add tests around exported helpers asserting that dashboard/budgets request `THIS_MONTH`, cash flow requests its selected period, and projection requests 60 calendar days ending today:

```ts
test('projection range includes exactly the 60-day learning window through today', () => {
  assert.deepEqual(getProjectionTransactionRange(new Date(2026, 7, 15)), {
    from: '2026-06-16', to: '2026-08-15',
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test -- src/features/dashboard/hooks/transaction-ranges.test.ts
```

Expected: FAIL because the range helpers and range-aware consumers are absent.

- [ ] **Step 3: Wire every consumer to its smallest valid range**

Use `{ type: 'THIS_MONTH' }` for active budget progress and dashboard current transactions; fetch `{ type: 'LAST_MONTH' }` independently for dashboard comparisons and pass the two arrays to `useFinancialMetrics`. Use `useTransactions(period)` in `CashflowSection`. Implement and use:

```ts
export function getProjectionTransactionRange(now = new Date()): TransactionDateRange {
  return {
    from: getLocalDateString(subDays(now, 60)),
    to: getLocalDateString(now),
  }
}
```

Call `useTransactionsRange(getProjectionTransactionRange())` in `useBalanceProjection`. Update loading states to include every range their rendered calculation depends on. In `useFinancialMetrics`, use the current array for current totals/charts/recent items and the previous array only for comparison totals and historical series.

- [ ] **Step 4: Run the full verification suite**

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all exit `0`. Manually verify the dashboard, budgets, cash-flow period selector, and balance projection load without a bare `/api/transactions` request.

- [ ] **Step 5: Commit consumer migration**

```bash
git add src/features/dashboard/hooks/useDashboard.ts src/features/dashboard/hooks/useFinancialMetrics.ts src/features/dashboard/hooks/useBalanceProjection.ts src/features/budgets/hooks/useBudgets.ts src/features/dashboard/CashflowSection.tsx src/features/dashboard/hooks/transaction-ranges.test.ts
git commit -m "perf(dashboard): load only required transaction ranges"
```

## Self-review

- Spec coverage: Task 1 validates exact bounds; Task 2 enforces them in Firestore and normalizes storage; Task 3 creates per-range caching and mutation rollbacks; Task 4 preserves transaction-page comparisons; Task 5 migrates all identified consumers and preserves the 60-day projection window.
- Placeholder scan: no `TODO`, `TBD`, generic error-handling instruction, or implicit test step remains.
- Type consistency: `TransactionDateRange` is introduced in Task 1 and consumed consistently by repository, service, route, query keys, cache helpers, and range-aware hooks.
