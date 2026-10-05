import {
  CarCycle,
  DebtResult,
  cycleDebtors,
  round2,
} from '@/types/car-sharing'

/** Tolera el polvo de punto flotante: evita transferencias de Bs 0.003. */
const EPSILON = 0.01

export interface Transfer {
  from: string
  to: string
  amount: number
}

export interface PersonBalance {
  name: string
  /** Positivo: los demás le deben. Negativo: debe. */
  net: number
  /** Ciclos pendientes en los que aparece esta persona. */
  cycleIds: string[]
}

export interface PendingSettlement {
  transfers: Transfer[]
  balances: PersonBalance[]
  /** Total a cobrar una vez compensadas las deudas entre ciclos. */
  toCollect: number
  openCyclesCount: number
  /** Suma de `gasAmount` de los ciclos pendientes, sin compensar. */
  openAmount: number
}

/**
 * Un ciclo queda pendiente cuando esta cerrado, alguien puso la plata y nadie
 * lo saldo. El ciclo activo no cuenta: aun no hay monto que repartir.
 */
export function isPending(cycle: CarCycle): boolean {
  return cycle.status === 'closed' && Boolean(cycle.paidBy) && !cycle.settledAt
}

/**
 * Saldo neto por persona sobre los ciclos pendientes.
 *
 * Sumar las deudas de cada ciclo sin compensar produce montos que se cancelan
 * solos: si en el ciclo A te deben Bs 200 y en el B tu debes Bs 150, la
 * transferencia real es de Bs 50, no dos transferencias.
 */
export function computeNetBalances(cycles: CarCycle[]): PersonBalance[] {
  const net = new Map<string, PersonBalance>()

  const touch = (name: string): PersonBalance => {
    const existing = net.get(name)
    if (existing) return existing
    const created: PersonBalance = { name, net: 0, cycleIds: [] }
    net.set(name, created)
    return created
  }

  for (const cycle of cycles) {
    if (!isPending(cycle)) continue
    const payer = cycle.paidBy as string
    const debtors = cycleDebtors(cycle)

    touch(payer).cycleIds.push(cycle.id)
    for (const debtor of debtors) {
      const creditor = touch(debtor.name)
      creditor.net += debtor.cost
      creditor.cycleIds.push(cycle.id)
      touch(payer).net -= debtor.cost
    }
  }

  return Array.from(net.values())
    .filter(b => Math.abs(b.net) >= EPSILON)
    .sort((a, b) => b.net - a.net)
}

/**
 * Liquidacion greedy: el mayor deudor le paga al mayor acreedor hasta agotar
 * uno de los dos. Como los saldos ya vienen netos, N personas siempre resuelven
 * en a lo sumo N-1 transferencias, que es el minimo teorico.
 */
export function settleBalances(balances: PersonBalance[]): Transfer[] {
  const debtors = balances
    .filter(b => b.net < -EPSILON)
    .map(b => ({ name: b.name, amount: -b.net }))
    .sort((a, b) => b.amount - a.amount)

  const creditors = balances
    .filter(b => b.net > EPSILON)
    .map(b => ({ name: b.name, amount: b.net }))
    .sort((a, b) => b.amount - a.amount)

  const transfers: Transfer[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount)
    if (amount >= EPSILON) {
      transfers.push({
        from: debtors[i].name,
        to: creditors[j].name,
        amount: round2(amount),
      })
    }
    debtors[i].amount -= amount
    creditors[j].amount -= amount
    if (debtors[i].amount < EPSILON) i++
    if (creditors[j].amount < EPSILON) j++
  }

  return transfers
}

export function computePendingSettlement(cycles: CarCycle[]): PendingSettlement {
  const open = cycles.filter(isPending)
  const balances = computeNetBalances(open)
  const transfers = settleBalances(balances)

  return {
    transfers,
    balances,
    toCollect: round2(
      balances.filter(b => b.net > EPSILON).reduce((acc, b) => acc + b.net, 0),
    ),
    openCyclesCount: open.length,
    openAmount: round2(open.reduce((acc, c) => acc + (c.gasAmount || 0), 0)),
  }
}

/**
 * Reparte el monto de un ciclo entre sus conductores. `debtSummary` ya viene
 * calculado al cerrar el ciclo, asi que esto solo ordena lo existente para la
 * UI y no recalcula porcentajes.
 */
export function debtorsByShare(debtSummary: DebtResult[]): DebtResult[] {
  return [...debtSummary].sort((a, b) => (b.totalKm || 0) - (a.totalKm || 0))
}