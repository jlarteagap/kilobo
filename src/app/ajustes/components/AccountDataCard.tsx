'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Download, Trash2, TriangleAlert } from 'lucide-react'

/**
 * Datos de la cuenta: exportación y supresión.
 *
 * Ambas acciones son irreversibles o definitivas, de ahí la confirmación
 * explícita. La de borrado pide escribir una frase: un doble clic accidental
 * no debe alcanzar a destruir años de historial financiero.
 */
export function AccountDataCard() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [phrase, setPhrase] = useState('')

  const exportData = () => {
    // Dejar que el navegador descargue la respuesta con Content-Disposition.
    window.location.href = '/api/user/export'
    toast.success('Descarga iniciada')
  }

  const deleteAccount = () => {
    if (phrase !== 'DELETE_MY_ACCOUNT') {
      toast.error('El texto no coincide')
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/user/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirm: 'DELETE_MY_ACCOUNT' }),
        })
        const body = await res.json().catch(() => ({}))

        if (res.ok) {
          toast.success('Cuenta eliminada')
          router.push('/login')
          router.refresh()
          return
        }

        if (res.status === 500 && body.failed?.length) {
          toast.error(`Eliminación parcial: fallaron ${body.failed.join(', ')}`)
          return
        }
        toast.error(body.error ?? 'No se pudo eliminar la cuenta')
      } catch {
        toast.error('No se pudo eliminar la cuenta')
      }
    })
  }

  return (
    <div
      className="bg-white rounded-[22px] p-6 flex flex-col gap-4"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-foreground tracking-[-0.01em]">
            Tus datos
          </h2>
          <p className="text-[12px] text-[#6E6E73] mt-0.5 leading-relaxed">
            Descargá una copia de todo lo que registraste, o eliminá tu cuenta y
            sus datos de forma permanente.
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
          <Download className="w-4 h-4 text-[#6E6E73]" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportData}
          className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-4 py-2 text-[13px] font-semibold text-foreground hover:border-zinc-500/50 transition-colors"
        >
          <Download className="size-3.5" />
          Exportar mis datos
        </button>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-[13px] font-semibold text-red-600 hover:border-red-400 transition-colors"
          >
            <Trash2 className="size-3.5" />
            Eliminar mi cuenta
          </button>
        ) : null}
      </div>

      {confirming ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
          <p className="flex items-start gap-2 text-[12px] text-red-700 leading-relaxed">
            <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Esto borra permanentemente tus cuentas, transacciones, presupuestos,
              deudas, créditos, inversiones, turnos y depósitos. No se puede
              deshacer. Conviene exportar antes.
            </span>
          </p>

          <label className="block">
            <span className="text-[11px] font-semibold text-red-800">
              Escribí <code className="font-mono">DELETE_MY_ACCOUNT</code> para confirmar
            </span>
            <input
              type="text"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-[13px] font-mono text-foreground focus:border-red-400 focus:outline-none"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={deleteAccount}
              disabled={isPending || phrase !== 'DELETE_MY_ACCOUNT'}
              className="rounded-xl bg-red-600 px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40 transition-opacity"
            >
              {isPending ? 'Eliminando…' : 'Eliminar definitivamente'}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false)
                setPhrase('')
              }}
              className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-4 py-2 text-[13px] font-semibold text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}