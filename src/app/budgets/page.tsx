// app/(dashboard)/budgets/page.tsx
import AppLayout from "@/components/layout/AppLayout"
import { BudgetsList } from "@/features/budgets/components/BudgetsList"

export const metadata = {
  title:       'Presupuestos',
  description: 'Seguimiento de metas, ingresos y gastos fijos del mes',
}

export default function BudgetsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <BudgetsList />
      </div>
    </AppLayout>
  )
}