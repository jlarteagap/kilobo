'use client'

import { useState, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { ShiftForm } from '@/features/driver/components/ShiftForm'
import { ShiftHistory } from '@/features/driver/components/ShiftHistory'
import { DriverDeposits } from '@/features/driver/components/DriverDeposits'
import { DashboardSummary } from '@/features/driver/components/DashboardSummary'
import { MonthCyclePicker } from '@/features/driver/components/MonthCyclePicker'
import { useShifts, useCreateShift, useUpdateShift } from '@/features/driver/hooks/useDriverShifts'
import { useMonthCycle } from '@/features/driver/hooks/useMonthCycle'
import { CarTaxiFront, BarChart3, Settings, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { ShiftInput, DriverShift } from '@/types/driver'

export default function ConductorPage() {
  const { cycle, prev, next, label, isCurrentMonth, setCycle } = useMonthCycle()
  const { data: shifts = [], isLoading: loadingShifts } = useShifts(cycle)
  const createShift = useCreateShift()
  const updateShift = useUpdateShift()

  const [showForm, setShowForm] = useState(false)
  const [editingShift, setEditingShift] = useState<DriverShift | null>(null)

  const handleCreate = useCallback((data: ShiftInput) => {
    createShift.mutate(data)
    setShowForm(false)
  }, [createShift])

  const handleUpdate = useCallback((id: string, data: ShiftInput) => {
    updateShift.mutate({ id, data })
    setEditingShift(null)
  }, [updateShift])

  const handleEdit = useCallback((shift: DriverShift) => {
    setEditingShift(shift)
  }, [])

  if (loadingShifts) {
     return (
       <AppLayout>
         <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
           <div className="h-8 w-48 bg-card-soft dark:bg-muted rounded-xl" />
           <div className="h-12 bg-card-soft dark:bg-muted rounded-xl" />
           <div className="h-32 bg-card-soft dark:bg-muted rounded-[22px]" />
           <div className="h-64 bg-card-soft dark:bg-muted rounded-[22px]" />
         </div>
       </AppLayout>
     )
   }

   return (
     <AppLayout>
       <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {/* Header */}
         <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-3 min-w-0">
             <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
               <CarTaxiFront className="size-5" />
             </div>
             <div className="min-w-0">
               <h1 className="text-2xl font-black text-foreground tracking-tight leading-none">Conductor</h1>
               <p className="text-xs text-muted-foreground font-medium mt-1 truncate">Registro de turnos por ciclo mensual</p>
             </div>
           </div>

           <div className="flex items-center gap-2 shrink-0">
             <Link href="/conductor/settings" aria-label="Configuracion">
               <Button variant="ghost" size="icon" className="size-9 rounded-xl text-muted-foreground hover:text-foreground">
                 <Settings className="size-4" />
               </Button>
             </Link>
             <Link href={`/conductor/analytics?year=${cycle.year}&month=${cycle.month}`}>
               <Button variant="outline" className="h-9 px-4 rounded-xl text-xs font-bold border-border">
                 <BarChart3 className="size-3.5 mr-1.5" />
                 Analytics
               </Button>
             </Link>
           </div>
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

        <DashboardSummary shifts={shifts} />

        {!showForm && !editingShift && (
           <button
             onClick={() => setShowForm(true)}
             className="w-full rounded-[22px] border-2 border-dashed border-border bg-card/60 dark:bg-card hover:border-primary hover:bg-secondary dark:hover:bg-secondary transition-all duration-200 p-6 group"
           >
             <div className="flex items-center justify-center gap-3">
               <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                 <Plus className="size-5" />
               </div>
               <div className="text-left">
                 <p className="text-sm font-bold text-foreground">Registrar turno</p>
                 <p className="text-xs text-muted-foreground">Fecha, horas, km e ingresos</p>
               </div>
             </div>
           </button>
         )}

        {showForm && (
          <ShiftForm
            isPending={createShift.isPending}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}
        {editingShift && (
          <ShiftForm
            isPending={updateShift.isPending}
            initialData={{
              id: editingShift.id,
              date: editingShift.date ?? editingShift.createdAt?.slice(0, 10),
              hoursWorked: editingShift.hoursWorked ?? 0,
              startKm: editingShift.startKm,
              endKm: editingShift.endKm,
              earnings: editingShift.earnings,
              bonuses: editingShift.bonuses,
              commissions: editingShift.commissions,
              tips: editingShift.tips,
              expenses: editingShift.expenses,
              notes: editingShift.notes,
            }}
            onUpdate={handleUpdate}
            onCancel={() => setEditingShift(null)}
          />
        )}

         <div className="space-y-4">
           <div className="flex items-center gap-2">
             <div className="size-6 rounded-lg bg-secondary dark:bg-muted flex items-center justify-center text-muted-foreground">
               <CarTaxiFront className="size-3" />
             </div>
             <h2 className="text-sm font-bold text-foreground tracking-tight">Turnos del ciclo</h2>
             {shifts.length > 0 && (
               <span className="text-xs text-muted-foreground">· {shifts.length}</span>
             )}
           </div>
           <ShiftHistory shifts={shifts} onEdit={handleEdit} cycle={cycle} label={label} />
         </div>

         <DriverDeposits cycle={cycle} label={label} />
      </div>
    </AppLayout>
  )
}
