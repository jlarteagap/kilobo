// features/cashflow/components/SankeyCustomNode.tsx
import { Layer, Rectangle } from "recharts"

// Colores consistentes con el proyecto
const TYPE_COLORS: Record<string, string> = {
  income:  '#34d399',  // emerald-400
  expense: '#fb7185',  // rose-400
  account: '#60a5fa',  // blue-400
  balance: '#9ca3af',  // gray-400
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
}

export function SankeyCustomNode({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  payload = {},
  containerWidth = 0,
}: SankeyNodeProps) {
  const isRight = x + width + 6 > containerWidth

  const fill =
    NODE_COLORS[payload.name]  ??
    payload.color              ??
    TYPE_COLORS[payload.type]  ??
    '#60a5fa'

  return (
    <Layer key={`node-${index}`}>
      {/* Barra del nodo */}
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={1}
        radius={4}
      />
      {/* Label */}
      <text
        x={isRight ? x - 8 : x + width + 8}
        y={y + height / 2}
        textAnchor={isRight ? 'end' : 'start'}
        dominantBaseline="middle"
        fill="#6b7280"
        fontSize={11}
        fontWeight={500}
        fontFamily="inherit"
      >
        {payload.name}
      </text>
    </Layer>
  )
}