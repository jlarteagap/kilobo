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
  }
}

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
  const stroke = payload?.stroke ?? "#e5e7eb"

  const isConnected = selectedIdx === null || connectedLinkIndices.has(index)
  const opacity = isConnected ? (selectedIdx === null ? 0.6 : 1) : 0.04

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
        stroke={stroke}
        strokeWidth={linkWidth}
        strokeOpacity={opacity}
      />
    </Layer>
  )
}
