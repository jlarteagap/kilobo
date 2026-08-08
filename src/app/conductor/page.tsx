'use client'

import { useState, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { ShiftForm } from '@/features/driver/components/ShiftForm'
import { ShiftHistory } from '@/features/driver/components/ShiftHistory'
import { DashboardSummary } from '@/features/driver/components/DashboardSummary'
import { useShifts, useCreateShift, useUpdateShift } from '@/features/driver/hooks/useDriverShifts'
import { CarTaxiFront, BarChart3, Settings, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { ShiftInput, DriverShift } from '@/types/driver'

export default function ConductorPage() {
  const { data: shifts = [], isLoading: loadingShifts } = useShifts()
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

  const isPending = createShift.isPending || updateShift.isPending

  if (loadingShifts) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-[#F2F9E3]/40 dark:bg-neutral-900 rounded-lg" />
          <div className="h-32 bg-[#F2F9E3]/40 dark:bg-neutral-900 rounded-2xl" />
          <div className="h-64 bg-[#F2F9E3]/40 dark:bg-neutral-900 rounded-2xl" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#4F6A35] dark:bg-white flex items-center justify-center text-white dark:text-black shadow-sm">
              <CarTaxiFront className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground dark:text-neutral-100 tracking-tight">Conductor</h1>
              <p className="text-[11px] text-[#6E6E73] font-medium">Registro de turnos y optimización</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/conductor/settings">
              <Button variant="ghost" size="icon" className="size-9 rounded-lg text-[#6E6E73] hover:text-foreground dark:hover:text-neutral-300">
                <Settings className="size-4" />
              </Button>
            </Link>
            <Link href="/conductor/analytics">
              <Button variant="outline" className="h-9 px-4 rounded-lg text-xs font-bold border-[rgba(0,0,0,0.06)] dark:border-neutral-800">
                <BarChart3 className="size-3.5 mr-1.5" />
                Analytics
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Resumen rápido ── */}
        <DashboardSummary shifts={shifts} />

        {/* ── CTA Registrar turno ── */}
        {!showForm && !editingShift && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full rounded-2xl border-2 border-dashed border-[rgba(0,0,0,0.12)] dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/20 hover:border-[#4F6A35] dark:hover:border-[#4F6A35] hover:bg-[#F2F9E3]/50 dark:hover:bg-[#4F6A35]/10 transition-all duration-200 p-6 group"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="size-10 rounded-xl bg-[#4F6A35] flex items-center justify-center text-white shadow-lg shadow-[#4F6A35]/20 group-hover:scale-105 transition-transform">
                <Plus className="size-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground dark:text-neutral-100">Registrar turno</p>
                <p className="text-[11px] text-[#6E6E73]">Fecha, horas, km e ingresos — al final del día</p>
              </div>
            </div>
          </button>
        )}

        {/* ── Formulario de registro / edición ── */}
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
              expenses: editingShift.expenses,
              notes: editingShift.notes,
            }}
            onUpdate={handleUpdate}
            onCancel={() => setEditingShift(null)}
          />
        )}

        {/* ── Historial ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-[#F2F9E3]/40 dark:bg-neutral-900 flex items-center justify-center text-[#6E6E73]">
              <CarTaxiFront className="size-3" />
            </div>
            <h2 className="text-sm font-semibold text-foreground dark:text-neutral-300">Turnos Registrados</h2>
          </div>
          <ShiftHistory shifts={shifts} onEdit={handleEdit} />
        </div>
      </div>
    </AppLayout>
  )
}
