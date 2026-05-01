'use client'

import React, { useState } from 'react'
import { CarMaintenanceLog, MaintenanceType } from '@/repositories/car-maintenance.repository'
import { Droplets, Wrench, Sparkles, ChevronRight, AlertCircle, Settings2 } from 'lucide-react'
import { MaintenanceModal } from './MaintenanceModal'
import { cn } from '@/lib/utils'
import { setAbsoluteOdometerAction } from '../maintenance.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MaintenanceWidgetsProps {
  absoluteOdometer: number | null
  logs: CarMaintenanceLog[]
}

const LIMITS = {
  oil: 10000,
  injectors: 4000
}

export function MaintenanceWidgets({ absoluteOdometer, logs }: MaintenanceWidgetsProps) {
  const [activeModalType, setActiveModalType] = useState<MaintenanceType | null>(null)
  
  // Odometer Setup State
  const [isSettingOdo, setIsSettingOdo] = useState(false)
  const [initialOdo, setInitialOdo] = useState('')

  if (absoluteOdometer === null) {
    return (
      <div className="w-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Settings2 className="size-6" />
        </div>
        <div>
          <h3 className="text-xl font-light tracking-tight text-emerald-900 dark:text-emerald-50">Configurar Mantenimiento</h3>
          <p className="text-sm text-emerald-700/60 dark:text-emerald-400/60 max-w-md mt-1">
            Para que el sistema te avise automáticamente cuándo toca el próximo mantenimiento, necesitamos saber el kilometraje completo real del auto por primera vez.
          </p>
        </div>
        {isSettingOdo ? (
          <div className="flex items-center gap-3 w-full max-w-xs pt-4">
            <Input 
              type="number"
              placeholder="Ej: 145000"
              value={initialOdo}
              onChange={e => setInitialOdo(e.target.value)}
              className="h-12 bg-white dark:bg-neutral-900 border-emerald-200 dark:border-emerald-800 rounded-xl"
            />
            <Button 
              onClick={() => {
                const val = parseInt(initialOdo, 10)
                if (!isNaN(val) && val >= 0) {
                  setAbsoluteOdometerAction(val)
                }
              }}
              className="h-12 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 px-6"
            >
              Guardar
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => setIsSettingOdo(true)}
            className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl px-8 h-12"
          >
            Configurar Kilometraje Actual
          </Button>
        )}
      </div>
    )
  }

  // Calculate stats
  const latestOil = logs.find(l => l.type === 'oil')
  const latestInjectors = logs.find(l => l.type === 'injectors')
  const latestWash = logs.find(l => l.type === 'wash')

  const getProgress = (latestLog: CarMaintenanceLog | undefined, limit: number) => {
    if (!latestLog) return { remaining: limit, percentage: 0, status: 'good', nextKm: absoluteOdometer + limit }
    
    const kmDriven = absoluteOdometer - latestLog.odometer
    const remaining = limit - kmDriven
    let percentage = (kmDriven / limit) * 100
    if (percentage > 100) percentage = 100
    if (percentage < 0) percentage = 0

    let status = 'good'
    if (percentage >= 90) status = 'danger'
    else if (percentage >= 75) status = 'warning'

    return { remaining, percentage, status, nextKm: latestLog.odometer + limit }
  }

  const oilStats = getProgress(latestOil, LIMITS.oil)
  const injectorStats = getProgress(latestInjectors, LIMITS.injectors)

  const getWashStats = () => {
    if (!latestWash) return { days: '?', label: 'Nunca' }
    const diffTime = Math.abs(Date.now() - latestWash.date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return { days: diffDays, label: `Hace ${diffDays} días` }
  }
  const washStats = getWashStats()

  const StatusCard = ({ 
    title, icon: Icon, type, 
    remainingText, subtitleText, 
    percentage, status 
  }: { 
    title: string, icon: any, type: MaintenanceType, 
    remainingText: string, subtitleText: string, 
    percentage?: number, status?: string 
  }) => {
    
    const statusColors = {
      good: "bg-emerald-500",
      warning: "bg-yellow-500",
      danger: "bg-red-500 animate-pulse"
    }
    
    const borderColors = {
      good: "border-neutral-100 dark:border-neutral-900 hover:border-emerald-200 dark:hover:border-emerald-800",
      warning: "border-yellow-100 dark:border-yellow-900/50 hover:border-yellow-300 dark:hover:border-yellow-700",
      danger: "border-red-200 dark:border-red-900/50 hover:border-red-400 dark:hover:border-red-800"
    }

    const currentBorder = status ? borderColors[status as keyof typeof borderColors] : borderColors.good
    const barColor = status ? statusColors[status as keyof typeof statusColors] : statusColors.good

    return (
      <div 
        onClick={() => setActiveModalType(type)}
        className={cn(
          "group relative overflow-hidden bg-white dark:bg-neutral-950 border rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
          currentBorder
        )}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
              <Icon className="size-5" />
            </div>
            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">{title}</h4>
          </div>
          <div className="size-8 rounded-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
            <ChevronRight className="size-4 text-neutral-400" />
          </div>
        </div>

        <div className="space-y-1 relative z-10">
          <p className={cn(
            "text-3xl font-light tracking-tight tabular-nums",
            status === 'danger' ? "text-red-600" : "text-neutral-900 dark:text-white"
          )}>
            {remainingText}
          </p>
          <p className="text-xs text-neutral-400 uppercase tracking-widest font-bold">
            {subtitleText}
          </p>
        </div>

        {percentage !== undefined && (
          <div className="mt-6 h-1.5 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-1000 ease-out", barColor)}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
        
        {status === 'danger' && (
          <div className="absolute top-6 right-6 text-red-500 flex items-center gap-2 animate-in fade-in zoom-in">
            <span className="text-[10px] font-bold uppercase tracking-widest">Urgente</span>
            <AlertCircle className="size-4" />
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <StatusCard 
          title="Cambio de Aceite" 
          icon={Droplets} 
          type="oil"
          remainingText={`${oilStats.remaining > 0 ? oilStats.remaining.toLocaleString() : 0}`}
          subtitleText="km restantes"
          percentage={oilStats.percentage}
          status={oilStats.status}
        />
        <StatusCard 
          title="Limpia Inyectores" 
          icon={Wrench} 
          type="injectors"
          remainingText={`${injectorStats.remaining > 0 ? injectorStats.remaining.toLocaleString() : 0}`}
          subtitleText="km restantes"
          percentage={injectorStats.percentage}
          status={injectorStats.status}
        />
        <StatusCard 
          title="Lavado de Auto" 
          icon={Sparkles} 
          type="wash"
          remainingText={`${washStats.days}`}
          subtitleText={washStats.label}
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
