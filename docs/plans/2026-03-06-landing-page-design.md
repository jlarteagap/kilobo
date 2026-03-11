# Kilo Landing Page Design: Quiet Wealth

## The Problem
We need a landing page at the root (`/`) to explain what Kilo is and drive user adoption, while moving the core application dashboard to a protected route (e.g., `/transactions` or `/dashboard`). The design must embody Kilo's precise, reliable, and clear approach to personal finance. 

## Intent First
*   **Who is this human?** A professional seeking clarity and control over their financial life. They are likely moving away from messy spreadsheets and want a tool that feels permanent, reliable, and private.
*   **What must they accomplish?** Understand immediately that Kilo is a high-craft tool for tracking net worth and cash flow, and feel confident enough to click "Sign up with Google".
*   **What should this feel like?** Like a well-lit, quiet room where serious work happens. High signal-to-noise ratio. Precise, calm, and confidence-inspiring.

## Design Primitives

### Domain & Vocabulary
Ledger, Balance, Net Worth, Cashflow, Vault, Transactions, Command Center, Pulse.

### Color World
*   **Paper (Surface):** `neutral-50` (A continuous, unbroken canvas).
*   **Ink (Text & Actions):** `neutral-900` (Deep, commanding charcoal for primary text and main actions).
*   **Growth (Semantic/Brand):** `emerald-600` (Reserved exclusively for positive financial values or primary growth actions).
*   **Structure (Borders):** `neutral-200` or `black/5` (Whisper-quiet borders that define space without demanding attention).

### Signature Element
**The Pulse Widget:** A simulated, elevated card in the Hero section displaying a positive Net Worth figure in `emerald-600` with a delicate sparkline. It represents the "aha" moment of using Kilo—seeing your financial truth clearly. 

### Token Architecture (Tailwind)
*   **Backgrounds:** `bg-neutral-50` (Main), `bg-white` (Cards/Bento items).
*   **Typography:** Primary (`text-neutral-900`), Secondary (`text-neutral-500`), Tertiary (`text-neutral-400`).
*   **Borders:** `border-neutral-200` (Standard separation).
*   **Shadows:** `shadow-sm` or `shadow-md` for signature elements to create subtle depth against the `neutral-50` background.

## Page Anatomy

### 1. Navigation (Header)
*   **Logo:** Minimal text "Kilo".
*   **Actions:** 
    *   "Iniciar Sesión" (Ghost button: `text-neutral-600 hover:text-neutral-900`)
    *   "Comenzar Gratis" (Solid button: `bg-neutral-900 text-white rounded-xl`)

### 2. The Hero (First Impression)
*   **Typography:** Dominant, tight-tracked headline (`text-5xl md:text-6xl font-semibold tracking-tight text-neutral-900`).
*   **Copy:** "Conoce tu patrimonio real."
*   **Subcopy:** "Gestiona tus activos, pasivos y flujos de caja en un único centro de mando diseñado para el largo plazo." (`text-neutral-500 text-lg max-w-2xl mx-auto`)
*   **Visual:** The Signature Pulse Widget nestled below the copy, providing a tangible glimpse of the product.

### 3. Anatomy of Control (Bento Grid)
An asymmetric layout to break monotony and show distinct facets of the app.
*   **Grid Structure:** `grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto`.
*   **Card 1 (Col-span-full md:col-span-2): "Visibilidad Total"** - A wide card simulating the Cashflow summary (Income vs. Expenses bars).
*   **Card 2 (Col-span-1 md:col-span-1): "Activos & Pasivos"** - A narrow card showing a pristine row from the balance sheet.
*   **Card 3 (Col-span-full md:col-span-3 or side-by-side): "Sin Ruido"** - Highlighting the streamlined transaction categorization.
*   **Card Styling:** `bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm`.

### 4. The Final Call (Pre-footer)
*   **Layout:** Centered, ample whitespace (`py-24`).
*   **Copy:** "Empieza a construir tu tranquilidad financiera hoy." (`text-3xl font-semibold`)
*   **Action:** Large CTA button mirroring the header or using `emerald-600` for final conversion punch.

### 5. Footer
*   Minimalist execution. Just copyright and essential links separated by a very faint top border (`border-neutral-100`).

## The Mandate Checks
*   [x] **Swap Test:** Swapping the font to a playful sans-serif or the background to a loud blue would break the "Quiet Wealth" intent. The strict adherence to neutrals and sharp typography is structural.
*   [x] **Squint Test:** The hierarchy is clear. The Hero headline and the Bento Grid structure remain visible even when blurred.
*   [x] **Token Test:** `neutral-50`, `neutral-900`, `emerald-600` sound like a ledger, not a toy.
