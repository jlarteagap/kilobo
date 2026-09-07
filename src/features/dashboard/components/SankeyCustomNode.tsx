import { Layer } from "recharts"
import type { SankeyData } from "../hooks/useCashflowData"
import { useSankeySelection } from "./SankeySelectionContext"

type SankeyNode = SankeyData['nodes'][number]

// V2 minimal — zinc neutrals + single emerald accent
const TYPE_COLORS: Record<string, string> = {
  income:   '#059669', // emerald-600
  expense:  '#27272a', // zinc-800
  account:  '#e4e4e7', // zinc-200
  balance:  '#18181b', // zinc-900
  project:  '#059669',
  subtype:  '#27272a',
  transfer: '#a1a1aa', // zinc-400
}

const NODE_COLORS: Record<string, string> = {
  'Ahorro/Excedente': '#18181b',
  'Fondos Previos':   '#52525b',
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
  fontSize = 12,
}: SankeyNodeProps) {
  const { selectedIdx, connectedNodeIndices, select } = useSankeySelection()

  const isSelected = selectedIdx === index
  const isDimmed   = selectedIdx !== null && !connectedNodeIndices.has(index)
  const isRight    = x + width + 6 > containerWidth / 2

  const fill =
    (payload?.name ? NODE_COLORS[payload.name] : null) ??
    payload?.color             ??
    (payload?.type ? TYPE_COLORS[payload.type] : null) ??
    '#18181b'

  // Account nodes are light fill, need stroke for visibility
  const isAccount = payload?.type === 'account'
  const stroke = isSelected ? '#09090b' : isAccount ? '#d4d4d8' : 'none'
  const strokeW = isSelected ? 1.5 : isAccount ? 1 : 0

  const maxChars = containerWidth < 380 ? 14 : containerWidth < 560 ? 18 : 22
  const name     = payload?.name ?? ''
  const label    = name.length > maxChars
    ? name.slice(0, maxChars) + '…'
    : name

  const nodeOpacity  = isSelected ? 1 : isDimmed ? 0.22 : 1
  const labelOpacity = isDimmed ? 0.35 : 1
  const labelColor   = '#52525b' // zinc-600, AA on white

  return (
    <Layer style={{ cursor: 'pointer' }}>
      <rect
        x={x}
        y={y}
        width={width}
        height={Math.max(height, 4)}
        fill={fill}
        fillOpacity={nodeOpacity}
        rx={3}
        stroke={stroke}
        strokeWidth={strokeW}
        data-sankey-node
        onClick={() => select(isSelected ? null : index)}
      />
      <text
        x={isRight ? x - 8 : x + width + 8}
        y={y + height / 2}
        textAnchor={isRight ? 'end' : 'start'}
        dominantBaseline="middle"
        fill={labelColor}
        fillOpacity={labelOpacity}
        fontSize={fontSize}
        fontWeight={500}
        style={{ pointerEvents: 'none', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
      >
        {label}
      </text>
    </Layer>
  )
}
