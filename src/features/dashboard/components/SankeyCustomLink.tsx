import { Layer } from "recharts"
import { useSankeySelection } from "./SankeySelectionContext"

interface SankeyLinkProps {
  sourceX?: number
  targetX?: number
  sourceY?: number
  targetY?: number
  sourceControlX?: number
  targetControlX?: number
  linkWidth?: number
  index?: number
  payload?: {
    stroke?: string
    source?: {
      color?: string
    }
  }
}

// V2 minimal — zinc base, emerald only for income paths
const FALLBACK_STROKE = "#e4e4e7" // zinc-200

export function SankeyCustomLink({
  sourceX = 0,
  targetX = 0,
  sourceY = 0,
  targetY = 0,
  sourceControlX = 0,
  targetControlX = 0,
  linkWidth = 0,
  index = 0,
  payload,
}: SankeyLinkProps) {
  const { selectedIdx, connectedLinkIndices } = useSankeySelection()

  const stroke =
    payload?.stroke ??
    payload?.source?.color ??
    FALLBACK_STROKE

  const isIncome = stroke === '#059669'
  const baseColor = isIncome ? '#059669' : '#d4d4d8'

  const isConnected = selectedIdx === null || connectedLinkIndices.has(index)
  const opacity = isConnected ? (selectedIdx === null ? 0.55 : 0.85) : 0.08

  return (
    <Layer>
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY}
           ${targetControlX},${targetY}
           ${targetX},${targetY}
        `}
        fill="none"
        stroke={baseColor}
        strokeWidth={Math.max(linkWidth, 1)}
        strokeOpacity={opacity}
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
    </Layer>
  )
}
