import { Layer, Rectangle } from "recharts"

const NODE_COLORS: Record<string, string> = {
  "Ahorro/Excedente": "#10B981",
  "Fondos Previos": "#6B7280",
}

const TYPE_COLORS: Record<string, string> = {
  income: "#10B981",
  expense: "#EF4444",
  account: "#3B82F6",
  balance: "#6B7280",
}

interface SankeyNodeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  index?: number
  payload?: any
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
  const isOut = x + width + 6 > containerWidth

  const fill =
    NODE_COLORS[payload.name] ??
    payload.color ??
    TYPE_COLORS[payload.type] ??
    "#3B82F6"

  return (
    <Layer key={`node-${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity="1"
      />
      <text
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        textAnchor={isOut ? "end" : "start"}
        alignmentBaseline="middle"
        fill="#374151"
        fontSize="12"
        fontWeight="500"
      >
        {payload.name}
      </text>
    </Layer>
  )
}