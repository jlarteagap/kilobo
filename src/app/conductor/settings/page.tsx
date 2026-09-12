'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useDriverConfig, useSaveDriverConfig } from '@/features/driver/hooks/useDriverConfig'
import { useActiveAccounts } from '@/features/accounts/hooks/useAccounts'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Settings, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { DriverConfig } from '@/types/driver'
import { DEFAULT_SUBTYPE_MAPPING } from '@/types/driver'

export default function DriverSettingsPage() {
  const { data: config, isLoading: loadingConfig } = useDriverConfig()
  const { data: accounts = [] } = useActiveAccounts()
  const { data: projects = [] } = useProjects()
  const saveConfig = useSaveDriverConfig()

  const activeProjects = projects.filter((p) => p.status === 'active')

  const [projectId, setProjectId] = useState('')
  const [incomeCashAccountId, setIncomeCashAccountId] = useState('')
  const [incomeQrAccountId, setIncomeQrAccountId] = useState('')
  const [expenseCashAccountId, setExpenseCashAccountId] = useState('')
  const [expenseQrAccountId, setExpenseQrAccountId] = useState('')
  const [commissionAccountId, setCommissionAccountId] = useState('')
  const [bonusDepositAccountId, setBonusDepositAccountId] = useState('')

  const selectedProject = activeProjects.find((p) => p.id === projectId)

  useEffect(() => {
    if (config) {
      setProjectId(config.projectId)
      setIncomeCashAccountId(config.incomeCashAccountId)
      setIncomeQrAccountId(config.incomeQrAccountId)
      setExpenseCashAccountId(config.expenseCashAccountId)
      setExpenseQrAccountId(config.expenseQrAccountId)
      setCommissionAccountId(config.commissionAccountId)
      setBonusDepositAccountId(config.bonusDepositAccountId)
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
      bonusDepositAccountId,
      subtypeMapping: DEFAULT_SUBTYPE_MAPPING,
    }
    saveConfig.mutate(data)
  }

  if (loadingConfig) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-secondary dark:bg-muted rounded-xl" />
          <div className="h-96 bg-secondary dark:bg-muted rounded-[22px]" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
              <Settings className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-foreground tracking-tight leading-none">Configuracion</h1>
              <p className="text-xs text-muted-foreground font-medium mt-1">Se configura una vez y se usa siempre</p>
            </div>
          </div>
          <Link href="/conductor">
            <Button variant="outline" className="h-9 px-4 rounded-xl text-xs font-bold border-border shrink-0">
              <ArrowLeft className="size-3.5 mr-1.5" />
              Volver
            </Button>
          </Link>
        </div>

        {!config && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Configura esto antes de cerrar tu primer turno
            </p>
          </div>
        )}

        <div className="rounded-[22px] bg-card dark:bg-card border border-border p-6 space-y-6 shadow-sm"
        >
          {/* Actividad */}
          <div className="space-y-2">
            <Label htmlFor="driver-project" className="text-xs font-semibold text-foreground">Actividad</Label>
            <select
              id="driver-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-input bg-card dark:bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors"
            >
              <option value="">Seleccionar actividad</option>
              {activeProjects.length === 0 ? (
                <option value="" disabled>No hay actividades</option>
              ) : (
                activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon ?? ''} {p.name}
                  </option>
                ))
              )}
            </select>
            {activeProjects.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Crea una actividad en{' '}
                <Link href="/accounts" className="underline">Cuentas - Actividades</Link> primero
              </p>
            )}
            <p className="text-xs text-muted-foreground">Ej: &quot;Conductor de apps&quot;</p>
          </div>

          {selectedProject && (
            <div className="rounded-xl bg-secondary dark:bg-muted border border-border p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">Subtipos</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedProject.subtypes.map((st) => (
                  <span
                    key={st}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-card dark:bg-card border border-border text-foreground"
                  >
                    {st}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Se asignan automaticamente al cerrar turno segun la app y el tipo de gasto
              </p>
            </div>
          )}

          {/* Cuentas destino */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-foreground">Cuentas destino</p>

            {[
              { id: 'incomeCash', label: 'Efectivo (ingresos liquidos)', value: incomeCashAccountId, setter: setIncomeCashAccountId },
              { id: 'incomeQr', label: 'QR (ingresos liquidos)', value: incomeQrAccountId, setter: setIncomeQrAccountId },
              { id: 'expenseCash', label: 'Gastos en efectivo', value: expenseCashAccountId, setter: setExpenseCashAccountId },
              { id: 'expenseQr', label: 'Gastos con QR', value: expenseQrAccountId, setter: setExpenseQrAccountId },
              { id: 'commission', label: 'Comisiones (descuento app)', value: commissionAccountId, setter: setCommissionAccountId },
              { id: 'bonusDeposit', label: 'Bonos (deposito de la app)', value: bonusDepositAccountId, setter: setBonusDepositAccountId },
            ].map((f) => (
              <div key={f.id} className="space-y-2">
                <Label htmlFor={f.id} className="text-xs font-medium text-foreground">{f.label}</Label>
                <select
                  id={f.id}
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-card dark:bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors"
                >
                  <option value="">Seleccionar cuenta</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={saveConfig.isPending || !projectId}
              className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {saveConfig.isPending ? 'Guardando...' : 'Guardar configuracion'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
