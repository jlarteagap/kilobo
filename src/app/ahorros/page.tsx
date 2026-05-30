'use client'

import { SavingsGoalsList } from '@/features/savings-goals/components/SavingsGoalsList'
import AppLayout from '@/components/layout/AppLayout'

export default function AhorrosPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <SavingsGoalsList />
      </div>
    </AppLayout>
  )
}
