# Accounts & Investments Redesign — Design Spec

**Date:** 2026-09-10  
**Status:** Approved by user  
**Scope:** Accounts page, Investments page, Activities sidebar, forms, data model

---

## 1. Design Language: Full Minimal·Zinc Migration

All accounts/investments UI migrates from the Sage design system to Minimal·Zinc (§11 of DESIGN-MANUAL.md).

### Token Mapping

| Element | Sage (current) | Zinc (new) |
|---------|---------------|------------|
| Card shell | `bg-white rounded-[22px]` + box-shadow | `bg-white rounded-[22px] border border-zinc-200` |
| Card header bg | `bg-[#F2F9E3]/40` | `bg-zinc-50/80 border-b border-zinc-100` |
| Inputs | `bg-[#F2F9E3]/40 border-0` | `bg-white border border-zinc-200 rounded-xl` |
| Primary accent | `#4F6A35` / `#5F7D42` | `zinc-900` for actions |
| Positive values | `#4F6A35` | `#059669` (emerald-600) |
| Negative values | `#B5543D` | `zinc-800` |
| Tabs bg | `bg-[#F2F9E3]` | `bg-zinc-100` |
| Tab active | `bg-white` | `bg-white border border-zinc-200 shadow-sm` |
| Buttons primary | `bg-[#4F6A35]` | `bg-zinc-900 hover:bg-zinc-800` |
| Empty state bg | `bg-[#F2F9E3]` | `bg-zinc-100` |
| Empty state dot | `bg-zinc-300` | `bg-zinc-300` (same) |
| Hover rows | `hover:bg-indigo-50/30` | `hover:bg-zinc-50` |
| Secondary text | `#6E6E73` | `zinc-500` |
| Labels | `text-foreground` | `text-zinc-900` |

### Border Radius
- Cards: `rounded-[22px]` symmetric
- Inputs/small cards: `rounded-xl`
- Buttons: `rounded-lg` primary, `rounded-xl` cancel
- Dialogs: `rounded-[22px]`

### Typography
- Card title: `text-[13px] font-semibold text-zinc-900 tracking-tight`
- Section title: `text-2xl font-bold text-zinc-900 tracking-tight`
- Labels: `text-[13px] font-medium text-zinc-900`
- Values: `text-[14px] font-bold text-zinc-900 tabular-nums`
- Secondary: `text-xs text-zinc-500`
- Helper: `text-[11px] text-zinc-400`
- All monetary values: `tabular-nums` mandatory

---

## 2. Accounts Page Layout

**Structure:** 12-col grid, 8 + 4 (unchanged). Tab bar zinc style. Overview card white/zinc. Account cards 2-col, zinc borders, no shadow. Sort chips already zinc — keep. Empty states zinc-100.

---

## 3. Activities Sidebar

Cards `border-zinc-200 rounded-xl`, emoji bg `${color}12`, name `text-sm font-semibold text-zinc-900`, desc `text-xs text-zinc-500`. Dialog `rounded-[22px] border-zinc-200`. Empty state zinc.

---

## 4. Account Form

Type selector: selected `bg-zinc-900 text-white`, unselected `bg-zinc-50 border-zinc-200`. Inputs white/zinc-200. Submit `bg-zinc-900`. Title `text-2xl font-bold text-zinc-900`.

---

## 5. Activities Form

Emoji chips selected `bg-zinc-900`, unselected `bg-zinc-50`. Color rings `ring-zinc-900`. Preview `bg-zinc-50 border-zinc-200`. Subtype chips `bg-zinc-900`. Submit `bg-zinc-900`.

---

## 6. Investment Data Model Simplification

### Remove from Investment type
- `units?: number | null`
- `unit_price?: number | null`

### New Investment interface
```ts
interface Investment {
  id: string
  user_id: string
  account_id: string
  name: string
  amount: number
  currency: string
  date: string
  notes?: string | null
  recurrence?: InvestmentRecurrence | null
  created_at: Date
  updated_at: Date
}
```

### Remove from InvestmentTransaction type
- `units: number`
- `unit_price: number`
- Rename `total_amount` → `amount`

### New InvestmentTransaction interface
```ts
interface InvestmentTransaction {
  id: string
  investment_id: string
  user_id: string
  type: InvestmentTxType
  amount: number
  currency: string
  date: string
  notes?: string | null
  created_at: Date
  updated_at: Date
}
```

### Backward Compatibility
- Old Firestore docs with `units`/`unit_price` still render; frontend just doesn't display those fields
- API routes accept old fields as optional, ignore them
- No Firestore migration needed

### recalculatePosition() Simplification
```ts
async recalculatePosition(investmentId, userId) {
  const txs = await this.transactionRepo.findAll(investmentId, userId)
  const totalBought = txs.filter(t => t.type === 'BUY').reduce((s, t) => s + t.amount, 0)
  const totalSold = txs.filter(t => t.type === 'SELL').reduce((s, t) => s + t.amount, 0)
  const netAmount = totalBought - totalSold
  await this.repository.update(investmentId, { amount: netAmount }, userId)
}
```

---

## 7. New Investment Form — Simplified (5 fields)

| Field | Type | Component | Notes |
|-------|------|-----------|-------|
| `name` | string | `<Input>` | Placeholder: "Apple, BTC, Fondo..." |
| `account_id` | string | `<Select>` | Account name + currency |
| `amount` | number | `<Input type="number">` | "Cuanto invertiste" |
| `date` | string | `<Input type="date">` | Defaults today |
| `currency` | string | `<Select>` | Inherits from account, can override |

### Auto-Detect Logic
1. User types name + selects account
2. Check existing investment `(name, account_id, user_id)`
3. If exists → hint: `"Ya tienes '[name]' en esta cuenta. Se agregara una compra a la posicion existente."` styled `text-[11px] text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200`
4. On submit → service dedups: existing → creates BUY tx on it; new → creates investment with initial BUY tx

### Zod Schema Update
```ts
export const createInvestmentSchema = z.object({
  account_id: z.string().min(1, "Selecciona una cuenta"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  currency: z.string().optional(),
  date: z.string().min(1, "Selecciona una fecha"),
  notes: z.string().nullable().optional(),
  // REMOVED: units, unit_price, transaction_id
})

export const buyInvestmentSchema = z.object({
  investment_id: z.string().min(1),
  account_id: z.string().min(1),
  amount: z.coerce.number().positive(),
  currency: z.string().min(1),
  date: z.string().min(1),
  notes: z.string().nullable().optional(),
  // REMOVED: units, unit_price
})
```

---

## 8. Buy/Sell Form — Simplified (3 fields)

| Field | Type | Component | Notes |
|-------|------|-----------|-------|
| `amount` | number | `<Input type="number">` | "Cuanto compraste/vendiste" |
| `date` | string | `<Input type="date">` | Defaults today |
| `notes` | string | `<Textarea>` | Optional |

Shows investment name + current total invested. Sells show available amount. Total summary in `bg-zinc-50 rounded-xl border-zinc-200`.

---

## 9. Investments Page Redesign

- Header: zinc title + zinc button
- Account groups: `bg-white rounded-[22px] border-zinc-200`, header `bg-zinc-50/80`
- Rows: `hover:bg-zinc-50`, icon `bg-zinc-100 text-zinc-600`, amount zinc-900
- Buy icon hover emerald, sell/delete hover red
- Tx history: "COMPRA · Bs 150 · 12 sep. 2026" (no units × price), border `border-l-2 border-zinc-200`
- Upcoming purchases: zinc header, due `text-red-500`, confirm `bg-zinc-900`
- Empty state: zinc-100 container
- **Recurring plan**: moves out of edit dialog → separate action per investment row (small dialog/dropdown). Fields: day of week + amount

---

## 10. Files to Modify

### Types
- `src/types/investment.ts`

### Validation Schemas
- `src/lib/validations/investment.schema.ts`

### Services
- `src/services/investments.service.ts` — name-based dedup in `create()`, simplify `recalculatePosition()`, update `buy()`/`sell()`

### Repositories
- `src/repositories/investments.repository.ts` — remove units/unit_price, simplify position calc

### Features — Accounts
- `src/features/accounts/AccountsList.tsx`
- `src/features/accounts/AccountForm.tsx`

### Features — Investments
- `src/features/investments/InvestmentForm.tsx`
- `src/features/investments/InvestmentTxForm.tsx`
- `src/features/investments/InvestmentsList.tsx`
- `src/features/investments/ConfirmRecurringBuyDialog.tsx`

### Features — Projects
- `src/features/projects/ProjectsList.tsx`
- `src/features/projects/ProjectForm.tsx`

### Page
- `src/app/accounts/page.tsx`

### API Routes
- `src/app/api/investments/route.ts`
- `src/app/api/investments/[id]/transactions/route.ts`

---

## 11. Verification

1. `npm run lint`
2. `npx tsc --noEmit`
3. Manual: create investment → auto-detect → buy more → check position
4. Verify old docs with units/price still render