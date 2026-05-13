// features/dashboard/components/FinancialComparisonChart.tsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { cn } from "@/lib/utils"

const CURRENT_EXPENSE_COLOR  = '#f43f5e' // rose-500
const PREVIOUS_EXPENSE_COLOR = '#fda4af' // rose-300
const CURRENT_INCOME_COLOR   = '#10b981' // emerald-500
const PREVIOUS_INCOME_COLOR  = '#6ee7b7' // emerald-300

interface ChartDataPoint {
  day: number
  currentExpense: number | null
  currentIncome: number | null
  previousExpense: number | null
  previousIncome: number | null
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name:     string
    value:    number
    color:    string
    dataKey?: string | number
  }>
  label?: string | number
}

const getLabelName = (key: string) => {
  switch(key) {
    case 'currentExpense': return 'Gastos - Este mes'
    case 'previousExpense': return 'Gastos - Mes anterior'
    case 'currentIncome': return 'Ingresos - Este mes'
    case 'previousIncome': return 'Ingresos - Mes anterior'
    default: return key
  }
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  // Sort payload to show Income first, then Expense, and Current before Previous
  const sortedPayload = [...payload].sort((a, b) => {
    const aKey = a.dataKey as string
    const bKey = b.dataKey as string
    if (aKey.includes('Income') && bKey.includes('Expense')) return -1
    if (aKey.includes('Expense') && bKey.includes('Income')) return 1
    if (aKey.includes('current') && bKey.includes('previous')) return -1
    if (aKey.includes('previous') && bKey.includes('current')) return 1
    return 0
  })

  return (
    <div
      className="bg-white px-3 py-2.5 rounded-xl text-sm min-w-[200px]"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}
    >
      <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">
        Día {label}
      </p>
      {sortedPayload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 mb-2 last:mb-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className={cn("text-[12px] font-medium text-muted-foreground", entry.dataKey?.toString().includes('previous') && "opacity-70")}>
              {getLabelName(entry.dataKey as string)}
            </span>
          </div>
          <span className={cn("text-[12px] font-bold text-foreground", entry.dataKey?.toString().includes('previous') && "text-muted-foreground")}>
            {formatCurrency(entry.value, 'BOB')}
          </span>
        </div>
      ))}
    </div>
  )
}

function ChartLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CURRENT_INCOME_COLOR }} />
          <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">Ingresos (Actual)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PREVIOUS_INCOME_COLOR }} />
          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Ingresos (Anterior)</span>
        </div>
      </div>
      <div className="w-px h-3 bg-border hidden sm:block" />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CURRENT_EXPENSE_COLOR }} />
          <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">Gastos (Actual)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PREVIOUS_EXPENSE_COLOR }} />
          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Gastos (Anterior)</span>
        </div>
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="h-[320px] flex flex-col items-center justify-center gap-2">
      <div className="w-10 h-10 rounded-2xl bg-muted/30 flex items-center justify-center text-xl">
        📉
      </div>
      <p className="text-[13px] font-medium text-muted-foreground">Sin datos para comparar</p>
      <p className="text-[11px] text-muted-foreground/60">Registra transacciones para ver la comparativa</p>
    </div>
  )
}

interface FinancialComparisonChartProps {
  data: ChartDataPoint[]
}

export function FinancialComparisonChart({ data }: FinancialComparisonChartProps) {
  const hasData = data.some((d) => 
    (d.currentExpense ?? 0) > 0 || (d.previousExpense ?? 0) > 0 ||
    (d.currentIncome ?? 0) > 0 || (d.previousIncome ?? 0) > 0
  )

  return (
    <div
      className="bg-card rounded-3xl p-6 border border-border/40"
      style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.02)' }}
    >
      {/* ── Header ── */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">
          Comparativa Financiera
        </h3>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          Flujo de caja acumulado vs mes anterior
        </p>
      </div>

      {/* ── Chart ── */}
      {!hasData ? (
        <EmptyChart />
      ) : (
        <>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }}
                  dy={10}
                  tickFormatter={(v) => (v % 5 === 0 || v === 1 ? v : '')} // Mostrar solo algunos días para que no se amontonen
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }}
                  tickFormatter={(v) => `Bs${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Ingresos */}
                <Line
                  type="monotone"
                  dataKey="previousIncome"
                  name="previousIncome"
                  stroke={PREVIOUS_INCOME_COLOR}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: PREVIOUS_INCOME_COLOR }}
                />
                <Line
                  type="monotone"
                  dataKey="currentIncome"
                  name="currentIncome"
                  stroke={CURRENT_INCOME_COLOR}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: CURRENT_INCOME_COLOR }}
                />

                {/* Gastos */}
                <Line
                  type="monotone"
                  dataKey="previousExpense"
                  name="previousExpense"
                  stroke={PREVIOUS_EXPENSE_COLOR}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: PREVIOUS_EXPENSE_COLOR }}
                />
                <Line
                  type="monotone"
                  dataKey="currentExpense"
                  name="currentExpense"
                  stroke={CURRENT_EXPENSE_COLOR}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: CURRENT_EXPENSE_COLOR }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend />
        </>
      )}
    </div>
  )
}
