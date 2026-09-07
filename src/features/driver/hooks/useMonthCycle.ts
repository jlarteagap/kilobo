'use client'

import { useState, useCallback, useMemo } from 'react'
import type { MonthCycle } from './useDriverShifts'

export function useMonthCycle(initial?: MonthCycle) {
  const [cycle, setCycle] = useState<MonthCycle>(() => {
    if (initial) return initial
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })

  const prev = useCallback(() => {
    setCycle((c) => {
      if (c.month === 1) return { year: c.year - 1, month: 12 }
      return { year: c.year, month: c.month - 1 }
    })
  }, [])

  const next = useCallback(() => {
    setCycle((c) => {
      if (c.month === 12) return { year: c.year + 1, month: 1 }
      return { year: c.year, month: c.month + 1 }
    })
  }, [])

  const isCurrentMonth = useMemo(() => {
    const now = new Date()
    return cycle.year === now.getFullYear() && cycle.month === now.getMonth() + 1
  }, [cycle])

  const label = useMemo(() => {
    const d = new Date(cycle.year, cycle.month - 1, 1)
    return d.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })
  }, [cycle])

  const set = useCallback((year: number, month: number) => {
    setCycle({ year, month })
  }, [])

  return { cycle, setCycle: set, prev, next, isCurrentMonth, label }
}
