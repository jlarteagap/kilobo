import { Layer } from "recharts"
import type { SankeyData } from "../hooks/useCashflowData"
import { useSankeySelection } from "./SankeySelectionContext"

type SankeyNode = SankeyData['nodes'][number]

const TYPE_COLORS: Record<string, string> = {
  income:   '#34d399',
  expense:  '#fb7185',
  account:  '#60a5fa',
  balance:  '#9ca3af',
  project:  '#8B5CF6',
  subtype:  '#F59E0B',
  transfer: '#F97316',
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
  fontSize?:       number
}

export function SankeyCustomNode({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  payload,
  containerWidth = 0,
  fontSize = 11,
}: SankeyNodeProps) {
  const { selectedIdx, connectedNodeIndices, select } = useSankeySelection()

  const isSelected = selectedIdx === index
  const isDimmed   = selectedIdx !== null && !connectedNodeIndices.has(index)
  const isRight    = x + width + 6 > containerWidth / 2

  const fill =
    (payload?.name ? NODE_COLORS[payload.name] : null) ??
    payload?.color             ??
    (payload?.type ? TYPE_COLORS[payload.type] : null) ??
    '#60a5fa'

  const maxChars = containerWidth < 380 ? 6 : containerWidth < 500 ? 10 : 20
  const name     = payload?.name ?? ''
  const label    = name.length > maxChars
    ? name.slice(0, maxChars) + '…'
    : name

  const nodeOpacity  = isSelected ? 1 : isDimmed ? 0.15 : 0.9
  const labelOpacity = isDimmed ? 0.2 : 0.8
  const labelColor   = isDimmed ? '#d1d5db' : '#6b7280'
  const strokeColor  = isSelected ? '#374151' : 'none'
  const strokeW      = isSelected ? 2 : 0

  return (
    <Layer style={{ cursor: 'pointer' }}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={nodeOpacity}
        rx={2}
        stroke={strokeColor}
        strokeWidth={strokeW}
        data-sankey-node
        onClick={() => select(isSelected ? null : index)}
      />
      <text
        x={isRight ? x - 6 : x + width + 6}
        y={y + height / 2}
        textAnchor={isRight ? 'end' : 'start'}
        dominantBaseline="middle"
        fill={labelColor}
        fillOpacity={labelOpacity}
        fontSize={fontSize}
        className="font-medium tracking-tight"
        style={{ pointerEvents: 'none' }}
      >
        {label}
      </text>
    </Layer>
  )
}