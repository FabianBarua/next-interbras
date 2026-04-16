"use client"

import { useState, useCallback, useRef } from "react"

export function useBulkSelect(pageIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const lastClickedRef = useRef<string | null>(null)

  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))

  /**
   * Handle a row click with modifier keys (native-like selection):
   *  - plain click  → select only this row
   *  - ctrl/cmd     → toggle this row without touching others
   *  - shift        → range-select from last clicked to this row
   *  - ctrl+shift   → add range to existing selection
   */
  const handleClick = useCallback(
    (id: string, e: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }) => {
      const ctrl = e.ctrlKey || e.metaKey

      if (e.shiftKey && lastClickedRef.current) {
        // range select
        const from = pageIds.indexOf(lastClickedRef.current)
        const to = pageIds.indexOf(id)
        if (from !== -1 && to !== -1) {
          const lo = Math.min(from, to)
          const hi = Math.max(from, to)
          const range = pageIds.slice(lo, hi + 1)
          setSelected((prev) => {
            const s = ctrl ? new Set(prev) : new Set<string>()
            for (const r of range) s.add(r)
            return s
          })
        }
        // don't update lastClicked on shift so you can shift-click again for a new range
        return
      }

      if (ctrl) {
        // toggle single
        setSelected((prev) => {
          const s = new Set(prev)
          if (s.has(id)) s.delete(id)
          else s.add(id)
          return s
        })
      } else {
        // plain click → select only this
        setSelected(new Set([id]))
      }

      lastClickedRef.current = id
    },
    [pageIds],
  )

  /** Simple toggle (used by checkbox onChange) */
  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
    lastClickedRef.current = id
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const all = pageIds.length > 0 && pageIds.every((id) => prev.has(id))
      return all ? new Set() : new Set(pageIds)
    })
  }, [pageIds])

  const clear = useCallback(() => {
    setSelected(new Set())
    lastClickedRef.current = null
  }, [])

  return { selected, allSelected, toggle, toggleAll, clear, handleClick }
}
