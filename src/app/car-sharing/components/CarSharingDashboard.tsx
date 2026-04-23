'use client'

import React, { useState, useMemo, useTransition } from 'react'
import { CarCycle, CarTrip } from '@/repositories/car-sharing.repository'
import { addTripAction, deleteTripAction, closeCycleAction, deleteCycleAction, resetAllAction } from '../actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, RefreshCcw, Save, Plus, Wallet, History, ArrowRight, UserCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface CarSharingDashboardProps {
  activeCycle: CarCycle
  closedCycles: CarCycle[]
}

const DEFAULT_USERS = ['Melissa', 'Jorge']

export function CarSharingDashboard({ activeCycle, closedCycles }: CarSharingDashboardProps) {
  const [isPending, startTransition] = useTransition()
  
  // Trip form state
  const [userName, setUserName] = useState<string>(DEFAULT_USERS[0])
  const [customName, setCustomName] = useState<string>('')
  const [currentKm, setCurrentKm] = useState<string>('')
  
  // Closing cycle state
  const [gasAmount, setGasAmount] = useState<string>('')
  const [paidBy, setPaidBy] = useState<string>(DEFAULT_USERS[0])

  const lastTripInActive = activeCycle.trips[activeCycle.trips.length - 1]
  const lastTripInClosed = closedCycles[0]?.trips[closedCycles[0].trips.length - 1]
  const lastTrip = lastTripInActive || lastTripInClosed

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault()
    
    const finalUserName = userName === 'Otro' ? customName : userName
    if (!finalUserName.trim()) {
      toast.error('Por favor ingresa un nombre válido')
      return
    }

    const curKm = parseInt(currentKm, 10)
    if (isNaN(curKm) || curKm < 0) {
      toast.error('Revisa el valor del odómetro.')
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
        toast.success(lastTrip ? 'Viaje registrado' : 'Odómetro base registrado')
        setCurrentKm('')
      } catch (err) {
        toast.error('Error al registrar el viaje')
      }
    })
  }

  const handleDeleteTrip = (createdAt: number) => {
    startTransition(async () => {
      try {
        await deleteTripAction(createdAt)
        toast.success('Viaje eliminado')
      } catch(err) {
        toast.error('Error al eliminar')
      }
    })
  }

  const handleCloseCycle = () => {
    const val = parseFloat(gasAmount)
    if (isNaN(val) || val <= 0) {
      toast.error('Monto de gasolina no válido')
      return
    }
    if (activeCycle.trips.length === 0) {
      toast.error('No puedes cerrar un ciclo sin viajes')
      return
    }
    
    startTransition(async () => {
      try {
        await closeCycleAction(val, paidBy)
        setGasAmount('')
        toast.success('Ciclo cerrado y movido a pendientes')
      } catch (err) {
        toast.error('Error al cerrar el ciclo')
      }
    })
  }

  const handleDeleteCycle = (id: string) => {
    startTransition(async () => {
      try {
        await deleteCycleAction(id)
        toast.success('Cuenta pendiente eliminada')
      } catch(err) {
        toast.error('Error al eliminar')
      }
    })
  }

  const handleResetAll = () => {
    const confirm = window.confirm('¿Estás seguro de que quieres borrar ABSOLUTAMENTE TODO?')
    if (!confirm) return

    startTransition(async () => {
      try {
        await resetAllAction()
        toast.success('Todo borrado correctamente')
      } catch(err) {
        toast.error('Error al reiniciar')
      }
    })
  }

  const { totalKmActive, activeBreakdown } = useMemo(() => {
    const total = activeCycle.trips.reduce((acc, trip) => acc + trip.totalKm, 0)
    const map = new Map<string, number>()
    activeCycle.trips.forEach(trip => {
      map.set(trip.userName, (map.get(trip.userName) || 0) + trip.totalKm)
    })
    const breakdown = Array.from(map.entries()).map(([name, km]) => ({ name, km }))
    return { totalKmActive: total, activeBreakdown: breakdown }
  }, [activeCycle.trips])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
      
      {/* COLUMNA IZQUIERDA: CICLO ACTIVO (2/3) */}
      <div className="lg:col-span-2 space-y-16">
        
        {/* Registro de Viaje */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-150">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-8 rounded-lg bg-neutral-950 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-sm">
              <Plus className="size-4" />
            </div>
            <h3 className="text-xl font-light tracking-tight">Registro de Kilometraje</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <form onSubmit={handleAddTrip} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Conductor</Label>
                <Select value={userName} onValueChange={setUserName} disabled={isPending}>
                  <SelectTrigger className="h-12 bg-transparent border-t-0 border-x-0 border-b border-neutral-100 dark:border-neutral-900 rounded-none px-0 focus:ring-0 focus:border-emerald-500 transition-colors shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-neutral-100 dark:border-neutral-800 shadow-xl overflow-hidden">
                    {DEFAULT_USERS.map(name => (
                      <SelectItem key={name} value={name} className="py-3 cursor-pointer">{name}</SelectItem>
                    ))}
                    <SelectItem value="Otro">Otro...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {userName === 'Otro' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Nombre</Label>
                  <Input 
                    value={customName} 
                    onChange={e => setCustomName(e.target.value)} 
                    placeholder="Ej: Pedro"
                    disabled={isPending}
                    className="h-12 bg-transparent border-t-0 border-x-0 border-b border-neutral-100 dark:border-neutral-900 rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-500 transition-colors shadow-none"
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
                    className="h-16 text-3xl font-light bg-transparent border-t-0 border-x-0 border-b border-neutral-100 dark:border-neutral-900 rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-500 transition-colors shadow-none tabular-nums placeholder:text-neutral-200 dark:placeholder:text-neutral-800"
                  />
                  {lastTrip && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-neutral-400 pointer-events-none italic">
                      Último: <span className="text-neutral-900 dark:text-white not-italic font-medium tabular-nums">{lastTrip.finalKm.toString().padStart(3, '0')}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all font-medium text-base shadow-lg shadow-neutral-950/10 dark:shadow-white/5 active:scale-[0.98]" 
                disabled={isPending}
              >
                {isPending ? <RefreshCcw className="size-5 animate-spin" /> : "Registrar"}
              </Button>
            </form>

            <div className="p-8 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/20 border border-neutral-100 dark:border-neutral-900/50 h-full flex flex-col justify-center space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium mb-2 text-center">KM Acumulados Ciclo</p>
                <p className="text-5xl font-light text-center tabular-nums text-neutral-900 dark:text-white">
                  {totalKmActive} <span className="text-xl text-neutral-400">km</span>
                </p>
              </div>
              
              {activeBreakdown.length > 0 && (
                <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                  <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold text-center">Desglose por persona</p>
                  <div className="flex justify-center gap-6">
                    {activeBreakdown.map(user => (
                      <div key={user.name} className="text-center">
                        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{user.name}</p>
                        <p className="text-lg font-light tabular-nums text-emerald-600">{user.km} <span className="text-[10px]">km</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Historial de Viajes */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-8 rounded-lg bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-neutral-500 shadow-sm border border-neutral-100 dark:border-neutral-800">
              <History className="size-4" />
            </div>
            <h3 className="text-xl font-light tracking-tight">Historial del Ciclo</h3>
          </div>

          <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-[2rem] overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-neutral-50 dark:border-neutral-900">
                  <TableHead className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 px-8 py-6">Día</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 py-6">Usuario</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 py-6">Recorrido</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 py-6 text-right">KM</TableHead>
                  <TableHead className="px-8 py-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCycle.trips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-neutral-400 text-sm italic">Sin viajes en este ciclo</TableCell>
                  </TableRow>
                ) : (
                  [...activeCycle.trips].reverse().map(trip => (
                    <TableRow key={trip.createdAt} className="group border-b border-neutral-50 dark:border-neutral-900 last:border-0 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                      <TableCell className="px-8 py-5 text-neutral-400 text-xs font-medium tabular-nums">{trip.date}</TableCell>
                      <TableCell className="py-5 font-medium text-neutral-900 dark:text-neutral-100">{trip.userName}</TableCell>
                      <TableCell className="py-5 font-light text-neutral-500 tabular-nums">
                        {trip.initialKm.toString().padStart(3, '0')} → {trip.finalKm.toString().padStart(3, '0')}
                      </TableCell>
                      <TableCell className="py-5 text-right font-medium tabular-nums text-emerald-600">+{trip.totalKm}</TableCell>
                      <TableCell className="px-8 py-5 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={isPending}
                          className="size-8 rounded-lg opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                          onClick={() => handleDeleteTrip(trip.createdAt)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Cierre de Ciclo */}
        <section className="p-8 md:p-12 rounded-[2.5rem] bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
          <div className="flex flex-col md:flex-row items-end gap-8">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                  <Wallet className="size-4" />
                </div>
                <h3 className="text-xl font-light tracking-tight text-emerald-900 dark:text-emerald-100">Cargar Gasolina y Cobrar</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-emerald-600/60 dark:text-emerald-400/60 font-bold">Monto Total (Bs)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01"
                    value={gasAmount} 
                    onChange={e => setGasAmount(e.target.value)} 
                    placeholder="0.00"
                    disabled={isPending}
                    className="h-12 bg-transparent border-t-0 border-x-0 border-b border-emerald-200 dark:border-emerald-800 rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-500 transition-colors shadow-none text-2xl font-light text-emerald-900 dark:text-emerald-50 tabular-nums"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-emerald-600/60 dark:text-emerald-400/60 font-bold">¿Quién pagó?</Label>
                  <Select value={paidBy} onValueChange={setPaidBy} disabled={isPending}>
                    <SelectTrigger className="h-12 bg-transparent border-t-0 border-x-0 border-b border-emerald-200 dark:border-emerald-800 rounded-none px-0 focus:ring-0 focus:border-emerald-500 transition-colors shadow-none text-emerald-900 dark:text-emerald-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-emerald-100 dark:border-emerald-800 shadow-xl">
                      {DEFAULT_USERS.map(name => (
                        <SelectItem key={name} value={name} className="py-3 cursor-pointer">{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleCloseCycle} 
              className="h-16 px-10 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-medium text-lg shadow-lg shadow-emerald-600/20 active:scale-[0.98]" 
              disabled={isPending || activeCycle.trips.length === 0}
            >
              Registrar Carga y Cobrar <ArrowRight className="size-5 ml-2" />
            </Button>
          </div>
        </section>

        <div className="pt-8 flex justify-center">
          <Button 
            onClick={handleResetAll} 
            variant="ghost" 
            className="text-[10px] uppercase tracking-widest text-neutral-300 hover:text-red-500 transition-colors hover:bg-transparent" 
            disabled={isPending}
          >
            Limpiar todo y borrar historial completo
          </Button>
        </div>
      </div>

      {/* COLUMNA DERECHA: CUENTAS PENDIENTES (1/3) */}
      <aside className="lg:col-span-1 space-y-8 animate-in fade-in slide-in-from-right-4 duration-1000 delay-700">
        <div className="sticky top-12 space-y-8">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
              <UserCheck className="size-4" />
            </div>
            <h3 className="text-xl font-light tracking-tight">Cuentas Pendientes</h3>
          </div>

          {closedCycles.length === 0 ? (
            <div className="p-12 border border-dashed border-neutral-100 dark:border-neutral-900 rounded-[2.5rem] text-center space-y-3">
              <div className="size-10 rounded-full bg-neutral-50 dark:bg-neutral-900 mx-auto flex items-center justify-center text-neutral-300">
                <Save className="size-4" />
              </div>
              <p className="text-xs text-neutral-400 italic">No hay cuentas por cobrar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {closedCycles.map(cycle => {
                const payer = cycle.paidBy
                const debt = cycle.debtSummary.find(d => d.name !== payer)
                const startDate = new Date(cycle.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
                const endDate = cycle.endDate ? new Date(cycle.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '?'

                return (
                  <div key={cycle.id} className="group relative p-6 rounded-3xl bg-white dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-900 shadow-sm hover:shadow-md transition-all duration-300">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteCycle(cycle.id)}
                      className="absolute top-4 right-4 size-8 rounded-lg opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-neutral-50 dark:border-neutral-800 pb-3">
                        <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">{startDate} — {endDate}</span>
                        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{cycle.gasAmount} Bs</span>
                      </div>
                      
                      <div className="space-y-3">
                        {cycle.debtSummary.map(user => (
                          <div key={user.name} className="flex justify-between items-center text-xs">
                            <span className={cn("font-medium", user.name === payer ? "text-neutral-400" : "text-neutral-900 dark:text-neutral-100")}>
                              {user.name} {user.name === payer && "(Pagó)"}
                            </span>
                            <span className="tabular-nums text-neutral-500">{user.totalKm} km ({user.percentage.toFixed(0)}%)</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-emerald-100/50 dark:border-emerald-900/50 flex flex-col gap-1">
                        <p className="text-[10px] uppercase tracking-tighter text-neutral-400 font-bold">Saldo a transferir</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-light tracking-tight tabular-nums text-emerald-600">{debt?.cost.toFixed(2)}</span>
                          <span className="text-sm font-medium text-emerald-600/60 uppercase">Bs</span>
                        </div>
                        <p className="text-[10px] font-bold text-neutral-950 dark:text-white uppercase tracking-tight italic">
                          {debt?.name} → {payer}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </aside>

    </div>
  )
}
