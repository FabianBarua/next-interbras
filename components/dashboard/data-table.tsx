"use client"

import { useState } from "react"

interface Column<T> {
  key: string
  label: string
  render: (item: T) => React.ReactNode
  className?: string
  sortable?: boolean
}

interface Props<T> {
  items: T[]
  columns: Column<T>[]
  getId: (item: T) => string
  selected?: Set<string>
  onSelectionChange?: (sel: Set<string>) => void
  onRowClick?: (item: T) => void
  emptyMessage?: string
}

export function DataTable<T>({ items, columns, getId, selected, onSelectionChange, onRowClick, emptyMessage = "Sin resultados." }: Props<T>) {
  const hasSelection = !!onSelectionChange && !!selected

  const toggleAll = () => {
    if (!onSelectionChange || !selected) return
    if (selected.size === items.length) onSelectionChange(new Set())
    else onSelectionChange(new Set(items.map(getId)))
  }

  const toggle = (id: string) => {
    if (!onSelectionChange || !selected) return
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    onSelectionChange(s)
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {hasSelection && (
              <th className="w-10 px-3 py-2.5">
                <input type="checkbox" checked={items.length > 0 && selected.size === items.length} onChange={toggleAll} className="rounded" />
              </th>
            )}
            {columns.map(col => (
              <th key={col.key} className={`px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${col.className ?? ""}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const id = getId(item)
            return (
              <tr
                key={id}
                className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {hasSelection && (
                  <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(id)} onChange={() => toggle(id)} className="rounded" />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} className={`px-3 py-2 ${col.className ?? ""}`}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            )
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={columns.length + (hasSelection ? 1 : 0)} className="text-center py-12 text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
