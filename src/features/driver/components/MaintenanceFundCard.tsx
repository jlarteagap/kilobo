'use client'

import Link from 'next/link'
import { Droplets, Settings2, Wallet, Gauge, AlertTriangle } from 'lucide-react'
import { useMaintenance, type MaintenanceService } from '../hooks/useMaintenance'
import { formatBs } from '../utils/driver-metrics.utils'
import { cn } from '@/lib/utils'

/**
 * Saldo del fondo de mantenimiento y estado de los proximos servicios del auto.
 *
 * Cierra el circulo con la reserva del 6%: antes el conductor podia ver que se
 * apartaba dinero por turno, pero no cuanto tinha guardado ni si le alcanzado
 * para cambiar el aceite. Ese saldo vive en la cuenta de finanzas y el estado
 * del auto en Gasolina; esta card los junta.
 */
export function MaintenanceFundCard() {
  const { data, isLoading } = useMaintenance()

  if (isLoading) {
    return (
      <div className="rounded-[22px] border border-border bg-card p-4 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded-lg" />
        <div className="mt-3 h-8 w-32 bg-muted rounded-lg" />
      </div>
    )
  }

  if (!data) return null

  if (!data.configured) {
    return (
      <div className="rounded-[22px] border border-dashed border-border bg-card/60 p-4 flex items-center gap-3">
        <div className="size-9 rounded-xl bg-secondary dark:bg-muted flex items-center justify-center text-muted-foreground shrink-0">
          <Settings2 className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Fondo sin configurar</p>
          <p className="text-xs text-muted-foreground">
            Sin configuracion no se puede calcular la reserva del 6% de tus turnos.
          </p>
        </div>
        <Link
          href="/conductor/settings"
          className="shrink-0 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary dark:hover:bg-muted transition-colors"
        >
          Configurar
        </Link>
      </div>
    )
  }

  if (!data.fund) {
    return (
      <div className="rounded-[22px] border border-dashed border-border bg-card/60 p-4 flex items-center gap-3">
        <div className="size-9 rounded-xl bg-secondary dark:bg-muted flex items-center justify-center text-muted-foreground shrink-0">
          <Wallet className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Elige una cuenta para el fondo</p>
          <p className="text-xs text-muted-foreground">
            Mientras no elijas una, la reserva del 6% se registra como gasto y el auto no lleva su propio ahorro.
          </p>
        </div>
        <Link
          href="/conductor/settings"
          className="shrink-0 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary dark:hover:bg-muted transition-colors"
        >
          Elegir cuenta
        </Link>
      </div>
    )
  }

  const { fund, absoluteOdometer, services } = data
  const negative = fund.balance < 0

  return (
    <div className="rounded-[22px] border border-border bg-card p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Wallet className="size-3.5 text-primary shrink-0" />
            <p className="text-xs font-semibold tracking-tight text-muted-foreground truncate">
              {fund.name}
            </p>
          </div>
          <p
            className={cn(
              'text-xl sm:text-2xl font-bold tabular-nums tracking-tight leading-none',
              negative ? 'text-destructive' : 'text-foreground'
            )}
          >
            {formatBs(fund.balance)}
          </p>
          {negative && (
            <p className="text-xs font-medium text-destructive flex items-center gap-1">
              <AlertTriangle className="size-3" />
              El fondo quedo en negativo
            </p>
          )}
        </div>

        {absoluteOdometer !== null && (
          <div className="text-right shrink-0 space-y-1">
            <div className="flex items-center gap-1.5 justify-end">
              <Gauge className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-semibold tracking-tight text-muted-foreground">
                Odometro
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold tabular-nums tracking-tight leading-none text-foreground">
              {absoluteOdometer.toLocaleString()}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground tabular-nums">km</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map((service) => (
          <ServiceRow key={service.type} service={service} fundBalance={fund.balance} />
        ))}
      </div>
    </div>
  )
}

function ServiceRow({
  service,
  fundBalance,
}: {
  service: MaintenanceService
  fundBalance: number
}) {
  const { label, kmRemaining, ratio, status, estimatedCost, lastServiceOdometer } = service

  const barColor =
    status === 'danger'
      ? 'bg-destructive'
      : status === 'warning'
        ? 'bg-amber-500'
        : 'bg-primary'

  const statusText =
    status === 'danger'
      ? 'Vence ahora'
      : status === 'warning'
        ? `Faltan ${kmRemaining.toLocaleString()} km`
        : `Faltan ${kmRemaining.toLocaleString()} km`

  const covered = fundBalance >= estimatedCost
  const moneyText = covered
    ? `Cubierto · ~${formatBs(estimatedCost)}`
    : `Faltan ${formatBs(estimatedCost - Math.max(0, fundBalance))}`

  return (
    <div className="rounded-xl border border-border bg-secondary/50 dark:bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <Droplets className="size-3 shrink-0 text-muted-foreground" />
        <p className="text-xs font-bold text-foreground truncate">{label}</p>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <p
          className={cn(
            'text-sm font-bold tabular-nums leading-none',
            status === 'danger' ? 'text-destructive' : 'text-foreground'
          )}
        >
          {statusText}
        </p>
        <p className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
          cada {service.intervalKm.toLocaleString()} km
        </p>
      </div>

      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', barColor)}
          style={{ width: `${Math.min(Math.max(ratio, 0), 1) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            'text-[11px] font-semibold tabular-nums',
            covered ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {moneyText}
        </p>
        {lastServiceOdometer === null && (
          <p className="text-[11px] font-medium text-muted-foreground shrink-0">
            Sin registro previo
          </p>
        )}
      </div>
    </div>
  )
}