// features/cashflow/components/SankeyCustomNode.tsx
import { Layer, Rectangle } from "recharts"

const TYPE_COLORS: Record<string, string> = {
  income:  '#34d399',
  expense: '#fb7185',
  account: '#60a5fa',
  balance: '#9ca3af',
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
  payload?:        any
  containerWidth?: number
  fontSize?:       number   // ← nuevo
}

export function SankeyCustomNode({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  payload = {},
  containerWidth = 0,
  fontSize = 11,            // ← nuevo
}: SankeyNodeProps) {
  const isRight = x + width + 6 > containerWidth / 2

  const fill =
    NODE_COLORS[payload.name] ??
    payload.color             ??
    TYPE_COLORS[payload.type] ??
    '#60a5fa'

  // Truncar labels largos en pantallas pequeñas
  const maxChars = containerWidth < 400 ? 8 : containerWidth < 600 ? 12 : 20
  const label    = payload.name?.length > maxChars
    ? payload.name.slice(0, maxChars) + '…'
    : payload.name

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