'use client'

import React, { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CarMaintenanceLog, MaintenanceType } from '@/repositories/car-maintenance.repository'
import { addMaintenanceLogAction, deleteMaintenanceLogAction } from '../maintenance.actions'
import { Trash2, RefreshCcw, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface MaintenanceModalProps {
  isOpen: boolean
  onClose: () => void
  type: MaintenanceType | null
  absoluteOdometer: number
  logs: CarMaintenanceLog[]
}

const TYPE_NAMES = {
  oil: 'Cambio de Aceite',
  injectors: 'Aditivo de Gasolina'
}

export function MaintenanceModal({ isOpen, onClose, type, absoluteOdometer, logs }: MaintenanceModalProps) {
  const [isPending, startTransition] = useTransition()
  
  // Form state
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')

  if (!type) return null

  const filteredLogs = logs.filter(log => log.type === type)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const parsedCost = parseFloat(cost)
    if (isNaN(parsedCost) || parsedCost < 0) {
      toast.error('Ingresa un costo válido')
      return
    }

    startTransition(async () => {
      try {
        await addMaintenanceLogAction({
          type,
          cost: parsedCost,
          odometer: absoluteOdometer,
          notes
        })
        toast.success('Mantenimiento registrado')
        setCost('')
        setNotes('')
        onClose()
      } catch (err) {
        toast.error('Error al registrar')
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteMaintenanceLogAction(id)
        toast.success('Registro eliminado')
      } catch (err) {
        toast.error('Error al eliminar')
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-[2rem]">
        <DialogHeader className="px-8 pt-8 pb-4 border-b border-neutral-50 dark:border-neutral-900">
          <DialogTitle className="text-xl font-light tracking-tight">{TYPE_NAMES[type]}</DialogTitle>
          <DialogDescription className="text-xs tracking-wide">
            Gestión de historial y registro de nuevo mantenimiento.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-neutral-50 dark:border-neutral-900 bg-transparent p-0 px-8 h-auto">
            <TabsTrigger 
              value="new" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-4 py-3 text-xs uppercase tracking-widest font-bold text-neutral-400 data-[state=active]:text-emerald-600 transition-all"
            >
              Nuevo Registro
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-4 py-3 text-xs uppercase tracking-widest font-bold text-neutral-400 data-[state=active]:text-emerald-600 transition-all"
            >
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="p-8 mt-0 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Odómetro Actual (Auto)</Label>
                <Input 
                  disabled
                  value={`${absoluteOdometer.toLocaleString()} km`}
                  className="h-12 bg-neutral-50 dark:bg-neutral-900 border-0 rounded-xl px-4 text-neutral-500 font-medium tabular-nums"
                />
                <p className="text-[10px] text-neutral-400 italic">El kilometraje se toma automáticamente del registro general.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Costo (Bs)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  placeholder="0.00"
                  disabled={isPending}
                  className="h-12 bg-transparent border-t-0 border-x-0 border-b border-neutral-200 dark:border-neutral-800 rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-500 transition-colors shadow-none text-xl font-light tabular-nums"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Notas Adicionales (Opcional)</Label>
                <Input 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej: Marca de aceite, lugar..."
                  disabled={isPending}
                  className="h-12 bg-transparent border-t-0 border-x-0 border-b border-neutral-200 dark:border-neutral-800 rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-500 transition-colors shadow-none text-sm"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isPending}
                className="w-full h-14 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all font-medium text-base shadow-lg shadow-neutral-950/10 dark:shadow-white/5 active:scale-[0.98] mt-4"
              >
                {isPending ? <RefreshCcw className="size-5 animate-spin" /> : "Guardar Registro"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="history" className="p-0 mt-0 h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-neutral-50 dark:border-neutral-900 sticky top-0 bg-white dark:bg-neutral-950 z-10">
                  <TableHead className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 px-8 py-4">Fecha</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 py-4">KM</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 py-4 text-right">Costo</TableHead>
                  <TableHead className="px-8 py-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-neutral-400 text-sm italic">Sin historial de {TYPE_NAMES[type]}</TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map(log => (
                    <TableRow key={log.id} className="group border-b border-neutral-50 dark:border-neutral-900 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                      <TableCell className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-neutral-900 dark:text-neutral-100 text-sm font-medium">
                            {new Date(log.date).toLocaleDateString('es-ES')}
                          </span>
                          {log.notes && <span className="text-neutral-400 text-[10px] max-w-[120px] truncate" title={log.notes}>{log.notes}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 font-light text-neutral-500 tabular-nums">
                        {log.odometer.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-4 text-right font-medium tabular-nums text-emerald-600">
                        {log.cost.toFixed(2)} Bs
                      </TableCell>
                      <TableCell className="px-8 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={isPending}
                          className="size-8 rounded-lg opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
