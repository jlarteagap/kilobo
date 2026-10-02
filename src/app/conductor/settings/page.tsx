'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useDriverConfig, useSaveDriverConfig } from '@/features/driver/hooks/useDriverConfig'
import { useActiveAccounts } from '@/features/accounts/hooks/useAccounts'
import { formatCurrency } from '@/features/accounts/utils/account-display.utils'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { DriverConfig } from '@/types/driver'
import { DEFAULT_SUBTYPE_MAPPING } from '@/types/driver'

function SectionLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <Label
      htmlFor={htmlFor}
      className="block text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500"
    >
      {children}
    </Label>
  )
}

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
  const [maintenanceSavingsAccountId, setMaintenanceSavingsAccountId] = useState('')

  const selectedProject = activeProjects.find((p) => p.id === projectId)
  const incomeCashAccount = accounts.find((a) => a.id === incomeCashAccountId)
  const savingsAccount = accounts.find((a) => a.id === maintenanceSavingsAccountId)
  const savingsIsSameAsIncome = !!maintenanceSavingsAccountId && maintenanceSavingsAccountId === incomeCashAccountId

  useEffect(() => {
    if (config) {
      setProjectId(config.projectId)
      setIncomeCashAccountId(config.incomeCashAccountId)
      setIncomeQrAccountId(config.incomeQrAccountId)
      setExpenseCashAccountId(config.expenseCashAccountId)
      setExpenseQrAccountId(config.expenseQrAccountId)
      setCommissionAccountId(config.commissionAccountId)
      setBonusDepositAccountId(config.bonusDepositAccountId)
      setMaintenanceSavingsAccountId(config.maintenanceSavingsAccountId ?? '')
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
      maintenanceSavingsAccountId: maintenanceSavingsAccountId || null,
      subtypeMapping: DEFAULT_SUBTYPE_MAPPING,
    }
    saveConfig.mutate(data)
  }

  if (loadingConfig) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div className="h-7 w-40 bg-zinc-100 rounded-lg animate-pulse" />
          <div className="h-96 bg-zinc-100 rounded-[22px] animate-pulse" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Configuracion
            </h1>
            <p className="text-xs font-medium text-zinc-500">
              Se configura una vez y se usa siempre
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

        {!config && (
          <div className="p-4 rounded-[22px] bg-zinc-50 border border-zinc-200 flex items-start gap-2.5">
            <AlertTriangle className="size-4 text-zinc-600 shrink-0 mt-px" />
            <p className="text-[13px] font-semibold text-zinc-900 leading-relaxed">
              Configura esto antes de cerrar tu primer turno
            </p>
          </div>
        )}

        <div className="rounded-[22px] bg-white border border-zinc-200 p-6 space-y-6"
        >
          {/* Actividad */}
          <div className="space-y-2">
            <SectionLabel htmlFor="driver-project">Actividad</SectionLabel>
            <select
              id="driver-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-300 transition-colors"
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
              <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                Crea una actividad en{' '}
                <Link href="/accounts" className="underline underline-offset-2">Cuentas - Actividades</Link> primero
              </p>
            )}
            <p className="text-[11px] text-zinc-400">Ej: &quot;Conductor de apps&quot;</p>
          </div>

          {selectedProject && (
            <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">Subtipos</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedProject.subtypes.map((st) => (
                  <span
                    key={st}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700"
                  >
                    {st}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Se asignan automaticamente al cerrar turno segun la app y el tipo de gasto
              </p>
            </div>
          )}

          {/* Cuentas destino */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">Cuentas destino</p>

            {[
              { id: 'incomeCash', label: 'Efectivo (ingresos liquidos)', value: incomeCashAccountId, setter: setIncomeCashAccountId },
              { id: 'incomeQr', label: 'QR (ingresos liquidos)', value: incomeQrAccountId, setter: setIncomeQrAccountId },
              { id: 'expenseCash', label: 'Gastos en efectivo', value: expenseCashAccountId, setter: setExpenseCashAccountId },
              { id: 'expenseQr', label: 'Gastos con QR', value: expenseQrAccountId, setter: setExpenseQrAccountId },
              { id: 'commission', label: 'Comisiones (descuento app)', value: commissionAccountId, setter: setCommissionAccountId },
              { id: 'bonusDeposit', label: 'Bonos (deposito de la app)', value: bonusDepositAccountId, setter: setBonusDepositAccountId },
            ].map((f) => (
              <div key={f.id} className="space-y-2">
                <SectionLabel htmlFor={f.id}>{f.label}</SectionLabel>
                <select
                  id={f.id}
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-300 transition-colors"
                >
                  <option value="">Seleccionar cuenta</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            ))}

            {/* Fondo de mantenimiento */}
            <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <SectionLabel htmlFor="maintenance-savings">
                Fondo de mantenimiento
              </SectionLabel>
              <select
                id="maintenance-savings"
                value={maintenanceSavingsAccountId}
                onChange={(e) => setMaintenanceSavingsAccountId(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-300 transition-colors"
              >
                <option value="">Sin fondo (se registra como gasto)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — {formatCurrency(acc.balance, acc.currency)}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Cada turno aparta el 6% de su neto a esta cuenta, siempre que retenga al menos
                20% de lo bruto. Cr&eacute;ala en{' '}
                <Link href="/accounts" className="underline underline-offset-2">Cuentas</Link> como una cuenta normal
                (ej: &quot;Fondo de mantenimiento&quot;). Si la dejas vac&iacute;a, el 6% se sigue
                registrando como gasto.
              </p>

              {savingsIsSameAsIncome && (
                <p className="text-[11px] font-semibold text-zinc-900 flex items-start gap-1.5 leading-relaxed">
                  <AlertTriangle className="size-3.5 text-zinc-600 shrink-0 mt-px" />
                  El fondo no puede ser la misma cuenta de efectivo: la reserva se mover&iacute;a
                  de una billetera a s&iacute; misma.
                </p>
              )}

              {savingsAccount && !savingsIsSameAsIncome && (
                <p className="text-[11px] text-zinc-500 tabular-nums">
                  Disponible hoy: {formatCurrency(savingsAccount.balance, savingsAccount.currency)}
                  {incomeCashAccount && incomeCashAccount.currency !== savingsAccount.currency && (
                    <> &middot; est&aacute; en {savingsAccount.currency}, el efectivo en {incomeCashAccount.currency}</>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={saveConfig.isPending || !projectId || savingsIsSameAsIncome}
              className="h-11 px-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold"
            >
              {saveConfig.isPending ? 'Guardando...' : 'Guardar configuracion'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
