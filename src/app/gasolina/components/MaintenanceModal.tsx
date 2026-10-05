'use client'

import React, { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CarMaintenanceLog, MaintenanceType, MAINTENANCE_TYPE_LABELS } from '@/types/car-maintenance'
import { addMaintenanceLogAction, deleteMaintenanceLogAction } from '../maintenance.actions'
import { Trash2, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface MaintenanceModalProps {
  isOpen: boolean
  onClose: () => void
  type: MaintenanceType | null
  absoluteOdometer: number
  logs: CarMaintenanceLog[]
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
        const result = await addMaintenanceLogAction({
          type,
          cost: parsedCost,
          odometer: absoluteOdometer,
          notes
        })
        setCost('')
        setNotes('')
        onClose()
        if (result.warning) {
          toast.warning(result.warning)
        } else {
          toast.success('Mantenimiento registrado')
        }
      } catch {
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
        toast.error(err instanceof Error ? err.message : 'Error al eliminar')
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white border border-zinc-200 rounded-[22px]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-100">
          <DialogTitle className="text-[13px] font-semibold tracking-tight text-zinc-900">{MAINTENANCE_TYPE_LABELS[type]}</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Gestión de historial y registro de nuevo mantenimiento.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-zinc-100 bg-transparent p-0 px-6 h-auto">
            <TabsTrigger 
              value="new" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent px-4 py-3 text-xs font-medium text-zinc-500 data-[state=active]:text-zinc-900 transition-colors"
            >
              Nuevo Registro
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent px-4 py-3 text-xs font-medium text-zinc-500 data-[state=active]:text-zinc-900 transition-colors"
            >
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="p-6 mt-0 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-600">Odómetro actual</Label>
                <Input 
                  disabled
                  value={`${absoluteOdometer.toLocaleString()} km`}
                  className="h-11 bg-zinc-50 border-zinc-200 rounded-xl px-4 text-zinc-500 font-medium tabular-nums"
                />
                <p className="text-[11px] text-zinc-400">Se toma automáticamente del registro general.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-600">Costo (Bs)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  placeholder="0.00"
                  disabled={isPending}
                  className="h-11 bg-white border-zinc-200 rounded-xl tabular-nums"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-600">Notas (opcional)</Label>
                <Input 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej: marca de aceite, lugar…"
                  disabled={isPending}
                  className="h-11 bg-white border-zinc-200 rounded-xl"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isPending}
                className="w-full h-11 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-medium mt-4"
              >
                {isPending ? <RefreshCcw className="size-4 animate-spin" /> : 'Guardar registro'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="history" className="p-0 mt-0 h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-zinc-100 sticky top-0 bg-white z-10">
                  <TableHead className="text-[11px] font-medium text-zinc-500 px-6 py-3">Fecha</TableHead>
                  <TableHead className="text-[11px] font-medium text-zinc-500 py-3">km</TableHead>
                  <TableHead className="text-[11px] font-medium text-zinc-500 py-3 text-right">Costo</TableHead>
                  <TableHead className="px-6 py-3" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-xs text-zinc-400">Sin historial de {MAINTENANCE_TYPE_LABELS[type]}</TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map(log => (
                    <TableRow key={log.id} className="group border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
                      <TableCell className="px-6 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-zinc-900">
                            {new Date(log.date).toLocaleDateString('es-ES')}
                          </span>
                          {log.notes && <span className="text-[11px] text-zinc-400 max-w-[120px] truncate" title={log.notes}>{log.notes}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-[11px] text-zinc-500 tabular-nums">
                        {log.odometer.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-3 text-right text-xs font-medium tabular-nums text-zinc-900">
                        {log.cost.toFixed(2)} Bs
                      </TableCell>
                      <TableCell className="px-6 py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={isPending}
                          className="size-8 rounded-lg opacity-0 group-hover:opacity-100 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
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
