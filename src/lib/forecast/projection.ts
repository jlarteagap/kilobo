import { Account } from '@/types/account'
import { Transaction } from '@/types/transaction'
import { convertToBOB } from '@/lib/config/exchange-rates'
import { parseISO, format, addDays, startOfDay, endOfMonth, getDay, differenceInDays, subDays } from 'date-fns'

const LEARNING_WINDOW_DAYS = 60
const CONFIDENCE_HIGH_THRESHOLD = 90
const CONFIDENCE_MEDIUM_THRESHOLD = 30

export interface ProjectedDay {
  date: string
  balance: number
  income: number
  expense: number
  is_estimated: boolean
}

export interface ProjectionResult {
  days: ProjectedDay[]
  first_negative_date: string | null
  final_balance: number
  confidence: 'high' | 'medium' | 'low'
}

function currentTotalBalance(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + convertToBOB(a.balance, a.currency), 0)
}

interface RecurringPattern {
  day_of_month: number
  amount: number
  type: 'INCOME' | 'EXPENSE'
}

function detectRecurringPatterns(transactions: Transaction[]): RecurringPattern[] {
  const recurring = transactions.filter(t => t.is_recurring && t.status === 'COMPLETED')

  const patterns = new Map<string, RecurringPattern>()

  for (const t of recurring) {
    const day = parseInt(t.date.slice(8, 10), 10)
    const key = `${t.type}-${day}-${t.amount}-${t.description ?? ''}`

    if (!patterns.has(key)) {
      patterns.set(key, { day_of_month: day, amount: convertToBOB(t.amount, t.currency), type: t.type as 'INCOME' | 'EXPENSE' })
    }
  }

  return Array.from(patterns.values())
}

interface DayOfWeekAverage {
  expense: number
  days_count: number
}

function calculateDailyAverages(transactions: Transaction[]): { by_dow: DayOfWeekAverage[]; global: number } {
  const now = new Date()
  const since = subDays(now, LEARNING_WINDOW_DAYS)
  const sinceStr = format(since, 'yyyy-MM-dd')

  const relevant = transactions.filter(
    t => t.date >= sinceStr && t.date <= format(now, 'yyyy-MM-dd') && t.status === 'COMPLETED' && t.type === 'EXPENSE'
  )

  const dowTotals: number[] = Array(7).fill(0)
  const dowCounts: number[] = Array(7).fill(0)

  for (const t of relevant) {
    const d = parseISO(t.date)
    const dow = getDay(d)
    dowTotals[dow] += convertToBOB(t.amount, t.currency)
    dowCounts[dow]++
  }

  const by_dow: DayOfWeekAverage[] = dowTotals.map((total, i) => ({
    expense: dowCounts[i] > 0 ? total / dowCounts[i] : 0,
    days_count: dowCounts[i],
  }))

  const totalExpense = dowTotals.reduce((a, b) => a + b, 0)
  const totalDays = dowCounts.reduce((a, b) => a + b, 0)
  const global = totalDays > 0 ? totalExpense / totalDays : 0

  return { by_dow, global }
}

export function projectBalance(accounts: Account[], transactions: Transaction[]): ProjectionResult {
  const now = startOfDay(new Date())
  const monthEnd = endOfMonth(now)

  const startBalance = currentTotalBalance(accounts)
  const recurringPatterns = detectRecurringPatterns(transactions)
  const { by_dow, global: globalAvg } = calculateDailyAverages(transactions)

  const totalDays = differenceInDays(monthEnd, now) + 1
  if (totalDays <= 0) {
    return {
      days: [{ date: format(now, 'yyyy-MM-dd'), balance: startBalance, income: 0, expense: 0, is_estimated: false }],
      first_negative_date: null,
      final_balance: startBalance,
      confidence: startBalance > 0 ? 'low' : 'high',
    }
  }

  const days: ProjectedDay[] = []
  let balance = startBalance
  let firstNegative: string | null = null

  for (let i = 0; i < totalDays; i++) {
    const current = addDays(startOfDay(now), i)
    const dateStr = format(current, 'yyyy-MM-dd')
    const isPast = current <= now && i === 0
    const dayOfMonth = current.getDate()
    const dayOfWeek = getDay(current)

    let income = 0
    let expense = 0

    for (const p of recurringPatterns) {
      if (p.day_of_month === dayOfMonth) {
        if (p.type === 'INCOME') income += p.amount
        else expense += p.amount
      }
    }

    if (!isPast && expense === 0) {
      const dowAvg = by_dow[dayOfWeek]
      expense = dowAvg.days_count > 0 ? dowAvg.expense : globalAvg
    }

    balance = balance + income - expense

    days.push({
      date: dateStr,
      balance: Math.round(balance * 100) / 100,
      income,
      expense: Math.round(expense * 100) / 100,
      is_estimated: !isPast,
    })

    if (balance < 0 && firstNegative === null) {
      firstNegative = dateStr
    }
  }

  const completedCount = transactions.filter(t => t.status === 'COMPLETED').length
  const confidence: ProjectionResult['confidence'] = completedCount >= CONFIDENCE_HIGH_THRESHOLD ? 'high' : completedCount >= CONFIDENCE_MEDIUM_THRESHOLD ? 'medium' : 'low'

  return {
    days,
    first_negative_date: firstNegative,
    final_balance: Math.round(balance * 100) / 100,
    confidence,
  }
}
