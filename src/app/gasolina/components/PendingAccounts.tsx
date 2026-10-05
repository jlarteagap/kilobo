'use client'

import { useState, useTransition } from 'react'
import { Check, ChevronDown, Pencil, Trash2, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { CarCycle } from '@/types/car-sharing'
import { cycleBsPerKm, cycleKm, cycleLitersPer100 } from '@/types/car-sharing'
import {
  computePendingSettlement,
  debtorsByShare,
  isPending,
} from '@/app/gasolina/utils/debts.utils'
import {
  formatBs,
  formatCycleRange,
  formatDaysOpen,
  formatLiters,
  formatTripDate,
} from '@/app/gasolina/utils/format'
import { setCycleSettledAction, updateClosedCycleAction } from '../actions'
import { cn } from '@/lib/utils'

interface PendingAccountsProps {
  cycles: CarCycle[]
  onDeleteCycle: (id: string) => void
}

function DebtorRow({
  name,
  km,
  percentage,
  cost,
  isPayer,
}: {
  name: string
  km: number
  percentage: number
  cost: number
  isPayer: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            'text-xs truncate',
            isPayer ? 'text-zinc-400' : 'font-medium text-zinc-900',
          )}
        >
          {name}
        </span>
        {isPayer && (
          <span className="shrink-0 text-[10px] font-medium text-zinc-400 bg-zinc-100 rounded px-1.5 py-0.5">
            pagó
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0 tabular-nums">
        <span className="text-[11px] text-zinc-400">{km} km</span>
        <span className="text-[11px] text-zinc-400 w-8 text-right">
          {percentage.toFixed(0)}%
        </span>
        <span className="text-xs font-medium text-zinc-900 w-16 text-right">
          {formatBs(cost)}
        </span>
      </div>
    </div>
  )
}

function CycleEditForm({
  cycle,
  people,
  onDone,
}: {
  cycle: CarCycle
  people: string[]
  onDone: () => void
}) {
  const [amount, setAmount] = useState(String(cycle.gasAmount))
  const [liters, setLiters] = useState(cycle.gasLiters ? String(cycle.gasLiters) : '')
  const [payer, setPayer] = useState(cycle.paidBy ?? people[0] ?? '')
  const [isBusy, startTransition] = useTransition()

  const handleSave = () => {
    const amountNum = Number(amount)
    const litersNum = liters.trim() === '' ? null : Number(liters)

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error('El monto debe ser mayor a cero')
      return
    }
    if (litersNum !== null && (!Number.isFinite(litersNum) || litersNum <= 0)) {
      toast.error('Los litros deben ser mayores a cero, o dejar el campo vacío')
      return
    }
    if (!payer) {
      toast.error('Debes indicar quién pagó la carga')
      return
    }

    startTransition(async () => {
      try {
        await updateClosedCycleAction(cycle.id, {
          gasAmount: amountNum,
          gasLiters: litersNum,
          paidBy: payer,
        })
        toast.success('Ciclo actualizado')
        onDone()
      } catch {
        toast.error('No se pudo actualizar el ciclo')
      }
    })
  }

  const inputClass =
    'w-full h-9 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 ' +
    'placeholder:text-zinc-300 focus:outline-none focus:border-zinc-400 transition-colors'

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2.5">
      <p className="text-[11px] font-medium text-zinc-500">
        Editar carga
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="text-[10px] text-zinc-400 block mb-1">Monto (Bs)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-[10px] text-zinc-400 block mb-1">Litros</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="opcional"
            value={liters}
            onChange={e => setLiters(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <label className="block">
        <span className="text-[10px] text-zinc-400 block mb-1">Pagó</span>
        <select
          value={payer}
          onChange={e => setPayer(e.target.value)}
          className={cn(inputClass, 'appearance-none')}
        >
          {people.map(name => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy}
          className="h-8 px-3 rounded-lg bg-zinc-900 text-[11px] font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={isBusy}
          className="h-8 px-3 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function CycleRow({
  cycle,
  onSettled,
  onDelete,
}: {
  cycle: CarCycle
  onSettled: (id: string, settled: boolean) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [isBusy, startTransition] = useTransition()

  const km = cycleKm(cycle)
  const bsPerKm = cycleBsPerKm(cycle)
  const litersPer100 = cycleLitersPer100(cycle)
  const debtors = debtorsByShare(cycle.debtSummary)
  const payer = debtors.find(d => d.name === cycle.paidBy)

  // Salidas del ciclo en vez de una lista fija: asi un tercer conductor no
  // desaparece del selector solo porque no este hardcodeado.
  const people = Array.from(
    new Set(
      [
        ...cycle.trips.map(t => t.userName),
        ...(cycle.paidBy ? [cycle.paidBy] : []),
      ].filter(Boolean),
    ),
  )

  const handleToggleSettled = () => {
    const next = !cycle.settledAt
    startTransition(async () => {
      try {
        await onSettled(cycle.id, next)
        toast.success(next ? 'Cuenta liquidada' : 'Cuenta reabierta')
      } catch {
        toast.error('No se pudo actualizar la cuenta')
      }
    })
  }

  const handleDelete = () => {
    if (!window.confirm('¿Eliminar esta cuenta? Si ya la liquidaste, el dinero igual se movió.')) {
      return
    }
    onDelete(cycle.id)
  }

  return (
    <div className="border-b border-zinc-100 last:border-0">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 min-w-0 flex-1 text-left group"
          aria-expanded={open}
        >
          <ChevronDown
            className={cn(
              'size-3.5 shrink-0 text-zinc-400 transition-transform',
              open && 'rotate-180',
            )}
          />
          <span className="text-xs font-medium text-zinc-900 tabular-nums shrink-0">
            {formatCycleRange(cycle.startDate, cycle.endDate)}
          </span>
          <span className="text-[11px] text-zinc-400 shrink-0">
            {km} km
          </span>
          <span className="text-[11px] text-zinc-500 shrink-0 ml-auto tabular-nums">
            {formatBs(cycle.gasAmount)}
          </span>
        </button>

        <button
          type="button"
          onClick={handleToggleSettled}
          disabled={isBusy}
          aria-label={cycle.settledAt ? 'Reabrir cuenta' : 'Marcar como liquidada'}
          className={cn(
            'size-7 shrink-0 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50',
            cycle.settledAt
              ? 'text-emerald-600 bg-emerald-50'
              : 'text-zinc-400 hover:text-emerald-600 hover:bg-zinc-100',
          )}
        >
          <Check className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setEditing(e => !e)}
          aria-label="Editar carga"
          aria-expanded={editing}
          className={cn(
            'size-7 shrink-0 rounded-lg flex items-center justify-center transition-colors',
            editing
              ? 'text-zinc-900 bg-zinc-100'
              : 'text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100',
          )}
        >
          <Pencil className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={handleDelete}
          aria-label="Eliminar cuenta"
          className="size-7 shrink-0 rounded-lg flex items-center justify-center text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4 pl-9 space-y-4">
          {editing && (
            <CycleEditForm
              cycle={cycle}
              people={people}
              onDone={() => setEditing(false)}
            />
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
            {bsPerKm !== null && <span className="tabular-nums">{bsPerKm} Bs/km</span>}
            {litersPer100 !== null && (
              <span className="tabular-nums">{litersPer100} L/100km</span>
            )}
            {cycle.gasLiters ? (
              <span className="tabular-nums">{formatLiters(cycle.gasLiters)}</span>
            ) : null}
            <span>{cycle.trips.length} viajes</span>
            <span>{formatDaysOpen(cycle.endDate ?? cycle.startDate)}</span>
          </div>

          <div className="rounded-xl bg-zinc-50/50 border border-zinc-100 px-3 py-2">
            {debtors.length === 0 ? (
              <p className="text-[11px] text-zinc-400 py-1">
                {payer ? 'Nada que cobrar: el pagador manejaría todo el tramo' : 'Sin reparto registrado'}
              </p>
            ) : (
              debtors.map(d => (
                <DebtorRow
                  key={d.name}
                  name={d.name}
                  km={d.totalKm}
                  percentage={d.percentage}
                  cost={d.cost}
                  isPayer={d.name === cycle.paidBy}
                />
              ))
            )}
          </div>

          {cycle.trips.length > 0 && (
            <details className="group/trips">
              <summary className="text-[11px] text-zinc-500 hover:text-zinc-900 cursor-pointer select-none">
                Ver viajes
              </summary>
              <div className="mt-2 space-y-1 pt-2 border-t border-zinc-100">
                {cycle.trips.map(t => (
                  <div
                    key={t.createdAt}
                    className="flex items-center justify-between gap-3 text-[11px]"
                  >
                    <span className="text-zinc-400 tabular-nums shrink-0">
                      {formatTripDate(t)}
                    </span>
                    <span className="text-zinc-600 truncate">{t.userName}</span>
                    <span className="text-zinc-400 tabular-nums shrink-0">
                      {t.totalKm} km
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

function SettledRow({
  cycle,
  onDelete,
}: {
  cycle: CarCycle
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <Check className="size-3.5 shrink-0 text-zinc-300" />
        <span className="text-[11px] text-zinc-500 tabular-nums">
          {formatCycleRange(cycle.startDate, cycle.endDate)}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-zinc-400 tabular-nums">
          {formatBs(cycle.gasAmount)}
        </span>
        <button
          type="button"
          onClick={() => {
            if (!window.confirm('¿Eliminar esta cuenta liquidada?')) return
            onDelete(cycle.id)
          }}
          aria-label="Eliminar cuenta"
          className="size-6 rounded flex items-center justify-center text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
    </div>
  )
}

export function PendingAccounts({ cycles, onDeleteCycle }: PendingAccountsProps) {
  const [showSettled, setShowSettled] = useState(false)

  const open = cycles.filter(isPending)
  const settled = cycles.filter(c => c.status === 'closed' && c.settledAt)
  const settlement = computePendingSettlement(open)

  return (
    <div className="rounded-[22px] border border-zinc-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 p-5 border-b border-zinc-100">
        <div className="size-11 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
          <UserCheck className="size-4 text-zinc-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold text-zinc-900 tracking-tight">
            Cuentas pendientes
          </h2>
          <p className="text-xs text-zinc-500 capitalize">
            {open.length === 0
              ? 'Todo al día'
              : `${open.length} ciclo${open.length > 1 ? 's' : ''} abierto${open.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {open.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <div className="size-11 rounded-xl bg-zinc-100 mx-auto mb-3 flex items-center justify-center">
            <div className="size-2.5 rounded-full bg-zinc-300" />
          </div>
          <p className="text-sm font-medium text-zinc-900">Nada por cobrar</p>
          <p className="text-xs text-zinc-500 mt-1">
            Cuando cierres un ciclo, aquí aparece quién te debe qué.
          </p>
        </div>
      ) : (
        <>
          {settlement.transfers.length > 0 && (
            <div className="px-5 py-4 bg-zinc-50/50 border-b border-zinc-100">
              <p className="text-[11px] font-medium text-zinc-600 mb-3">
                Por cobrar {formatBs(settlement.toCollect)}
              </p>
              <div className="space-y-1.5">
                {settlement.transfers.map(t => (
                  <div
                    key={`${t.from}-${t.to}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0 text-xs">
                      <span className="font-medium text-zinc-900 truncate">{t.from}</span>
                      <span className="text-zinc-300 shrink-0">→</span>
                      <span className="text-zinc-600 truncate">{t.to}</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 tabular-nums shrink-0">
                      {formatBs(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            {open.map(cycle => (
              <CycleRow
                key={cycle.id}
                cycle={cycle}
                onSettled={setCycleSettledAction}
                onDelete={onDeleteCycle}
              />
            ))}
          </div>
        </>
      )}

      {settled.length > 0 && (
        <div className="border-t border-zinc-100">
          <button
            type="button"
            onClick={() => setShowSettled(s => !s)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
          >
            <span className="text-[11px] font-medium text-zinc-500">
              Liquidado ({settled.length})
            </span>
            <ChevronDown
              className={cn(
                'size-3.5 text-zinc-400 transition-transform',
                showSettled && 'rotate-180',
              )}
            />
          </button>
          {showSettled && (
            <div className="border-t border-zinc-100">
              {settled.map(cycle => (
                <SettledRow key={cycle.id} cycle={cycle} onDelete={onDeleteCycle} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}