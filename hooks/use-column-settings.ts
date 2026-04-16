"use client"

import { useState, useCallback, useEffect } from "react"

interface ColumnSettings {
  hidden: string[]
  widths: Record<string, number>
}

const STORAGE_PREFIX = "dt-cols:"

function loadSettings(tableId: string): ColumnSettings {
  if (typeof window === "undefined") return { hidden: [], widths: {} }
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + tableId)
    if (!raw) return { hidden: [], widths: {} }
    const parsed = JSON.parse(raw) as Partial<ColumnSettings>
    return {
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
      widths:
        parsed.widths && typeof parsed.widths === "object" ? parsed.widths : {},
    }
  } catch {
    return { hidden: [], widths: {} }
  }
}

function saveSettings(tableId: string, settings: ColumnSettings) {
  try {
    localStorage.setItem(STORAGE_PREFIX + tableId, JSON.stringify(settings))
  } catch {
    /* quota exceeded — ignore */
  }
}

export function useColumnSettings(tableId: string | undefined) {
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())
  const [colWidths, setColWidths] = useState<Record<string, number>>({})

  /* Hydrate from localStorage on mount */
  useEffect(() => {
    if (!tableId) return
    const s = loadSettings(tableId)
    setHiddenCols(new Set(s.hidden))
    setColWidths(s.widths)
  }, [tableId])

  /* Persist hidden cols */
  const persist = useCallback(
    (hidden: Set<string>, widths: Record<string, number>) => {
      if (!tableId) return
      saveSettings(tableId, { hidden: Array.from(hidden), widths })
    },
    [tableId],
  )

  const toggleColumn = useCallback(
    (key: string) => {
      setHiddenCols((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        persist(next, colWidths)
        return next
      })
    },
    [persist, colWidths],
  )

  const setColumnWidth = useCallback(
    (key: string, width: number) => {
      setColWidths((prev) => {
        const next = { ...prev, [key]: width }
        persist(hiddenCols, next)
        return next
      })
    },
    [persist, hiddenCols],
  )

  const resetAll = useCallback(() => {
    setHiddenCols(new Set())
    setColWidths({})
    persist(new Set(), {})
  }, [persist])

  return {
    hiddenCols,
    colWidths,
    toggleColumn,
    setColWidths,
    setColumnWidth,
    resetAll,
  }
}
