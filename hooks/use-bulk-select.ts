"use client"

import { useState, useCallback } from "react"

export function useBulkSelect(pageIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const all = pageIds.length > 0 && pageIds.every((id) => prev.has(id))
      return all ? new Set() : new Set(pageIds)
    })
  }, [pageIds])

  const clear = useCallback(() => setSelected(new Set()), [])

  return { selected, allSelected, toggle, toggleAll, clear }
}
