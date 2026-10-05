'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, History, Info, Pencil, Plus, RefreshCcw, Sparkles, Trash2, Wallet, X } from 'lucide-react'
import { toast } from 'sonner'
import type { CarCycle, CarTrip } from '@/types/car-sharing'
import { cycleKm, implausibleTripReason } from '@/types/car-sharing'
import { formatTripDate } from '@/app/gasolina/utils/format'
import {
  addTripAction,
  closeCycleAction,
  deleteCycleAction,
  deleteTripAction,
  updateTripAction,
} from '../actions'
import { ConsumptionCard } from './ConsumptionCard'
import { PendingAccounts } from './PendingAccounts'
import { DangerZone } from './DangerZone'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface CarSharingDashboardProps {
  activeCycle: CarCycle
  closedCycles: CarCycle[]
}

const DEFAULT_USERS = ['Melissa', 'Jorge']

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="size-11 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold text-zinc-900 tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-zinc-500 capitalize">{subtitle}</p>}
      </div>
    </div>
  )
}

export function CarSharingDashboard({ activeCycle, closedCycles }: CarSharingDashboardProps) {
  const [isPending, startTransition] = useTransition()

  const [userName, setUserName] = useState<string>(DEFAULT_USERS[0])
  const [customName, setCustomName] = useState<string>('')
  const [currentKm, setCurrentKm] = useState<string>('')

  const [editingTripId, setEditingTripId] = useState<number | null>(null)
  const [editUserName, setEditUserName] = useState<string>('')
  const [editKm, setEditKm] = useState<string>('')

  const [gasAmount, setGasAmount] = useState<string>('')
  const [gasLiters, setGasLiters] = useState<string>('')
  const [paidBy, setPaidBy] = useState<string>(DEFAULT_USERS[0])
  const [showSettledHint, setShowSettledHint] = useState(false)

  const lastTripInActive = activeCycle.trips[activeCycle.trips.length - 1]
  const lastTripInClosed = closedCycles[0]?.trips[closedCycles[0].trips.length - 1]
  const lastTrip = lastTripInActive || lastTripInClosed

  const activeTotalKm = cycleKm(activeCycle)

  const activeBreakdown = activeCycle.trips.reduce<Record<string, number>>((acc, trip) => {
    acc[trip.userName] = (acc[trip.userName] || 0) + trip.totalKm
    return acc
  }, {})

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault()

    const finalUserName = userName === 'Otro' ? customName.trim() : userName
    if (!finalUserName) {
      toast.error('Ingresa un nombre válido')
      return
    }

    const curKm = parseInt(currentKm, 10)
    if (isNaN(curKm) || curKm < 0 || curKm > 999) {
      toast.error('Revisa el odómetro: va de 0 a 999')
      return
    }

    const initKm = lastTrip ? lastTrip.finalKm : curKm
    const hadTrip = Boolean(lastTrip)

    // No bloquea el registro: el wrap del odometro genera kilometrajes grandes
    // legitimos. Solo avisa, porque colar un digito mal tipeado falsea el reparto
    // de deuda y la serie de consumo sin que nada lo delate.
    if (hadTrip) {
      const warning = implausibleTripReason(initKm, curKm)
      if (warning && !window.confirm(`${warning}\n\n¿Registrarlo igual?`)) return
    }

    startTransition(async () => {
      try {
        await addTripAction({
          userName: finalUserName,
          initialKm: initKm,
          finalKm: curKm,
          clientTimestamp: Date.now(),
        })
        toast.success(hadTrip ? 'Viaje registrado' : 'Odómetro base registrado')
        setCurrentKm('')
      } catch {
        toast.error('Error al registrar el viaje')
      }
    })
  }

  const handleDeleteTrip = (createdAt: number) => {
    // Confirmar siempre: borrar km redistribuye el costo del ciclo entre los
    // conductores, asi que un click de mas cambia lo que debe cada quien.
    if (
      !window.confirm(
        '¿Eliminar este viaje? Los kilómetros se descuentan del ciclo y el ' +
          'reparto se recalcula.',
      )
    ) {
      return
    }

    startTransition(async () => {
      try {
        await deleteTripAction(createdAt)
        toast.success('Viaje eliminado')
      } catch {
        toast.error('Error al eliminar')
      }
    })
  }

  const handleEditTripStart = (trip: CarTrip) => {
    setEditingTripId(trip.createdAt)
    setEditUserName(trip.userName)
    setEditKm(trip.finalKm.toString())
  }

  const handleEditTripSave = (createdAt: number) => {
    const finalUserName = editUserName.trim()
    if (!finalUserName) {
      toast.error('Ingresa un nombre válido')
      return
    }

    const curKm = parseInt(editKm, 10)
    if (isNaN(curKm) || curKm < 0 || curKm > 999) {
      toast.error('Revisa el odómetro: va de 0 a 999')
      return
    }

    const edited = activeCycle?.trips.find(t => t.createdAt === createdAt)
    if (edited) {
      const warning = implausibleTripReason(edited.initialKm, curKm)
      if (warning && !window.confirm(`${warning}\n\n¿Guardar igual?`)) return
    }

    startTransition(async () => {
      try {
        await updateTripAction(createdAt, { userName: finalUserName, finalKm: curKm })
        setEditingTripId(null)
        toast.success('Viaje actualizado')
      } catch {
        toast.error('Error al actualizar')
      }
    })
  }

  const handleCloseCycle = () => {
    const amount = parseFloat(gasAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Monto de gasolina no válido')
      return
    }
    if (activeCycle.trips.length === 0) {
      toast.error('No puedes cerrar un ciclo sin viajes')
      return
    }

    const liters = gasLiters.trim() === '' ? null : parseFloat(gasLiters)
    if (liters !== null && (isNaN(liters) || liters <= 0)) {
      toast.error('Los litros deben ser mayores a cero, o deja el campo vacío')
      return
    }

    startTransition(async () => {
      try {
        await closeCycleAction(amount, paidBy, liters)
        setGasAmount('')
        setGasLiters('')
        toast.success(liters ? 'Ciclo cerrado con litros' : 'Ciclo cerrado. Anota los litros la próxima para ver el consumo')
      } catch {
        toast.error('Error al cerrar el ciclo')
      }
    })
  }

  const handleDeleteCycle = (id: string) => {
    startTransition(async () => {
      try {
        await deleteCycleAction(id)
        toast.success('Cuenta eliminada')
      } catch {
        toast.error('Error al eliminar')
      }
    })
  }

  const tripsReversed = [...activeCycle.trips].reverse()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[22px] border border-zinc-200 bg-white p-6">
            <SectionHeader
              icon={<Plus className="size-4 text-zinc-400" />}
              title="Registro de kilometraje"
              subtitle="Viajes que no registraste como turno"
            />

            <form onSubmit={handleAddTrip} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-600">Conductor</Label>
                  <Select value={userName} onValueChange={setUserName} disabled={isPending}>
                    <SelectTrigger className="h-11 w-full bg-white border-zinc-200 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-200">
                      {DEFAULT_USERS.map(name => (
                        <SelectItem key={name} value={name} className="cursor-pointer">
                          {name}
                        </SelectItem>
                      ))}
                      <SelectItem value="Otro" className="cursor-pointer">Otro…</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-600">Odómetro actual</Label>
                  <Input
                    type="number"
                    min="0"
                    max="999"
                    value={currentKm}
                    onChange={e => setCurrentKm(e.target.value)}
                    placeholder={lastTrip ? `Mayor a ${lastTrip.finalKm}` : '430'}
                    disabled={isPending}
                    className="h-11 bg-white border-zinc-200 rounded-xl tabular-nums"
                  />
                </div>
              </div>

              {userName === 'Otro' && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-zinc-600">Nombre</Label>
                  <Input
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="Ej: Pedro"
                    disabled={isPending}
                    className="h-11 bg-white border-zinc-200 rounded-xl"
                  />
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl bg-zinc-50/50 border border-zinc-100 px-3 py-2.5">
                <Info className="size-3.5 shrink-0 mt-0.5 text-zinc-400" />
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Los km de un turno ya se suman al odómetro del auto al
                  registrarlo en{' '}
                  <Link href="/conductor" className="text-emerald-600 underline underline-offset-2">
                    Conductor
                  </Link>
                  . Usa esto solo para viajes que no son turnos.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-medium"
              >
                {isPending ? <RefreshCcw className="size-4 animate-spin" /> : 'Registrar'}
              </Button>
            </form>
          </div>

          <div className="rounded-[22px] border border-zinc-200 bg-white p-6">
            <SectionHeader
              icon={<History className="size-4 text-zinc-400" />}
              title="Historial del ciclo"
              subtitle={`${activeCycle.trips.length} viaje${activeCycle.trips.length === 1 ? '' : 's'}`}
            />

            <div className="rounded-xl border border-zinc-100 overflow-hidden mb-4">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-zinc-100">
                    <TableHead className="text-[11px] font-medium text-zinc-500 px-4 py-3">Día</TableHead>
                    <TableHead className="text-[11px] font-medium text-zinc-500 py-3">Conductor</TableHead>
                    <TableHead className="text-[11px] font-medium text-zinc-500 py-3">Recorrido</TableHead>
                    <TableHead className="text-[11px] font-medium text-zinc-500 py-3 text-right">km</TableHead>
                    <TableHead className="px-4 py-3" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tripsReversed.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-xs text-zinc-400">
                        Sin viajes en este ciclo
                      </TableCell>
                    </TableRow>
                  ) : (
                    tripsReversed.map(trip => {
                      const isEditing = editingTripId === trip.createdAt
                      return (
                        <TableRow key={trip.createdAt} className="group border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
                          <TableCell className="px-4 py-3 text-[11px] text-zinc-500 tabular-nums">
                            {formatTripDate(trip)}
                            {trip.source === 'shift' && (
                              <span
                                className="ml-2 inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500"
                                title="Registrado automáticamente desde un turno de /conductor. No lo sumes otra vez a mano."
                              >
                                <Sparkles className="size-2.5" />
                                Turno
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-xs font-medium text-zinc-900">
                            {isEditing ? (
                              <Select value={editUserName} onValueChange={setEditUserName} disabled={isPending}>
                                <SelectTrigger className="h-8 text-xs bg-white border-zinc-200 rounded-lg w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DEFAULT_USERS.map(name => (
                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              trip.userName
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-[11px] text-zinc-500 tabular-nums">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <span>{trip.initialKm.toString().padStart(3, '0')} →</span>
                                <Input
                                  type="number"
                                  value={editKm}
                                  onChange={e => setEditKm(e.target.value)}
                                  disabled={isPending}
                                  className="h-8 w-20 text-xs bg-white border-zinc-200 rounded-lg"
                                />
                              </div>
                            ) : (
                              `${trip.initialKm.toString().padStart(3, '0')} → ${trip.finalKm.toString().padStart(3, '0')}`
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-right text-xs font-medium text-emerald-600 tabular-nums">
                            {!isEditing && `+${trip.totalKm}`}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isPending}
                                  className="size-8 rounded-lg hover:text-zinc-900 hover:bg-zinc-100"
                                  onClick={() => handleEditTripSave(trip.createdAt)}
                                >
                                  <Check className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isPending}
                                  className="size-8 rounded-lg hover:text-zinc-500 hover:bg-zinc-100"
                                  onClick={() => setEditingTripId(null)}
                                >
                                  <X className="size-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1 transition-opacity max-sm:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isPending}
                                  className="size-8 rounded-lg hover:text-zinc-900 hover:bg-zinc-100"
                                  onClick={() => handleEditTripStart(trip)}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isPending}
                                  className="size-8 rounded-lg hover:text-zinc-900 hover:bg-zinc-100"
                                  onClick={() => handleDeleteTrip(trip.createdAt)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-xl bg-zinc-50/50 border border-zinc-100 p-4">
              <p className="text-[11px] font-medium text-zinc-600 mb-1">
                Kilometraje del ciclo
              </p>
              <p className="text-2xl font-semibold text-zinc-900 tabular-nums">
                {activeTotalKm}
                <span className="ml-1 text-xs font-medium text-zinc-400">km</span>
              </p>
              {Object.keys(activeBreakdown).length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap gap-x-5 gap-y-2">
                  {Object.entries(activeBreakdown).map(([name, km]) => (
                    <div key={name} className="flex items-baseline gap-2">
                      <span className="text-[11px] text-zinc-500">{name}</span>
                      <span className="text-xs font-semibold text-zinc-900 tabular-nums">
                        {km} km
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[22px] border border-zinc-200 bg-white p-6">
            <SectionHeader
              icon={<Wallet className="size-4 text-zinc-400" />}
              title="Cerrar ciclo y cobrar"
              subtitle="Registra la carga de gasolina"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-600">Monto (Bs)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={gasAmount}
                  onChange={e => setGasAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={isPending}
                  className="h-11 bg-white border-zinc-200 rounded-xl tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-600">Litros</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={gasLiters}
                  onChange={e => setGasLiters(e.target.value)}
                  placeholder="Opcional"
                  disabled={isPending}
                  className="h-11 bg-white border-zinc-200 rounded-xl tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-600">¿Quién pagó?</Label>
                <Select value={paidBy} onValueChange={setPaidBy} disabled={isPending}>
                  <SelectTrigger className="h-11 w-full bg-white border-zinc-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-200">
                    {DEFAULT_USERS.map(name => (
                      <SelectItem key={name} value={name} className="cursor-pointer">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!showSettledHint && (
              <button
                type="button"
                onClick={() => setShowSettledHint(true)}
                className="mt-4 flex items-start gap-2 text-left text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <Info className="size-3.5 shrink-0 mt-0.5" />
                <span>
                  ¿Por qué los litros son opcionales? Déjalos vacíos si no los
                  anotaste. Con litros podemos detectar si el auto está gastando
                  más de lo normal.
                </span>
              </button>
            )}

            <Button
              onClick={handleCloseCycle}
              disabled={isPending || activeCycle.trips.length === 0}
              className="w-full h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-medium mt-4"
            >
              Registrar carga y cobrar
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <ConsumptionCard cycles={closedCycles} />
          <PendingAccounts cycles={closedCycles} onDeleteCycle={handleDeleteCycle} />
          <DangerZone />
        </div>
      </div>
    </div>
  )
}