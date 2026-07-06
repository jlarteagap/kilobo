"use client"

import { createContext, useContext, useMemo } from "react"
import type { SankeyData } from "../hooks/useCashflowData"

interface SankeySelectionValue {
  selectedIdx: number | null
  connectedNodeIndices: Set<number>
  connectedLinkIndices: Set<number>
  select: (idx: number | null) => void
}

const SankeySelectionContext = createContext<SankeySelectionValue>({
  selectedIdx: null,
  connectedNodeIndices: new Set(),
  connectedLinkIndices: new Set(),
  select: () => {},
})

export function SankeySelectionProvider({
  sankeyData,
  selectedIdx,
  onSelect,
  children,
}: {
  sankeyData: SankeyData
  selectedIdx: number | null
  onSelect: (idx: number | null) => void
  children: React.ReactNode
}) {
  const value = useMemo(() => {
    const connectedNodeIndices = new Set<number>()
    const connectedLinkIndices = new Set<number>()

    if (selectedIdx !== null && selectedIdx < sankeyData.nodes.length) {
      connectedNodeIndices.add(selectedIdx)
      sankeyData.links.forEach((link, i) => {
        if (link.source === selectedIdx || link.target === selectedIdx) {
          connectedNodeIndices.add(link.source)
          connectedNodeIndices.add(link.target)
          connectedLinkIndices.add(i)
        }
      })
    }

    return { selectedIdx, connectedNodeIndices, connectedLinkIndices, select: onSelect }
  }, [sankeyData, selectedIdx, onSelect])

  return (
    <SankeySelectionContext.Provider value={value}>
      {children}
    </SankeySelectionContext.Provider>
  )
}

export function useSankeySelection() {
  return useContext(SankeySelectionContext)
}
