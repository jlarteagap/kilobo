// app/(dashboard)/debts/page.tsx
import AppLayout from "@/components/layout/AppLayout"
import { DebtsList } from "@/features/debts/components/DebtsList"

export const metadata = {
  title:       'Deudas y Préstamos',
  description: 'Seguimiento de deudas y préstamos personales',
}

export default function DebtsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <DebtsList />
      </div>
    </AppLayout>
  )
}
