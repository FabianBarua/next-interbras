"use client"

import { useState, useCallback, useTransition, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { SortTh } from "@/components/dashboard/sort-th"
import { TablePagination } from "@/components/dashboard/table-pagination"
import { useBulkSelect } from "@/hooks/use-bulk-select"
import { BulkBar, type BulkAction } from "@/components/dashboard/bulk-bar"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Column<T> {
  key: string
  header: string | ReactNode
  sortable?: boolean
  align?: "left" | "center" | "right"
  cell: (row: T) => ReactNode
  /** Extra classes merged onto every <td> (base is px-3 py-2 + align) */
  className?: string
  /** Extra classes merged onto the <th> header cell */
  headerClassName?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  getId: (row: T) => string

  /* Sort */
  sortBy: string
  sortDir: "asc" | "desc"
  onSort: (col: string) => void

  /* Bulk actions — enables checkbox column + BulkBar */
  bulkActions?: BulkAction[]

  /* Toolbar slot (search, filters, etc.) — rendered before flex-1 + BulkBar */
  toolbar?: ReactNode

  /* Actions column — auto-appended when provided */
  renderActions?: (
    row: T,
    helpers: { handleDelete: (id: string) => void },
  ) => ReactNode

  /* Delete dialog (built-in when onDelete is provided) */
  onDelete?: (id: string) => Promise<void>
  deleteTitle?: string
  deleteDescription?: string

  /* Pagination */
  page: number
  totalPages: number
  total: number
  perPage: number
  onPageChange: (p: number) => void
  onPerPageChange: (n: number) => void

  /* Empty state */
  emptyMessage?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DataTable<T>({
  data,
  columns,
  getId,
  sortBy,
  sortDir,
  onSort,
  bulkActions,
  toolbar,
  renderActions,
  onDelete,
  deleteTitle = "¿Eliminar elemento?",
  deleteDescription = "Esta acción no se puede deshacer.",
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  emptyMessage = "Sin resultados.",
}: DataTableProps<T>) {
  const hasBulk = !!bulkActions?.length
  const hasActions = !!renderActions

  /* Bulk selection */
  const ids = data.map(getId)
  const { selected, allSelected, toggle, toggleAll, clear, handleClick } = useBulkSelect(ids)

  /* Delete dialog */
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = useCallback(
    (id: string) => {
      if (!onDelete) return
      setDeleteId(id)
      setDeleteOpen(true)
    },
    [onDelete],
  )

  const confirmDelete = () => {
    if (!deleteId || !onDelete) return
    startTransition(async () => {
      await onDelete(deleteId)
      setDeleteOpen(false)
      setDeleteId(null)
    })
  }

  const colCount = columns.length + (hasBulk ? 1 : 0) + (hasActions ? 1 : 0)

  return (
    <>
      {/* ── Toolbar ── */}
      {(toolbar || hasBulk) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {toolbar}
          <div className="flex-1" />
          {hasBulk && (
            <BulkBar selected={selected} actions={bulkActions!} onClear={clear} />
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {hasBulk && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="size-3.5 rounded border-input"
                  />
                </th>
              )}

              {columns.map((col) =>
                col.sortable ? (
                  <SortTh
                    key={col.key}
                    col={col.key}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={onSort}
                    align={col.align}
                    className={col.headerClassName}
                  >
                    {col.header}
                  </SortTh>
                ) : (
                  <th
                    key={col.key}
                    className={cn(
                      "px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                          ? "text-right"
                          : "text-left",
                      col.headerClassName,
                    )}
                  >
                    {col.header}
                  </th>
                ),
              )}

              {hasActions && (
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {data.map((row) => {
              const id = getId(row)
              const isSelected = hasBulk && selected.has(id)
              return (
                <tr
                  key={id}
                  className={cn(
                    "border-b last:border-b-0 transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/20",
                    hasBulk && "cursor-pointer select-none",
                  )}
                  onClick={
                    hasBulk
                      ? (e: React.MouseEvent) => {
                          // don't select when clicking actions / links / buttons / inputs
                          const tag = (e.target as HTMLElement).closest(
                            "a, button, input, [role=\"button\"]",
                          )
                          if (tag) return
                          handleClick(id, e)
                        }
                      : undefined
                  }
                >
                  {hasBulk && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggle(id)}
                        onClick={(e) => e.stopPropagation()}
                        className="size-3.5 rounded border-input"
                      />
                    </td>
                  )}

                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-3 py-2",
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                            ? "text-right"
                            : "text-left",
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}

                  {hasActions && (
                    <td className="px-3 py-2 text-right">
                      {renderActions!(row, { handleDelete })}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
      />

      {/* ── Delete dialog ── */}
      {onDelete && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{deleteTitle}</DialogTitle>
              <DialogDescription>{deleteDescription}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={confirmDelete}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
