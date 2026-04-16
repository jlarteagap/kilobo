'use client'

import React, { useState, useMemo, useTransition } from 'react'
import { CarTrip } from '@/repositories/car-sharing.repository'
import { addTripAction, updateGasAmountAction, deleteTripAction, resetPeriodAction } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, RefreshCcw, Save, Car, DollarSign } from 'lucide-react'
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
  const [initialKm, setInitialKm] = useState<string>('')
  const [finalKm, setFinalKm] = useState<string>('')
  
  // Gas form state
  const [gasAmount, setGasAmount] = useState<string>(initialGasAmount.toString())

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault()
    
    const finalUserName = userName === 'Otro' ? customName : userName
    if (!finalUserName.trim()) {
      toast.error('Por favor ingresa un nombre válido')
      return
    }

    const initKm = parseInt(initialKm, 10)
    const finKm = parseInt(finalKm, 10)

    if (isNaN(initKm) || isNaN(finKm) || initKm < 0 || finKm < 0) {
      toast.error('Revisa los valores del odómetro. Deben ser numéricos y positivos.')
      return
    }

    startTransition(async () => {
      try {
        await addTripAction({
          userName: finalUserName,
          initialKm: initKm,
          finalKm: finKm
        })
        toast.success('Viaje registrado correctamente')
        setInitialKm(finalKm) // set next initial km to the current final
        setFinalKm('')
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

  // Calculate calculations
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

    return arr.sort((a,b) => b.totalKm - a.totalKm) // Sort highest km first
  }, [initialTrips, totalKmOverall, gasAmount])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Columna Izquierda: Formularios */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Formularios Viaje */}
        <Card className="shadow-none border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Car className="size-5 text-emerald-600" />
              Nuevo Recorrido
            </CardTitle>
            <CardDescription>
              Añade los últimos 3 dígitos del odómetro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTrip} className="space-y-4">
              <div className="space-y-1.5">
                <Label>¿Quién condujo?</Label>
                <Select value={userName} onValueChange={setUserName} disabled={isPending}>
                  <SelectTrigger className="bg-white dark:bg-neutral-900">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_USERS.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                    <SelectItem value="Otro">Otro...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {userName === 'Otro' && (
                <div className="space-y-1.5">
                  <Label>Nombre</Label>
                  <Input 
                    value={customName} 
                    onChange={e => setCustomName(e.target.value)} 
                    placeholder="Escribe el nombre"
                    disabled={isPending}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Km Inicial</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="999" 
                    value={initialKm} 
                    onChange={e => setInitialKm(e.target.value)} 
                    placeholder="920"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Km Final</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="999" 
                    value={finalKm} 
                    onChange={e => setFinalKm(e.target.value)} 
                    placeholder="024"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
                  Registrar Viaje
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Formulario Gasolina */}
        <Card className="shadow-none border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <DollarSign className="size-5 text-emerald-600" />
              Total Gasolina
            </CardTitle>
            <CardDescription>
              Monto total gastado para calcular la cuota
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="space-y-1.5 flex-1">
                <Label>Monto cargado (Bs)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={gasAmount} 
                  onChange={e => setGasAmount(e.target.value)} 
                  disabled={isPending}
                />
              </div>
              <Button onClick={handleUpdateGas} variant="outline" disabled={isPending}>
                <Save className="size-4 mr-2" /> Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Columna Derecha: Resultados y Tabla */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Tabla de Resumen */}
        <Card className="shadow-sm border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden relative">
          <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Resumen a Pagar</CardTitle>
              <CardDescription>Cálculo proporcional según el uso</CardDescription>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-sm font-medium">
              Total: {totalKmOverall} Km
            </div>
          </CardHeader>
          <CardContent>
            {summaryByUser.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                Aún no hay registros en este periodo.
              </div>
            ) : (
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-neutral-50 dark:bg-neutral-900/50">
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-right">Kilómetros</TableHead>
                      <TableHead className="text-right">Participación</TableHead>
                      <TableHead className="text-right font-bold text-emerald-700 dark:text-emerald-400">Pagar (Bs)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaryByUser.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-right">{row.totalKm} km</TableCell>
                        <TableCell className="text-right">{row.percentage.toFixed(1)}%</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {row.cost.toFixed(2)} Bs
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabla de Viajes y Botón Reiniciar */}
        <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-950 p-1">
          <div className="px-5 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Historial Detallado</h3>
            <Button onClick={handleReset} variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" disabled={isPending || initialTrips.length === 0}>
              <RefreshCcw className="size-4 mr-2" />
              Nuevo Ciclo
            </Button>
          </div>
          
          <div className="max-h-[300px] overflow-auto">
            {initialTrips.length === 0 ? (
              <div className="text-center py-6 text-sm text-neutral-500">
                Añade el primer recorrido para comenzar The Tracker.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Recorrido</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialTrips.map(trip => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium text-sm">{trip.userName}</TableCell>
                      <TableCell className="text-sm text-neutral-500 tabular-nums">
                        {trip.initialKm.toString().padStart(3, '0')} → {trip.finalKm.toString().padStart(3, '0')}
                      </TableCell>
                      <TableCell className="text-sm font-medium tabular-nums">{trip.totalKm} km</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={isPending}
                          className="h-8 w-8 text-neutral-400 hover:text-red-500"
                          onClick={() => handleDeleteTrip(trip.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
