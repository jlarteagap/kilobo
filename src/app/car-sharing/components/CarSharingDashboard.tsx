'use client'

import React, { useState, useMemo, useTransition } from 'react'
import { CarTrip } from '@/repositories/car-sharing.repository'
import { addTripAction, updateGasAmountAction, deleteTripAction, resetPeriodAction } from '../actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, RefreshCcw, Save, Plus, Wallet, History } from 'lucide-react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface CarSharingDashboardProps {
  initialTrips: CarTrip[]
  initialGasAmount: number
}

const DEFAULT_USERS = ['Melissa', 'Jorge']

export function CarSharingDashboard({ initialTrips, initialGasAmount }: CarSharingDashboardProps) {
  const [isPending, startTransition] = useTransition()
  
  // Trip form state
  const [userName, setUserName] = useState<string>(DEFAULT_USERS[0])
  const [customName, setCustomName] = useState<string>('')
  const [currentKm, setCurrentKm] = useState<string>('')
  
  // Gas form state
  const [gasAmount, setGasAmount] = useState<string>(initialGasAmount.toString())

  const lastTrip = initialTrips[initialTrips.length - 1]

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault()
    
    const finalUserName = userName === 'Otro' ? customName : userName
    if (!finalUserName.trim()) {
      toast.error('Por favor ingresa un nombre válido')
      return
    }

    const curKm = parseInt(currentKm, 10)

    if (isNaN(curKm) || curKm < 0) {
      toast.error('Revisa el valor del odómetro. Debe ser numérico y positivo.')
      return
    }

    const initKm = lastTrip ? lastTrip.finalKm : curKm

    startTransition(async () => {
      try {
        await addTripAction({
          userName: finalUserName,
          initialKm: initKm,
          finalKm: curKm
        })
        toast.success(lastTrip ? 'Viaje registrado correctamente' : 'Odómetro base registrado')
        setCurrentKm('')
      } catch (err) {
        toast.error('Hubo un error al registrar el viaje')
      }
    })
  }

  const handleDeleteTrip = (id: string) => {
    startTransition(async () => {
      try {
        await deleteTripAction(id)
        toast.success('Viaje eliminado')
      } catch(err) {
        toast.error('Hubo un error al eliminar el viaje')
      }
    })
  }

  const handleUpdateGas = () => {
    const val = parseFloat(gasAmount)
    if (isNaN(val) || val < 0) {
      toast.error('Monto de gasolina no válido')
      return
    }
    
    startTransition(async () => {
      try {
        await updateGasAmountAction(val)
        toast.success('Total de gasolina actualizado')
      } catch (err) {
        toast.error('Hubo un error al actualizar el monto')
      }
    })
  }

  const handleReset = () => {
    const confirm = window.confirm('¿Estás seguro de que quieres limpiar todo el registro actual?')
    if (!confirm) return

    startTransition(async () => {
      try {
        await resetPeriodAction()
        setGasAmount('0')
        toast.success('Ciclo reiniciado correctamente')
      } catch(err) {
        toast.error('Error al reiniciar')
      }
    })
  }

  // Calculations
  const totalKmOverall = useMemo(() => {
    return initialTrips.reduce((acc, trip) => acc + trip.totalKm, 0)
  }, [initialTrips])

  const summaryByUser = useMemo(() => {
    const map = new Map<string, number>()
    initialTrips.forEach(trip => {
      map.set(trip.userName, (map.get(trip.userName) || 0) + trip.totalKm)
    })

    const parsedGasAmount = parseFloat(gasAmount) || 0

    const arr = Array.from(map.entries()).map(([name, totalKm]) => {
      const percentage = totalKmOverall > 0 ? (totalKm / totalKmOverall) : 0
      const cost = percentage * parsedGasAmount
      return {
        name,
        totalKm,
        percentage: percentage * 100,
        cost
      }
    })

    return arr.sort((a,b) => b.totalKm - a.totalKm)
  }, [initialTrips, totalKmOverall, gasAmount])

  return (
    <div className="space-y-16 lg:space-y-24">
      
      {/* SECCIÓN 1: RESUMEN (Lo más importante primero) */}
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-150">
        <div className="flex flex-col md:flex-row justify-between items-baseline gap-4 mb-8">
          <h2 className="text-2xl font-light text-neutral-900 dark:text-neutral-100">Estado Actual</h2>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium mb-1">Recorrido Total</p>
              <p className="text-2xl font-light tabular-nums text-neutral-900 dark:text-neutral-100">{totalKmOverall} <span className="text-sm">km</span></p>
            </div>
            <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium mb-1">Fondo Gasolina</p>
              <p className="text-2xl font-light tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">{summaryByUser.reduce((acc, r) => acc + r.cost, 0).toFixed(0)} <span className="text-sm">Bs</span></p>
            </div>
          </div>
        </div>

        {summaryByUser.length === 0 ? (
          <div className="h-40 flex items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl text-neutral-400 text-sm italic">
            Sin datos para este periodo
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summaryByUser.map((user) => (
              <div 
                key={user.name}
                className="group relative p-8 rounded-3xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/30 dark:bg-neutral-900/10 hover:bg-white dark:hover:bg-neutral-900/40 transition-all duration-500"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{user.name}</h3>
                    <p className="text-xs text-neutral-500">{user.totalKm} km recorridos ({user.percentage.toFixed(0)}%)</p>
                  </div>
                  <div className="size-10 rounded-full bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center text-sm font-medium shadow-sm transition-transform group-hover:scale-110">
                    {user.name.charAt(0)}
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-light tracking-tight text-emerald-600 dark:text-emerald-400">{user.cost.toFixed(2)}</span>
                  <span className="text-sm font-medium text-emerald-600/60 dark:text-emerald-400/60">Bs</span>
                </div>
                <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECCIÓN 2: ACCIONES / FORMS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
        
        {/* Registro de Viaje */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-neutral-950 dark:bg-white flex items-center justify-center text-white dark:text-black">
              <Plus className="size-4" />
            </div>
            <h3 className="text-xl font-light tracking-tight">Nuevo Registro</h3>
          </div>

          <form onSubmit={handleAddTrip} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Conductor</Label>
              <Select value={userName} onValueChange={setUserName} disabled={isPending}>
                <SelectTrigger className="h-12 bg-transparent border-t-0 border-x-0 border-b border-neutral-200 dark:border-neutral-800 rounded-none px-0 focus:ring-0 focus:border-emerald-500 transition-colors shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden">
                  {DEFAULT_USERS.map(name => (
                    <SelectItem key={name} value={name} className="py-3 cursor-pointer">{name}</SelectItem>
                  ))}
                  <SelectItem value="Otro">Otro...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userName === 'Otro' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Nombre del Conductor</Label>
                <Input 
                  value={customName} 
                  onChange={e => setCustomName(e.target.value)} 
                  placeholder="Ej: Melissa"
                  disabled={isPending}
                  className="h-12 bg-transparent border-t-0 border-x-0 border-b border-neutral-200 dark:border-neutral-800 rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-500 transition-colors shadow-none"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Odómetro Actual</Label>
              <div className="relative">
                <Input 
                  type="number" 
                  min="0" 
                  max="999" 
                  value={currentKm} 
                  onChange={e => setCurrentKm(e.target.value)} 
                  placeholder={lastTrip ? `Mayor a ${lastTrip.finalKm}` : "430"}
                  disabled={isPending}
                  className="h-16 text-2xl font-light bg-transparent border-t-0 border-x-0 border-b border-neutral-200 dark:border-neutral-800 rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-500 transition-colors shadow-none tabular-nums placeholder:text-neutral-200 dark:placeholder:text-neutral-800"
                />
                {lastTrip && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-neutral-400 pointer-events-none italic">
                    Base actual: <span className="text-neutral-900 dark:text-white not-italic font-medium">{lastTrip.finalKm.toString().padStart(3, '0')}</span>
                  </div>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all font-medium text-base shadow-lg shadow-neutral-950/10 dark:shadow-white/5 active:scale-[0.98]" 
              disabled={isPending}
            >
              {isPending ? <RefreshCcw className="size-5 animate-spin" /> : "Registrar Recorrido"}
            </Button>
          </form>
        </div>

        {/* Config / Gasolina */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Wallet className="size-4" />
            </div>
            <h3 className="text-xl font-light tracking-tight">Configuración</h3>
          </div>

          <div className="space-y-12">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Total Inversión Gasolina (Bs)</Label>
              <div className="flex items-end gap-3">
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={gasAmount} 
                  onChange={e => setGasAmount(e.target.value)} 
                  disabled={isPending}
                  className="h-12 bg-transparent border-t-0 border-x-0 border-b border-neutral-200 dark:border-neutral-800 rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-500 transition-colors shadow-none text-xl font-light"
                />
                <Button 
                  onClick={handleUpdateGas} 
                  variant="ghost" 
                  size="icon"
                  className="size-12 rounded-xl text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors"
                  disabled={isPending}
                >
                  <Save className="size-5" />
                </Button>
              </div>
            </div>

            <div className="pt-4 p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 space-y-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Acciones Críticas</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Al reiniciar el ciclo se eliminarán todos los viajes registrados y el monto de gasolina volverá a cero. Úsalo al finalizar el cobro semanal.
              </p>
              <Button 
                onClick={handleReset} 
                variant="outline" 
                className="w-full h-12 rounded-xl border-neutral-200 dark:border-neutral-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 border-dashed" 
                disabled={isPending || initialTrips.length === 0}
              >
                <RefreshCcw className="size-4 mr-2" />
                Limpiar todo y reiniciar ciclo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: HISTORIAL */}
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
        <div className="flex items-center gap-3 mb-8">
          <div className="size-8 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-500">
            <History className="size-4" />
          </div>
          <h3 className="text-xl font-light tracking-tight">Movimientos Recientes</h3>
        </div>

        {initialTrips.length === 0 ? (
          <div className="py-12 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl text-center text-sm text-neutral-400 italic">
            No se han registrado movimientos. Comienza con el primer registro base.
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-[2rem] overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-neutral-50 dark:border-neutral-900">
                  <TableHead className="w-1/3 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 px-8 py-6">Usuario</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 py-6">Registro</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 py-6 text-right">Km</TableHead>
                  <TableHead className="px-8 py-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...initialTrips].reverse().map(trip => (
                  <TableRow key={trip.id} className="group border-b border-neutral-50 dark:border-neutral-900 last:border-0 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                    <TableCell className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="size-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold">
                          {trip.userName.charAt(0)}
                        </div>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">{trip.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 font-light text-neutral-500 tabular-nums">
                      {trip.initialKm.toString().padStart(3, '0')} → <span className="text-neutral-900 dark:text-neutral-100">{trip.finalKm.toString().padStart(3, '0')}</span>
                    </TableCell>
                    <TableCell className="py-5 text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      +{trip.totalKm}
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={isPending}
                        className="size-10 rounded-xl opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                        onClick={() => handleDeleteTrip(trip.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
