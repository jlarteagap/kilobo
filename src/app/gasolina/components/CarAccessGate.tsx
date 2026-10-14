'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { toast } from 'sonner'
import { Lock, LockOpen } from 'lucide-react'

/**
 * Estado de escritura del auto compartido (design.md D1).
 *
 * La lectura de /gasolina es pública; este contexto solo comunica si quien está
 * en la página tiene el token para modificar el ciclo. El control real vive en
 * los Server Actions: esto es la señal de interfaz, no la barrera.
 */
const CarAccessContext = createContext<{ canWrite: boolean }>({ canWrite: false })

export function CarAccessProvider({ canWrite, children }: { canWrite: boolean; children: React.ReactNode }) {
  return <CarAccessContext.Provider value={{ canWrite }}>{children}</CarAccessContext.Provider>
}

export function useCarAccess() {
  return useContext(CarAccessContext)
}

/**
 * Entrada del token. Mientras no se valide, la interfaz muestra las acciones de
 * escritura deshabilitadas en vez de dejar que fallen al pulsarlas.
 */
export function CarAccessGate({ initialCanWrite }: { initialCanWrite: boolean }) {
  const [canWrite, setCanWrite] = useState(initialCanWrite)
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!token.trim()) return
      setBusy(true)
      try {
        const res = await fetch('/api/car-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token.trim() }),
        })
        if (res.ok) {
          toast.success('Token aceptado. Ya podés modificar el ciclo.')
          setToken('')
          setCanWrite(true)
          window.location.reload()
        } else {
          const { error } = await res.json().catch(() => ({}))
          toast.error(error ?? 'Token inválido')
        }
      } catch {
        toast.error('No se pudo validar el token')
      } finally {
        setBusy(false)
      }
    },
    [token],
  )

  const revoke = useCallback(async () => {
    await fetch('/api/car-access', { method: 'DELETE' })
    setCanWrite(false)
    toast.success('Modo lectura')
    window.location.reload()
  }, [])

  if (canWrite) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[22px] bg-zinc-50 px-4 py-3">
        <p className="flex items-center gap-2 text-[12px] font-medium text-zinc-600">
          <LockOpen className="size-3.5 text-emerald-600" />
          Modo edición activo. Cualquiera con el token puede modificar el ciclo.
        </p>
        <button
          type="button"
          onClick={revoke}
          className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Bloquear
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[22px] bg-zinc-50 px-4 py-3 space-y-2"
    >
      <p className="flex items-center gap-2 text-[12px] font-medium text-zinc-600">
        <Lock className="size-3.5 text-zinc-400" />
        Solo lectura. Ingresá el token compartido para modificar el ciclo.
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Token de acceso"
          autoComplete="off"
          className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !token.trim()}
          className="rounded-xl bg-zinc-900 px-4 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40 transition-opacity"
        >
          {busy ? 'Validando…' : 'Desbloquear'}
        </button>
      </div>
    </form>
  )
}