'use client'

import React, { useState } from 'react'
import { CarMaintenanceLog, MaintenanceType, MAINTENANCE_INTERVALS } from '@/types/car-maintenance'
import { Droplets, Wrench, ChevronRight, AlertCircle, Settings2, X } from 'lucide-react'
import { MaintenanceModal } from './MaintenanceModal'
import { cn } from '@/lib/utils'
import { setAbsoluteOdometerAction } from '../maintenance.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MaintenanceWidgetsProps {
  absoluteOdometer: number | null
  logs: CarMaintenanceLog[]
}

interface StatusCardProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  type: MaintenanceType
  remainingText: string
  subtitleText: string
  percentage?: number
  status?: 'good' | 'warning' | 'danger'
  onOpen: (type: MaintenanceType) => void
}

function StatusCard({
  title,
  icon: Icon,
  type,
  remainingText,
  subtitleText,
  percentage,
  status,
  onOpen,
}: StatusCardProps) {
  // Mismo orden de severidad que usa `MaintenanceFundCard` del modulo
  // Conductor: emerald para sano, zinc-400 avisos, zinc-900 vencido.
  const barColor =
    status === 'danger' ? 'bg-zinc-900' : status === 'warning' ? 'bg-zinc-400' : 'bg-emerald-600'

  return (
    <div
      onClick={() => onOpen(type)}
      className="group relative overflow-hidden bg-white border border-zinc-200 rounded-[22px] p-6 cursor-pointer transition-colors hover:border-zinc-300"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-zinc-100 flex items-center justify-center">
            <Icon className="size-4 text-zinc-400" />
          </div>
          <h3 className="text-[13px] font-semibold text-zinc-900 tracking-tight">{title}</h3>
        </div>
        <div className="size-8 rounded-lg bg-zinc-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="size-3.5 text-zinc-400" />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-semibold tracking-tight tabular-nums text-zinc-900">
          {remainingText}
        </p>
        <p className="text-[11px] text-zinc-500">{subtitleText}</p>
      </div>

      {percentage !== undefined && (
        <div className="mt-5 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full', barColor)}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}

      {status === 'danger' && (
        <div className="absolute top-6 right-6 text-zinc-900 flex items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wide">Vencido</span>
          <AlertCircle className="size-3.5" />
        </div>
      )}
    </div>
  )
}

export function MaintenanceWidgets({ absoluteOdometer, logs }: MaintenanceWidgetsProps) {
  const [activeModalType, setActiveModalType] = useState<MaintenanceType | null>(null)
  const [isSettingOdo, setIsSettingOdo] = useState(false)
  const [initialOdo, setInitialOdo] = useState('')

  if (absoluteOdometer === null) {
    return (
      <div className="w-full rounded-[22px] border border-zinc-200 bg-white p-6 flex flex-col items-center text-center space-y-4">
        <div className="size-11 rounded-xl bg-zinc-100 flex items-center justify-center">
          <Settings2 className="size-4 text-zinc-400" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-zinc-900 tracking-tight">
            Configurar mantenimiento
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-md leading-relaxed">
            Para avisarte cuándo toca el próximo mantenimiento necesitamos el
            kilometraje completo real del auto, una sola vez.
          </p>
        </div>
        {isSettingOdo ? (
          <div className="flex items-center gap-2 w-full max-w-xs">
            <Input
              type="number"
              placeholder="Ej: 145000"
              value={initialOdo}
              onChange={e => setInitialOdo(e.target.value)}
              className="h-11 bg-white border-zinc-200 rounded-xl"
            />
            <Button
              onClick={() => {
                const val = parseInt(initialOdo, 10)
                if (!isNaN(val) && val >= 0) setAbsoluteOdometerAction(val)
              }}
              className="h-11 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 px-5"
            >
              Guardar
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setIsSettingOdo(true)}
            className="h-11 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 px-6"
          >
            Configurar kilometraje actual
          </Button>
        )}
      </div>
    )
  }

  // Sin log previo no hay contra que medir el avance: se asume que el auto
  // recien entra en servicio y se reporta el intervalo completo. El mismo
  // criterio usa `maintenanceStatus()` en la card de Conductor.
  const getProgress = (latestLog: CarMaintenanceLog | undefined, limit: number) => {
    if (!latestLog) {
      return {
        remaining: limit,
        percentage: 0,
        status: 'good' as const,
        nextKm: absoluteOdometer + limit,
      }
    }

    const kmDriven = absoluteOdometer - latestLog.odometer
    const remaining = limit - kmDriven

    let percentage = (kmDriven / limit) * 100
    if (percentage < 0) percentage = 0

    const status =
      percentage >= 100 ? ('danger' as const)
      : percentage >= 85 ? ('warning' as const)
      : ('good' as const)

    return { remaining, percentage, status, nextKm: latestLog.odometer + limit }
  }

  const oilStats = getProgress(
    logs.find(l => l.type === 'oil'),
    MAINTENANCE_INTERVALS.oil.intervalKm,
  )
  const injectorStats = getProgress(
    logs.find(l => l.type === 'injectors'),
    MAINTENANCE_INTERVALS.injectors.intervalKm,
  )

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-zinc-50/50 border border-zinc-200 rounded-[22px]">
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-zinc-500">Kilometraje total del auto</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums text-zinc-900">
            {absoluteOdometer.toLocaleString()}
            <span className="ml-1.5 text-xs font-medium text-zinc-400">km</span>
          </p>
        </div>

        {isSettingOdo ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Nuevo valor…"
              value={initialOdo}
              onChange={e => setInitialOdo(e.target.value)}
              className="h-11 w-40 bg-white border-zinc-200 rounded-xl"
            />
            <Button
              onClick={() => {
                const val = parseInt(initialOdo, 10)
                if (!isNaN(val) && val >= 0) {
                  setAbsoluteOdometerAction(val)
                  setIsSettingOdo(false)
                  setInitialOdo('')
                }
              }}
              size="icon"
              className="size-11 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingOdo(false)}
              className="size-11 rounded-xl"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => {
              setInitialOdo(absoluteOdometer.toString())
              setIsSettingOdo(true)
            }}
            variant="outline"
            className="h-11 rounded-xl border-zinc-200 px-5 gap-2 text-zinc-600 hover:bg-zinc-50"
          >
            <Settings2 className="size-4" />
            Actualizar odómetro
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <StatusCard
          title="Cambio de aceite"
          icon={Droplets}
          type="oil"
          remainingText={oilStats.remaining.toLocaleString()}
          subtitleText={oilStats.remaining < 0 ? 'km pasados' : 'km restantes'}
          percentage={oilStats.percentage}
          status={oilStats.status}
          onOpen={setActiveModalType}
        />
        <StatusCard
          title="Aditivos de gasolina"
          icon={Wrench}
          type="injectors"
          remainingText={injectorStats.remaining.toLocaleString()}
          subtitleText={injectorStats.remaining < 0 ? 'km pasados' : 'km restantes'}
          percentage={injectorStats.percentage}
          status={injectorStats.status}
          onOpen={setActiveModalType}
        />
      </div>

      <MaintenanceModal
        isOpen={activeModalType !== null}
        onClose={() => setActiveModalType(null)}
        type={activeModalType}
        absoluteOdometer={absoluteOdometer}
        logs={logs}
      />
    </>
  )
}