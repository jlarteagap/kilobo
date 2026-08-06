'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useDriverConfig, useSaveDriverConfig } from '@/features/driver/hooks/useDriverConfig'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Settings, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { DriverConfig } from '@/types/driver'
import { DEFAULT_SUBTYPE_MAPPING } from '@/types/driver'

export default function DriverSettingsPage() {
  const { data: config, isLoading: loadingConfig } = useDriverConfig()
  const { data: accounts = [] } = useAccounts()
  const { data: projects = [] } = useProjects()
  const saveConfig = useSaveDriverConfig()

  const activeProjects = projects.filter((p) => p.status === 'active')

  const [projectId, setProjectId] = useState('')
  const [incomeCashAccountId, setIncomeCashAccountId] = useState('')
  const [incomeQrAccountId, setIncomeQrAccountId] = useState('')
  const [expenseCashAccountId, setExpenseCashAccountId] = useState('')
  const [expenseQrAccountId, setExpenseQrAccountId] = useState('')
  const [commissionAccountId, setCommissionAccountId] = useState('')

  const selectedProject = activeProjects.find((p) => p.id === projectId)

  useEffect(() => {
    if (config) {
      setProjectId(config.projectId)
      setIncomeCashAccountId(config.incomeCashAccountId)
      setIncomeQrAccountId(config.incomeQrAccountId)
      setExpenseCashAccountId(config.expenseCashAccountId)
      setExpenseQrAccountId(config.expenseQrAccountId)
      setCommissionAccountId(config.commissionAccountId)
    }
  }, [config])

  const handleSave = () => {
    const data: DriverConfig = {
      projectId,
      incomeCashAccountId,
      incomeQrAccountId,
      expenseCashAccountId,
      expenseQrAccountId,
      commissionAccountId,
      subtypeMapping: DEFAULT_SUBTYPE_MAPPING,
    }
    saveConfig.mutate(data)
  }

  if (loadingConfig) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-neutral-100 dark:bg-neutral-900 rounded-lg" />
          <div className="h-96 bg-neutral-100 dark:bg-neutral-900 rounded-2xl" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-sm">
              <Settings className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Configuración</h1>
              <p className="text-[11px] text-neutral-500 font-medium">Se configura una vez y se usa siempre</p>
            </div>
          </div>
          <Link href="/conductor">
            <Button variant="outline" className="h-9 px-4 rounded-lg text-xs font-bold">
              <ArrowLeft className="size-3.5 mr-1.5" />
              Volver
            </Button>
          </Link>
        </div>

        <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900/50 p-6 space-y-6">
          {/* Actividad (Proyecto) */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Actividad</Label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex h-12 w-full bg-transparent border-t-0 border-x-0 border-b border-neutral-100 dark:border-neutral-900 px-0 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">Seleccionar actividad</option>
              {activeProjects.length === 0 ? (
                <option value="" disabled>— No hay actividades —</option>
              ) : (
                activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon ?? ''} {p.name}
                  </option>
                ))
              )}
            </select>
            {activeProjects.length === 0 && (
              <p className="text-[10px] text-amber-600 font-medium">
                Crea una actividad en{' '}
                <Link href="/accounts" className="underline">Cuentas → Actividades</Link> primero
              </p>
            )}
            <p className="text-[10px] text-neutral-400">Ej: &quot;Conductor de apps&quot;</p>
          </div>

          {/* Subtipos (desde el proyecto seleccionado) */}
          {selectedProject && (
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900/40 p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Subtipos</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedProject.subtypes.map((st) => (
                  <span
                    key={st}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-200/50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400"
                  >
                    {st}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-neutral-400 italic">
                Se asignan automáticamente al cerrar turno según la app y el tipo de gasto
              </p>
            </div>
          )}

          {/* Cuentas destino */}
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Cuentas destino</p>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Efectivo (ingresos líquidos)</Label>
              <select
                value={incomeCashAccountId}
                onChange={(e) => setIncomeCashAccountId(e.target.value)}
                className="flex h-12 w-full bg-transparent border-t-0 border-x-0 border-b border-neutral-100 dark:border-neutral-900 px-0 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">Seleccionar cuenta</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">QR (ingresos líquidos)</Label>
              <select
                value={incomeQrAccountId}
                onChange={(e) => setIncomeQrAccountId(e.target.value)}
                className="flex h-12 w-full bg-transparent border-t-0 border-x-0 border-b border-neutral-100 dark:border-neutral-900 px-0 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">Seleccionar cuenta</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Gastos en efectivo (peaje, gasolina, etc.)</Label>
              <select
                value={expenseCashAccountId}
                onChange={(e) => setExpenseCashAccountId(e.target.value)}
                className="flex h-12 w-full bg-transparent border-t-0 border-x-0 border-b border-neutral-100 dark:border-neutral-900 px-0 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">Seleccionar cuenta</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Gastos con QR (peaje, gasolina, etc.)</Label>
              <select
                value={expenseQrAccountId}
                onChange={(e) => setExpenseQrAccountId(e.target.value)}
                className="flex h-12 w-full bg-transparent border-t-0 border-x-0 border-b border-neutral-100 dark:border-neutral-900 px-0 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">Seleccionar cuenta</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Comisiones (las descuenta la app)</Label>
              <select
                value={commissionAccountId}
                onChange={(e) => setCommissionAccountId(e.target.value)}
                className="flex h-12 w-full bg-transparent border-t-0 border-x-0 border-b border-neutral-100 dark:border-neutral-900 px-0 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">Seleccionar cuenta</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Guardar */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={saveConfig.isPending || !projectId}
              className="h-12 px-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black font-semibold"
            >
              {saveConfig.isPending ? 'Guardando…' : 'Guardar configuración'}
            </Button>
          </div>
        </div>

        {!config && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 text-center">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
              ⚠️ Configura esto antes de cerrar tu primer turno
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
