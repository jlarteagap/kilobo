// features/cashflow/components/SankeyCustomNode.tsx
import { Layer, Rectangle } from "recharts"
import type { SankeyData } from "../hooks/useCashflowData"

type SankeyNode = SankeyData['nodes'][number]

const TYPE_COLORS: Record<string, string> = {
  income:  '#34d399',
  expense: '#fb7185',
  account: '#60a5fa',
  balance: '#9ca3af',
  project: '#8B5CF6',  // ← NUEVO — violeta para proyectos
  subtype: '#F59E0B',  // ← NUEVO — amber para subtipos y tags
}

const NODE_COLORS: Record<string, string> = {
  'Ahorro/Excedente': '#34d399',
  'Fondos Previos':   '#9ca3af',
}

interface SankeyNodeProps {
  x?:              number
  y?:              number
  width?:          number
  height?:         number
  index?:          number
  payload?:        SankeyNode
  containerWidth?: number
  fontSize?:       number   // ← nuevo
}

export function SankeyCustomNode({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  payload,
  containerWidth = 0,
  fontSize = 11,            // ← nuevo
}: SankeyNodeProps) {
  const isRight = x + width + 6 > containerWidth / 2

  const fill =
    (payload?.name ? NODE_COLORS[payload.name] : null) ??
    payload?.color             ??
    (payload?.type ? TYPE_COLORS[payload.type] : null) ??
    '#60a5fa'

  // Truncar labels largos en pantallas pequeñas
  const maxChars = containerWidth < 400 ? 8 : containerWidth < 600 ? 12 : 20
  const name     = payload?.name ?? ''
  const label    = name.length > maxChars
    ? name.slice(0, maxChars) + '…'
    : name

  return (
    <Layer key={`node-${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={1}
        radius={4}
      />
      <text
        x={isRight ? x - 8 : x + width + 8}
        y={y + height / 2}
        textAnchor={isRight ? 'end' : 'start'}
        dominantBaseline="middle"
        fill="#6b7280"
        fontSize={fontSize}
        fontWeight={500}
        fontFamily="inherit"
      >
        {label}
      </text>
    </Layer>
  )
}