
import { useMemo } from 'react'
import { Transaction } from '@/types/transaction'
import { format, subDays, startOfDay, isAfter, isSameDay, getWeek, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'


import { Category } from '@/types/category'

export type Period = '1W' | '1M' | '3M'

interface DailyData {
  date: string
  income: number
  expense: number
  label: string
}

export function useTransactionMetrics(transactions: Transaction[], categories: Category[], period: Period) {
  const metrics = useMemo(() => {
    const now = new Date()
    let startDate = now

    switch (period) {
      case '1W':
        startDate = subDays(now, 7)
        break
      case '1M':
        startDate = subDays(now, 30)
        break
      case '3M':
        startDate = subDays(now, 90)
        break
    }

    const filteredTransactions = transactions.filter(t => 
      isAfter(new Date(t.date), startDate) && t.status === 'COMPLETED'
    )

    // Calculate Totals
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = filteredTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const netIncome = totalIncome - totalExpense

    // Calculate Previous Period for Trend (Simple comparison with previous equal timeframe)
    const previousStartDate = subDays(startDate, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const previousTransactions = transactions.filter(t => 
       isAfter(new Date(t.date), previousStartDate) && 
       !isAfter(new Date(t.date), startDate) &&
       t.status === 'COMPLETED'
    )
    
    const prevTotalIncome = previousTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)
        
    const prevTotalExpense = previousTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)

    const incomeTrend = prevTotalIncome === 0 ? 0 : ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100
    const expenseTrend = prevTotalExpense === 0 ? 0 : ((totalExpense - prevTotalExpense) / prevTotalExpense) * 100

    // Prepare Chart Data
    const dailyData: DailyData[] = []
    const daysMap = new Map<string, DailyData>()

    // Initialize all days in range to 0
    let tempDate = startDate
    while(tempDate <= now) {
        const dateStr = format(tempDate, 'yyyy-MM-dd')
        daysMap.set(dateStr, {
            date: dateStr,
            income: 0,
            expense: 0,
            label: format(tempDate, 'd MMM', { locale: es })
        })
        tempDate = new Date(tempDate.getTime() + 24 * 60 * 60 * 1000)
    }

    filteredTransactions.forEach(t => {
        const dateStr = format(new Date(t.date), 'yyyy-MM-dd')
        const entry = daysMap.get(dateStr)
        if (entry) {
            if (t.type === 'INCOME') entry.income += t.amount
            if (t.type === 'EXPENSE') entry.expense += t.amount
        }
    })

    const chartData = Array.from(daysMap.values())

    // Category Distribution
    const expenseByCategory = new Map<string, number>()
    filteredTransactions
        .filter(t => t.type === 'EXPENSE')
        .forEach(t => {
            const category = categories.find(c => c.id === t.category_id)
            const catName = category?.name || 'Sin Categoría'
            expenseByCategory.set(catName, (expenseByCategory.get(catName) || 0) + t.amount)
        })
    
    const categoryData = Array.from(expenseByCategory.entries()).map(([name, value]) => ({
        name,
        value
    })).sort((a, b) => b.value - a.value)

    return {
      totalIncome,
      totalExpense,
      netIncome,
      incomeTrend,
      expenseTrend,
      chartData,
      categoryData
    }
  }, [transactions, categories, period])

  return metrics
}
