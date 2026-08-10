'use client'

import AppLayout from '@/components/layout/AppLayout'
import { ShiftAnalytics } from '@/features/driver/components/ShiftAnalytics'
import { BarChart3, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AnalyticsPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#4F6A35] flex items-center justify-center text-white shadow-sm">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Analytics</h1>
              <p className="text-[11px] text-[#6E6E73] font-medium">Métricas de optimización</p>
            </div>
          </div>

          <Link href="/conductor">
            <Button variant="outline" className="h-9 px-4 rounded-lg text-xs font-bold border-[rgba(0,0,0,0.06)]">
              <ArrowLeft className="size-3.5 mr-1.5" />
              Volver
            </Button>
          </Link>
        </div>

        {/* ── Analytics ── */}
        <ShiftAnalytics />
      </div>
    </AppLayout>
  )
}
