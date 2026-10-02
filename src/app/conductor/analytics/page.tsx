'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { ShiftAnalytics } from '@/features/driver/components/ShiftAnalytics'
import { MonthCyclePicker } from '@/features/driver/components/MonthCyclePicker'
import { useMonthCycle } from '@/features/driver/hooks/useMonthCycle'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function AnalyticsContent() {
  const searchParams = useSearchParams()
  const qYear = searchParams.get('year')
  const qMonth = searchParams.get('month')
  const initial = qYear && qMonth ? { year: Number(qYear), month: Number(qMonth) } : undefined
  const { cycle, prev, next, label, isCurrentMonth, setCycle } = useMonthCycle(initial)

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Analytics
            </h1>
            <p className="text-xs font-medium text-zinc-500">
              Metricas por ciclo mensual
            </p>
          </div>

          <Link href="/conductor" className="shrink-0">
            <Button
              variant="outline"
              className="h-9 px-4 rounded-lg text-xs font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            >
              <ArrowLeft className="size-3.5 mr-1.5" />
              Volver
            </Button>
          </Link>
        </div>

        <MonthCyclePicker
          year={cycle.year}
          month={cycle.month}
          label={label}
          onPrev={prev}
          onNext={next}
          onSelect={setCycle}
          isCurrentMonth={isCurrentMonth}
        />

        <ShiftAnalytics cycle={cycle} />
      </div>
    </AppLayout>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AppLayout><div className="max-w-4xl mx-auto px-4 py-8 space-y-6"><div className="h-12 bg-zinc-100 rounded-[22px] animate-pulse" /><div className="h-64 bg-zinc-100 rounded-[22px] animate-pulse" /></div></AppLayout>}>
      <AnalyticsContent />
    </Suspense>
  )
}
