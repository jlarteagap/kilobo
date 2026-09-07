'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { ShiftAnalytics } from '@/features/driver/components/ShiftAnalytics'
import { MonthCyclePicker } from '@/features/driver/components/MonthCyclePicker'
import { useMonthCycle } from '@/features/driver/hooks/useMonthCycle'
import { BarChart3, ArrowLeft } from 'lucide-react'
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
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-3 min-w-0">
             <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
               <BarChart3 className="size-5" />
             </div>
             <div className="min-w-0">
               <h1 className="text-2xl font-black text-foreground tracking-tight leading-none">Analytics</h1>
               <p className="text-xs text-muted-foreground font-medium mt-1">Metricas por ciclo mensual</p>
             </div>
           </div>

           <Link href="/conductor" className="shrink-0">
             <Button variant="outline" className="h-9 px-4 rounded-xl text-xs font-bold border-border">
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
    <Suspense fallback={<AppLayout><div className="max-w-4xl mx-auto px-4 py-8"><div className="h-64 animate-pulse bg-zinc-100 rounded-2xl" /></div></AppLayout>}>
      <AnalyticsContent />
    </Suspense>
  )
}
