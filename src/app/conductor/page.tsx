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
import { BarChart3, Settings, Plus } from 'lucide-react'
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
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-zinc-100 rounded-lg animate-pulse" />
            <div className="h-3 w-56 bg-zinc-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-12 bg-zinc-100 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="h-24 bg-zinc-100 rounded-xl animate-pulse" />
            <div className="h-24 bg-zinc-100 rounded-xl animate-pulse" />
            <div className="h-24 bg-zinc-100 rounded-xl animate-pulse" />
          </div>
          <div className="h-32 bg-zinc-100 rounded-[22px] animate-pulse" />
          <div className="h-64 bg-zinc-100 rounded-[22px] animate-pulse" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Conductor
            </h1>
            <p className="text-xs font-medium text-zinc-500">
              Registro de turnos por ciclo mensual
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/conductor/settings" aria-label="Configuracion">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
              >
                <Settings className="size-4" />
              </Button>
            </Link>
            <Link href={`/conductor/analytics?year=${cycle.year}&month=${cycle.month}`}>
              <Button
                variant="outline"
                className="h-9 px-4 rounded-lg text-xs font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              >
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
            className="w-full rounded-[22px] border border-dashed border-zinc-200 bg-zinc-50/50 p-5 hover:border-zinc-300 hover:bg-zinc-50 transition-colors group"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="size-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white transition-transform group-hover:scale-105">
                <Plus className="size-5" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-zinc-900">Registrar turno</p>
                <p className="text-[11px] text-zinc-500">Fecha, horas, km e ingresos</p>
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

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">
              Turnos del ciclo
            </span>
            {shifts.length > 0 && (
              <span className="text-[11px] font-semibold text-zinc-400 tabular-nums">
                {shifts.length}
              </span>
            )}
          </div>
          <ShiftHistory shifts={shifts} onEdit={handleEdit} cycle={cycle} label={label} />
        </div>

        <DriverDeposits cycle={cycle} label={label} />
      </div>
    </AppLayout>
  )
}