export interface AmortizationRow {
  number: number
  due_date: string
  total_amount: number
  principal: number
  interest: number
  remaining_balance: number
}

export interface AmortizationInput {
  balance: number
  annualRate: number
  totalInstallments: number
  firstPaymentDate: string
  monthlyPayment?: number
}

function monthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate / 100, 1 / 12) - 1
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function generateAmortization(input: AmortizationInput): AmortizationRow[] {
  const { balance, annualRate, totalInstallments, firstPaymentDate, monthlyPayment } = input
  const rows: AmortizationRow[] = []

  if (totalInstallments <= 0 || balance <= 0) return rows

  const i = monthlyRate(annualRate)

  const n = totalInstallments
  let payment: number
  if (monthlyPayment && monthlyPayment > 0) {
    payment = monthlyPayment
  } else {
    payment =
      i === 0
        ? balance / n
        : (balance * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)
  }

  let remaining = balance

  for (let num = 1; num <= totalInstallments; num++) {
    const interest = remaining * i
    const rawPrincipal = payment - interest
    let principal = Math.min(rawPrincipal, remaining)
    if (num === totalInstallments) {
      principal = remaining
    }
    if (principal < 0) principal = 0

    const total = principal + interest
    remaining = remaining - principal
    if (remaining < 0) remaining = 0

    rows.push({
      number: num,
      due_date: addMonths(firstPaymentDate, num - 1),
      total_amount: Math.round(total * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      remaining_balance: Math.round(remaining * 100) / 100,
    })
  }

  return rows
}
