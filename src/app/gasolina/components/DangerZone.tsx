'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { resetAllAction } from '../actions'
import { cn } from '@/lib/utils'

/**
 * Acciones destructivas, separadas del flujo normal y cerradas por defecto: un
 * click de mas cerca del boton de "Registrar carga" no debe borrar el historial
 * del auto.
 *
 * `resetAll` borra los ciclos de `car_sharing_cycles` pero **no** el odometro
 * absoluto de `car_config`, porque ese es un dato real del auto y no una
 * derivacion de los viajes. El dialogo lo dice para que la decision sea
 * informada; el odometro se reencuadra a mano desde "Actualizar odometro".
 */
export function DangerZone() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleReset = () => {
    const confirmed = window.confirm(
      'Esto borra TODOS los ciclos, incluidos los liquidados y sus viajes.\n\n' +
        'El odometro total del auto NO se toca, asi que los intervalos de ' +
        'mantenimiento quedaran desalineados hasta que lo reencuadres a mano.\n\n' +
        'No se puede deshacer. Seguis adelante?',
    )
    if (!confirmed) return

    startTransition(async () => {
      try {
        await resetAllAction()
        setOpen(false)
        toast.success('Historial borrado')
      } catch {
        toast.error('No se pudo borrar el historial')
      }
    })
  }

  return (
    <div className="rounded-[22px] border border-zinc-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
      >
        <span className="text-[11px] font-medium text-zinc-500">Configuración</span>
        <ChevronDown
          className={cn(
            'size-3.5 text-zinc-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-zinc-100 pt-4">
          <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
            Operaciones que afectan todo el historial del auto.
          </p>
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-zinc-200 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition-colors disabled:opacity-50"
          >
            <TriangleAlert className="size-3.5" />
            Borrar historial completo
          </button>
        </div>
      )}
    </div>
  )
}