# Kilo — Agent Guide

## Stack

**Framework:** Next.js 16 (App Router), React 19, TypeScript 5.9  
**Styling:** Tailwind CSS v4 (`@import "tailwindcss"` — no tailwind.config.ts), `tw-animate-css`, shadcn/ui (new-york style)  
**State:** TanStack Query v5 (5min staleTime, 1 retry, no refetchOnWindowFocus)  
**Database & Auth:** Firebase Auth (client) + Firebase Admin SDK (server) via session cookies  
**Forms:** React Hook Form + Zod (`src/lib/validations/`)  
**Charts:** Recharts  
**UI:** Radix UI, Lucide icons, sonner toasts, next-themes (dark mode via CSS variables)

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on `localhost:3000` |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint (flat config, `eslint.config.mjs`) |

No typecheck script — run `npx tsc --noEmit` manually if needed.  
No test framework configured.

## Architecture

```
src/
  app/            → Next.js App Router (pages + API route handlers)
  features/       → Feature modules (accounts, budgets, transactions, dashboard, etc.)
  components/     → Shared UI (layout/, ui/ for shadcn)
  lib/            → Firebase init, env, utils, config, Zod schemas
  repositories/   → Firestore data access layer
  services/       → Business logic (calls repositories)
  types/          → TypeScript types + presentation constants
  providers/      → QueryProvider (TanStack)
  hooks/          → useAuth, use-mobile
```

Path alias: `@/*` → `src/*`

## Key Patterns

- **API routes** read `userId` via `getUserId()` from `src/lib/auth.server.ts` — returns null if no valid session cookie. Every handler guards with `if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })`.
- **Services** validate ownership (e.g. `findById` checks `user_id`) and enforce business rules (e.g. max 10 accounts).
- **Repositories** use `FieldValue.serverTimestamp()` for `createdAt`/`updatedAt`.
- **Validation**: Zod schemas in `src/lib/validations/` — use `.safeParse()` in API routes, infer types with `z.infer`.
- **Auth flow**: Firebase client SDK → POST `/api/auth/session` with idToken → Firebase Admin creates session cookie → middleware checks cookie.
- **Middleware** (`middleware.ts`): Redirects unauthenticated users to `/login`, authenticated users away from `/login`/`/register`/`/`, public features (`/gasolina`, `/car-sharing`) bypass auth.

## Scripts (one-shot)

Run with `npx tsx scripts/<name>.ts`. Requires `.env` loaded (uses `dotenv`). Used for Firestore data migrations.

## Notable

- Exchange rates hardcoded in `src/lib/config/exchange-rates.ts` (1 USD = 6.96 BOB)
- AI insights feature (`src/lib/insights/ai-narrator.ts`) calls configurable AI API via `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` env vars — graceful fallback if no key set
- No Supabase in use despite `supabase-schema.sql` — everything runs on Firebase Firestore
- ESLint flat config ignores `.next`, `out`, `build`, `next-env.d.ts`
- `.env` tracked in git (contains dev Firebase + OpenRouter keys)
- `.agent/`, `.agents/`, `skills-lock.json` are gitignored
