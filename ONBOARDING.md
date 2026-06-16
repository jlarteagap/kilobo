# Kilo — Guía de Onboarding

> **Propósito:** Que cualquier desarrollador pueda retomar este proyecto después de meses sin tocarlo y estar productivo en minutos.

---

## 📋 Tabla de Contenidos

1. [¿Qué es Kilo?](#-qué-es-kilo)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Setup Inicial](#-setup-inicial)
4. [Variables de Entorno](#-variables-de-entorno)
5. [Arquitectura](#-arquitectura)
6. [Base de Datos (Firestore)](#-base-de-datos-firestore)
7. [Flujo de Autenticación](#-flujo-de-autenticación)
8. [Patrones y Convenciones](#-patrones-y-convenciones)
9. [Módulos / Features](#-módulos--features)
10. [API Routes](#-api-routes)
11. [Scripts](#-scripts)
12. [Despliegue](#-despliegue)
13. [Depuración y Solución de Problemas](#-depuración-y-solución-de-problemas)
14. [Roadmap / Próximos Pasos](#-roadmap--próximos-pasos)

---

## 🧭 ¿Qué es Kilo?

Kilo es una aplicación web de **gestión de finanzas personales** diseñada para dar una visión clara del patrimonio neto del usuario. Está enfocada en el mercado boliviano con soporte multimoneda (BOB/USD).

### Funcionalidades principales

| Funcionalidad | Descripción |
|---|---|
| **Dashboard** | Resumen visual del patrimonio, ingresos vs gastos, salud financiera |
| **Cuentas** | Gestión de cuentas bancarias, efectivo, cripto, billeteras digitales |
| **Transacciones** | Registro de ingresos, gastos, transferencias con categorización |
| **Presupuestos** | Presupuestos mensuales por categoría con seguimiento de progreso |
| **Categorías** | Categorización de gastos/ingresos con colores, iconos y tags |
| **Créditos** | Seguimiento de créditos con tabla de amortización francesa |
| **Deudas** | Deudas personales (presté / me prestaron) con pagos parciales |
| **Metas de Ahorro** | Objetivos de ahorro con progreso visual |
| **Proyectos/Actividades** | Agrupación de transacciones por actividad (ej: auto, freelance) |
| **Insights + IA** | Análisis de gastos con anomalías, salud financiera y narrativa IA |
| **Gasolina** | Control de combustible, viajes y mantenimiento de vehículos |
| **Car Sharing** | Gastos compartidos de vehículo entre usuarios |
| **Landing Page** | Página de inicio "Quiet Wealth" en `/` |

---

## 🏗 Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **Lenguaje** | TypeScript | 5.9 |
| **React** | React | 19.2.3 |
| **Estilos** | Tailwind CSS v4 + `tw-animate-css` | v4 |
| **UI Components** | shadcn/ui (new-york style) + Radix UI | — |
| **Estado/Datos** | TanStack Query v5 | 5.90 |
| **Base de datos** | Firebase Firestore (Admin SDK server-side) | — |
| **Autenticación** | Firebase Auth (cliente) + Firebase Admin SDK (server) | — |
| **Formularios** | React Hook Form + Zod | 7.71 / 4.3 |
| **Gráficos** | Recharts | 2.15 |
| **Iconos** | Lucide React | 0.563 |
| **Notificaciones** | sonner | 2.0 |
| **Tema oscuro** | next-themes | 0.4 |

### Archivos de configuración clave

| Archivo | Propósito |
|---|---|
| `next.config.ts` | Configuración de Next.js (actualmente minimalista) |
| `tsconfig.json` | TypeScript config: `strict`, path alias `@/*` |
| `components.json` | Configuración de shadcn/ui |
| `eslint.config.mjs` | ESLint flat config |
| `postcss.config.mjs` | PostCSS con Tailwind |
| `middleware.ts` | Middleware de autenticación y redirección |
| `firestore.indexes.json` | Índices compuestos de Firestore |

---

## ⚙️ Setup Inicial

### Prerrequisitos

- **Node.js** >= 20 (usar la versión del `.nvmrc` si existe)
- **npm** (viene con Node.js)
- Una cuenta de **Firebase** con proyecto activo

### Pasos

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd kilo

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000

# 4. (Opcional) Build de producción
npm run build
npm run start
```

### Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo en `localhost:3000` |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run lint` | ESLint (configuración flat) |
| `npx tsc --noEmit` | Type-check manual (no hay script dedicado) |
| `npx tsx scripts/<name>.ts` | Ejecutar scripts one-shot |

> **⚠️ Nota:** No hay test framework configurado. No hay script de type-check en `package.json`.

---

## 🔐 Variables de Entorno

El archivo `.env` está **versionado en git** (contiene claves de desarrollo de Firebase y OpenRouter).

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key pública de Firebase (cliente) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain de Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID de Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID para FCM |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID de Firebase |
| `FIREBASE_CLIENT_EMAIL` | Client email de service account (Admin SDK) |
| `FIREBASE_PRIVATE_KEY` | Private key de service account (Admin SDK) |
| `AI_BASE_URL` | URL base de API de IA (OpenRouter u otra) |
| `AI_API_KEY` | API key para el servicio de IA |
| `AI_MODEL` | Modelo de IA a usar (ej: `openrouter/free`) |

> La configuración de IA tiene **fallback graceful**: si no hay `AI_API_KEY`, el módulo de insights salta la generación IA sin romper la app.

### Firebase Admin SDK

Las variables `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` se usan en `src/lib/firebase.admin.ts`. El `FIREBASE_PRIVATE_KEY` debe tener los `\n` escapados (el código los reemplaza automáticamente).

---

## 🏛 Arquitectura

### Estructura del proyecto

```
kilo/
├── src/
│   ├── app/                 # App Router: páginas + API routes
│   │   ├── (page)/layout.tsx # Layout de cada página
│   │   ├── api/             # API Route Handlers (REST)
│   │   │   ├── auth/session/ # Login/logout con cookies
│   │   │   ├── accounts/    # CRUD cuentas
│   │   │   ├── transactions/ # CRUD transacciones
│   │   │   ├── budgets/     # CRUD presupuestos
│   │   │   ├── categories/  # CRUD categorías
│   │   │   ├── credits/     # CRUD créditos + pago cuotas
│   │   │   ├── debts/       # CRUD deudas
│   │   │   ├── savings-goals/ # CRUD metas de ahorro
│   │   │   ├── projects/    # CRUD proyectos/actividades
│   │   │   └── insights/    # Insights financieros + IA
│   │   ├── dashboard/       # Panel principal
│   │   ├── accounts/        # Gestión de cuentas
│   │   ├── transactions/    # Transacciones con filtros
│   │   ├── budgets/         # Presupuestos
│   │   ├── categories/      # Categorías
│   │   ├── credits/         # Créditos
│   │   ├── debts/           # Deudas personales
│   │   ├── ahorros/         # Metas de ahorro
│   │   ├── insights/        # Insights financieros
│   │   ├── gasolina/        # Control de combustible
│   │   ├── car-sharing/     # Gastos compartidos
│   │   └── login/           # Página de login
│   ├── components/          # Componentes compartidos
│   │   ├── layout/          # AppLayout, Sidebar, Header, QuickActionMenu
│   │   └── ui/              # shadcn/ui components (33 componentes)
│   ├── features/            # Módulos de funcionalidad
│   │   ├── accounts/        # AccountsList, AccountForm, CreateAccountForm
│   │   ├── transactions/    # TransactionForm, TransactionList, filtros, analytics
│   │   ├── budgets/         # BudgetForm, BudgetsList, BudgetSummary
│   │   ├── categories/      # CategoriesList, CategoryForm
│   │   ├── credits/         # CreditForm, CreditDetail, amortization, pagos
│   │   ├── debts/           # DebtForm, DebtsList, DebtPaymentForm
│   │   ├── savings-goals/   # SavingsGoalForm, SavingsGoalsList
│   │   ├── projects/        # ProjectForm, ProjectsList
│   │   ├── dashboard/       # Componentes de dashboard (cashflow, assets, etc.)
│   │   ├── insights/        # Componentes de insights (anomalías, salud, tips)
│   │   └── landing/         # Componentes de la landing page
│   ├── hooks/               # Hooks globales
│   │   ├── useAuth.tsx       # Contexto de autenticación (AuthProvider)
│   │   └── use-mobile.ts    # Detección de mobile
│   ├── lib/                 # Utilidades y configuraciones
│   │   ├── firebase.ts      # Inicialización Firebase cliente (Auth only)
│   │   ├── firebase.admin.ts # Inicialización Firebase Admin (server)
│   │   ├── auth.server.ts   # getUserId() — lee cookie de sesión
│   │   ├── api-utils.ts     # Manejo de errores en API routes
│   │   ├── utils.ts         # cn(), parseLocalDate(), startOfLocalDay()
│   │   ├── env.ts           # Validación de variables de entorno
│   │   ├── amortization.ts  # Cálculo de tabla de amortización francesa
│   │   ├── config/
│   │   │   └── exchange-rates.ts # Tasas de cambio (hardcoded: 1 USD = 6.96 BOB)
│   │   ├── validations/     # Schemas Zod
│   │   ├── insights/        # Algoritmos y IA para insights
│   │   └── forecast/        # Proyección de balance
│   ├── providers/           # Providers de React (QueryProvider)
│   ├── repositories/        # Capa de acceso a Firestore
│   ├── services/            # Lógica de negocio
│   └── types/               # Tipos TypeScript + constantes de presentación
├── scripts/                 # Scripts one-shot de migración
├── docs/                    # Documentación de diseño
│   └── superpowers/specs/   # Specs de funcionalidades
├── specs/                   # Especificaciones técnicas
├── .env                     # Variables de entorno (versionado)
├── middleware.ts            # Middleware de autenticación
├── CHANGELOG.md             # Changelog técnico
├── RELEASES.md              # Notas de release (usuario)
├── AGENTS.md                # Guía para agentes de IA
└── ONBOARDING.md            # Este archivo
```

### Flujo de datos (patrón general)

```
Página (app/) → Feature Component → Hook (TanStack Query) → API Route → Service → Repository → Firestore
                                                                  ↑              ↑            ↑
                                                              getUserId()   Validación     CRUD
                                                              + Zod parse   + reglas      + timestamps
                                                                              de negocio
```

### Capas

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| **Repository** | `src/repositories/` | CRUD directo a Firestore. NO tiene lógica de negocio. Usa `FieldValue.serverTimestamp()` para timestamps. |
| **Service** | `src/services/` | Lógica de negocio (validación de ownership, límites, reglas). Llama a repositories. |
| **API Route** | `src/app/api/` | Guardia `getUserId()`, parseo Zod, llama a service, responde JSON. |
| **Feature Component** | `src/features/` | Componentes de UI específicos del dominio. |
| **Hook** | `src/features/*/hooks/` | Hooks de TanStack Query (`useQuery`/`useMutation`) que llaman a las API routes. |
| **Type** | `src/types/` | Interfaces + constantes de presentación. Separación estricta tipos/presentación. |
| **Validation** | `src/lib/validations/` | Schemas Zod, types inferidos con `z.infer`. |

---

## 🗄 Base de Datos (Firestore)

### Colecciones

| Colección | Documento | Descripción |
|---|---|---|
| `accounts` | `{ user_id, name, type, balance, currency, createdAt, updatedAt }` | Cuentas financieras |
| `transactions` | `{ user_id, account_id, type, amount, currency, date, description, category_id, ... }` | Transacciones con soporte de proyectos y créditos |
| `categories` | `{ name, type, icon?, color?, tags[], parent_id? }` | Categorías de gasto/ingreso |
| `budgets` | `{ user_id, name, type, target_amount, currency, category_ids, is_active, ... }` | Presupuestos mensuales |
| `credits` | `{ user_id, type, institution, original_amount, annual_interest_rate, ... }` | Créditos institucionales |
| `installments` | `{ credit_id, number, due_date, total_amount, principal, interest, remaining_balance, status }` | Cuotas de créditos (subcolección) |
| `debts` | `{ user_id, type, contact_name, amount, paid_amount, currency, account_id, status }` | Deudas personales |
| `debt_payments` | `{ debt_id, amount, account_id, date, notes }` | Pagos de deudas (subcolección) |
| `savings_goals` | `{ user_id, name, target_amount, current_amount, currency, account_id, deadline, ... }` | Metas de ahorro |
| `projects` | `{ user_id, name, color, icon, status, subtypes[] }` | Proyectos/actividades |
| `insights_cache` | `{ user_id, payload, ai_insights, generated_at, expires_at }` | Cache de insights (24h) |
| `car_config` | `{ user_id, ... }` | Configuración de vehículo (gasolina) |
| `car_maintenance_logs` | `{ type, date, ... }` | Registros de mantenimiento |
| `car_sharing_cycles` | `{ ... }` | Ciclos de car-sharing |

### Relaciones clave

```
accounts.user_id → (user)
transactions.user_id → (user)
transactions.account_id → accounts.id
transactions.category_id → categories.id
transactions.project_id → projects.id
transactions.credit_id → credits.id
transactions.installment_id → installments.id
credits.user_id → (user)
installments.credit_id → credits.id
debts.user_id → (user)
debt_payments.debt_id → debts.id
budgets.user_id → (user)
savings_goals.user_id → (user)
savings_goals.account_id → accounts.id
projects.user_id → (user)
```

> **Nota:** No hay relaciones formales en Firestore (NoSQL). Las relaciones existen a nivel de aplicación mediante campos de referencia.

### Índices compuestos

Definidos en `firestore.indexes.json`:

- `budgets`: `[user_id ASC, created_at DESC]`
- `budgets`: `[is_active ASC, user_id ASC, created_at DESC]`
- `car_maintenance_logs`: `[type ASC, date DESC]`

---

## 🔐 Flujo de Autenticación

```
1. Usuario hace clic en "Iniciar sesión con Google"
2. Firebase Auth (cliente) abre popup de Google
3. onIdTokenChanged() detecta el nuevo usuario
4. useAuth.tsx obtiene el idToken y hace POST /api/auth/session
5. API route usa Firebase Admin SDK para crear session cookie (7 días)
6. Middleware (middleware.ts) lee la cookie en cada request:
   - Sin cookie + ruta privada → redirect /login
   - Con cookie + ruta pública → redirect /dashboard
7. API routes server-side: getUserId() verifica la cookie
```

### Archivos clave

| Archivo | Rol |
|---|---|
| `src/lib/firebase.ts` | Inicializa Firebase cliente (solo Auth + Google provider) |
| `src/lib/firebase.admin.ts` | Inicializa Admin SDK con service account |
| `src/lib/auth.server.ts` | `getUserId()` — extrae UID de la session cookie |
| `src/hooks/useAuth.tsx` | Contexto de auth en el cliente, maneja idToken → cookie |
| `src/app/api/auth/session/route.ts` | POST (crear cookie) y DELETE (eliminar cookie) |
| `middleware.ts` | Redirecciones basadas en cookie de sesión |

### Rutas públicas (sin auth)

- `/login`, `/register`, `/` (landing page)
- `/gasolina/*` y `/car-sharing/*` (features públicas)

---

## 🧩 Patrones y Convenciones

### 1. API Routes

Toda API route sigue este patrón:

```typescript
// src/app/api/accounts/route.ts
import { NextRequest } from 'next/server'
import { accountsService } from '@/services/accounts.service'
import { createAccountSchema } from '@/lib/validations/account.schema'
import { getUserId } from '@/lib/auth.server'

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = createAccountSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const account = await accountsService.createAccount(parsed.data, userId)
    return Response.json(account, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno'
    // Mapeo de mensajes de error a códigos HTTP
    if (message.includes('límite')) return Response.json({ error: message }, { status: 422 })
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
```

**Reglas:**
- `getUserId()` es **siempre** la primera línea después del try
- `safeParse()` con Zod, nunca `parse()` (evita throws no controlados)
- `params` se usa como `const { id } = await params` (Next.js 16 async)
- Errores de negocio se mapean a códigos HTTP

### 2. Services

Los services validan **ownership** y **reglas de negocio**:

```typescript
// src/services/accounts.service.ts
export const accountsService = {
  async createAccount(data, userId) {
    const existing = await accountsRepository.findAll(userId)
    if (existing.length >= 10) throw new Error('Has alcanzado el límite máximo de cuentas.')
    return accountsRepository.create(data, userId)
  },
  async updateAccount(accountId, data, userId) {
    const account = await accountsRepository.findById(accountId, userId)
    if (!account) throw new Error('Cuenta no encontrada.')
    return accountsRepository.update(accountId, data)
  },
}
```

### 3. Repositories

Acceso directo a Firestore. Sin lógica de negocio.

```typescript
// src/repositories/accounts.repository.ts
export const accountsRepository = {
  async findAll(userId) {
    const snapshot = await accountsCollection.where('user_id', '==', userId).get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },
  async create(data, userId) {
    const now = Timestamp.now()
    const docRef = await accountsCollection.add({ ...data, user_id: userId, createdAt: now, updatedAt: now })
    return { id: docRef.id, ...data, user_id: userId, createdAt: now, updatedAt: now }
  },
}
```

**Importante:** Los repositorios retornan el payload local inmediatamente después de `add()`/`set()`, sin hacer un `get()` adicional. Esto reduce lecturas Firestore.

### 4. Validación Zod

Los schemas viven en `src/lib/validations/`:

```typescript
// account.schema.ts
export const createAccountSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["BANK", "WALLET", "CASH", "CRYPTO", "OTHER"]),
  balance: z.coerce.number().min(0),
  currency: z.enum(["BOB", "USD", ...]).default("BOB"),
})
export type CreateAccountInput = z.infer<typeof createAccountSchema>
```

### 5. TanStack Query

Configuración global en `QueryProvider.tsx`:

| Parámetro | Valor |
|---|---|
| `staleTime` | 5 minutos |
| `retry` | 1 |
| `refetchOnWindowFocus` | false |
| `mutation.onError` | Toast global con sonner |

### 6. Tipos TypeScript

Separación estricta entre **tipos de datos** y **constantes de presentación**:

```typescript
// types/account.ts
export type AccountType = "BANK" | "WALLET" | "CASH" | "CRYPTO" | "OTHER"
export interface Account { id, name, type, balance, currency, createdAt, updatedAt }
// Constantes de presentación al final del mismo archivo
export const ACCOUNT_TYPES = [...]
```

### 7. Features vs Components

- `src/features/` → Componentes específicos de un dominio (ej: `TransactionForm`, `AccountsList`)
- `src/components/` → Componentes compartidos/shimmer (ej: `sidebar.tsx`, `button.tsx`)
- `src/components/layout/` → Layout global (AppLayout, Sidebar, Header)

### 8. Manejo de errores

- **API routes:** `try/catch` con mapeo de mensajes a códigos HTTP
- **Mutations (cliente):** `onError` global en QueryProvider muestra toast con sonner
- **Error boundaries:** Cada página tiene su `error.tsx`
- **Utility:** `src/lib/api-utils.ts` → `handleError()` centralizado

---

## 📦 Módulos / Features

Cada módulo tiene esta estructura típica:

```
src/features/<modulo>/
├── components/        # Componentes UI específicos del módulo
├── hooks/             # Hooks de TanStack Query (useX.ts)
└── utils/             # Utilidades de presentación (opcional)

src/app/<modulo>/      # Páginas
src/app/api/<modulo>/  # API routes (CRUD)
src/services/<modulo>.service.ts
src/repositories/<modulo>.repository.ts
src/types/<modulo>.ts
src/lib/validations/<modulo>.schema.ts
```

### Resumen de módulos

| Módulo | Páginas | API Routes | Service | Repository |
|---|---|---|---|---|
| **Accounts** | `/accounts` | `api/accounts/` [GET, POST, PUT[id], DELETE[id]] | ✅ | ✅ |
| **Transactions** | `/transactions` | `api/transactions/` [GET, POST, PUT[id], DELETE[id]] | ✅ | ✅ |
| **Budgets** | `/budgets` | `api/budgets/` [GET, POST, PUT[id], DELETE[id]] | ✅ | ✅ |
| **Categories** | `/categories` | `api/categories/` [GET, POST, PUT[id], DELETE[id]] | ✅ | ✅ |
| **Credits** | — (componentes embebidos) | `api/credits/` [GET, POST], `api/credits/[id]/pay` | ✅ | ✅ |
| **Debts** | `/debts` | `api/debts/` [GET, POST, PUT[id], DELETE[id]] | ✅ | ✅ |
| **Savings Goals** | `/ahorros` | `api/savings-goals/` [GET, POST, PUT[id]] | ✅ | ✅ |
| **Projects** | — (selector en transacciones) | `api/projects/` [GET, POST, PUT[id]] | ✅ | ✅ |
| **Dashboard** | `/dashboard` | — (usa otras APIs directo) | — | — |
| **Insights** | `/insights` | `api/insights/` [GET] | ✅ | ✅ |
| **Gasolina** | `/gasolina` | — (usa server actions) | — | ✅ (2 repos) |
| **Car Sharing** | `/car-sharing` | — | — | ✅ |
| **Landing** | `/` | — | — | — |

---

## 🌐 API Routes

Todas bajo `src/app/api/`. Responden JSON.

| Endpoint | Métodos | Propósito |
|---|---|---|
| `/api/auth/session` | POST, DELETE | Crear/eliminar cookie de sesión |
| `/api/accounts` | GET, POST | Listar / crear cuentas |
| `/api/accounts/[id]` | PUT, DELETE | Actualizar / eliminar cuenta |
| `/api/transactions` | GET, POST | Listar (con filtros) / crear transacciones |
| `/api/transactions/[id]` | PUT, DELETE | Actualizar / eliminar transacción |
| `/api/categories` | GET, POST | Listar / crear categorías |
| `/api/categories/[id]` | PUT, DELETE | Actualizar / eliminar categoría |
| `/api/budgets` | GET, POST | Listar / crear presupuestos |
| `/api/budgets/[id]` | PUT, DELETE | Actualizar / eliminar presupuesto |
| `/api/credits` | GET, POST | Listar / crear créditos |
| `/api/credits/[id]` | GET, DELETE | Detalle / eliminar crédito |
| `/api/credits/[id]/pay` | POST | Pagar cuotas de crédito |
| `/api/debts` | GET, POST | Listar / crear deudas |
| `/api/debts/[id]` | PUT, DELETE | Actualizar / eliminar deuda |
| `/api/savings-goals` | GET, POST | Listar / crear metas |
| `/api/savings-goals/[id]` | PUT | Actualizar meta |
| `/api/projects` | GET, POST | Listar / crear proyectos |
| `/api/projects/[id]` | PUT | Actualizar proyecto |
| `/api/insights` | GET | Obtener insights + IA (cache 24h) |

---

## 📜 Scripts

Los scripts en `scripts/` se ejecutan con `npx tsx`:

```bash
npx tsx scripts/<nombre>.ts
```

Usan `dotenv` para cargar variables de entorno. Son **one-shot** (se usan para migraciones de datos en Firestore).

| Script | Propósito |
|---|---|
| `migrate.ts` | Migración genérica de datos |
| `addUserId.ts` | Agregar campo `user_id` a documentos existentes |
| `migrate-timestamps.ts` | Migrar formato de timestamps |
| `clearCategory.ts` | Limpiar/eliminar categorías |

---

## 🚀 Despliegue

### Firebase Console

El proyecto Firebase ID es `kiposbo`. Puedes acceder en:
https://console.firebase.google.com/project/kiposbo

### Para desplegar

```bash
# Build de producción
npm run build

# Iniciar servidor
npm run start
```

**No hay configuración de deployments automatizados** (Vercel, etc.). ToDo pendiente.

### Reglas de Firestore

No se encontraron reglas personalizadas en el repo. Por defecto, Firebase Admin SDK tiene acceso completo. Si se añaden reglas de seguridad, considerar que todas las operaciones server-side usan Admin SDK.

---

## 🔧 Depuración y Solución de Problemas

### Problemas comunes

| Problema | Causa | Solución |
|---|---|---|
| `No autorizado` en API | Cookie de sesión expirada o ausente | Re-login en `/login` |
| Error de Firebase Admin | `FIREBASE_PRIVATE_KEY` mal formateado | Verificar que los `\n` escapados estén correctos |
| Hydration mismatch | Fechas calculadas en server vs client | Usar `parseLocalDate()` para fechas sin timezone |
| Error en build de Next.js | Dependencias incompatibles | `rm -rf .next node_modules && npm install && npm run build` |
| "Has alcanzado el límite" | Más de 10 cuentas | Eliminar cuentas no usadas |

### Debugging tips

- **API routes:** El `console.error` ya está presente en todos los catch
- **TanStack Query DevTools:** Disponible en dev (`Ctrl+Shift+D` para abrir)
- **Firebase Admin SDK:** Logs en el servidor (Next.js terminal)
- **TypeScript:** `npx tsc --noEmit` para type checking
- **ESLint:** `npm run lint`

### Comandos útiles para desarrollo

```bash
# Type check
npx tsc --noEmit

# Lint específico de un archivo
npx eslint src/features/accounts/AccountForm.tsx

# Ver colecciones en Firestore (usando Firebase Admin)
node -e "require('./src/lib/firebase.admin'); console.log('Firebase OK')"
```

---

## 🧭 Roadmap / Próximos Pasos

Basado en el `CHANGELOG.md`, la app está en **v1.6.0** (Junio 2026). Áreas potenciales:

- [ ] Agregar test framework (Vitest + Testing Library)
- [ ] Configurar CI/CD (GitHub Actions + Vercel)
- [ ] Reemplazar tasas de cambio hardcoded por API externa
- [ ] Migrar de Firebase a Supabase (hay `supabase-schema.sql` legacy)
- [ ] Agregar reglas de seguridad en Firestore
- [ ] Mejorar cobertura de type-check (actualmente no hay script)

---

## 📚 Referencias

| Recurso | Ubicación |
|---|---|
| Guía para agentes IA | `AGENTS.md` |
| Changelog técnico | `CHANGELOG.md` |
| Notas de release | `RELEASES.md` |
| Spec de créditos | `specs/spec-credits.md` |
| Spec car-maintenance | `docs/superpowers/specs/2026-05-01-car-maintenance-design.md` |
| Spec car-sharing | `docs/superpowers/specs/2026-04-22-car-sharing-cycles-and-debts-design.md` |
| Diseño landing page | `docs/plans/2026-03-06-landing-page-design.md` |

---

> **Última actualización:** Junio 2026 · Versión del proyecto: 1.6.0
