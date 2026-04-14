"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Check,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  bulkUpdateOrderStatus,
  updateOrderStatus,
} from "@/lib/actions/orders"

// ─── Helpers ─────────────────────────────────────────────────────

function statusColorClass(color: string) {
  // Convert hex color to a tailwind-compatible inline approach
  return `border px-2.5 py-0.5 text-xs font-medium rounded-full`
}

const fmtAmount = (v: string | number) =>
  Number(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

// ─── Types ───────────────────────────────────────────────────────

interface StatusInfo {
  slug: string
  label: string
  color: string
}

interface OrderRow {
  id: string
  status: string
  total: string
  discount: number | string | null
  paymentMethod: string | null
  sourceDomain: string | null
  createdAt: Date
  userName: string | null
  userEmail: string | null
}

interface OrdersTableProps {
  orders: OrderRow[]
  total: number
  page: number
  totalPages: number
  sortBy: string
  sortOrder: string
  statuses: StatusInfo[]
}

// ─── Component ───────────────────────────────────────────────────

export function OrdersTable({
  orders,
  total,
  page,
  totalPages,
  sortBy,
  sortOrder,
  statuses,
}: OrdersTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Build lookup maps from statuses prop
  const statusMap = new Map(statuses.map((s) => [s.slug, s]))

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const allSelected =
    orders.length > 0 && orders.every((o) => selected.has(o.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(orders.map((o) => o.id)))
    }
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  // Sorting
  const handleSort = useCallback(
    (col: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (sortBy === col) {
        params.set("sortOrder", sortOrder === "asc" ? "desc" : "asc")
      } else {
        params.set("sortBy", col)
        params.set("sortOrder", "desc")
      }
      params.delete("page")
      startTransition(() =>
        router.push(`${pathname}?${params.toString()}`),
      )
    },
    [router, pathname, searchParams, sortBy, sortOrder, startTransition],
  )

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ArrowUpDown className="size-3" />
    return sortOrder === "asc" ? (
      <ArrowUp className="size-3" />
    ) : (
      <ArrowDown className="size-3" />
    )
  }

  // Pagination
  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (p > 1) params.set("page", String(p))
    else params.delete("page")
    startTransition(() =>
      router.push(`${pathname}?${params.toString()}`),
    )
  }

  // Bulk & row-level dialogs
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<string>(statuses[0]?.slug ?? "confirmed")
  const [busy, setBusy] = useState(false)
  const [rowDialog, setRowDialog] = useState<{
    id: string
    current: string
  } | null>(null)
  const [rowStatus, setRowStatus] = useState("")

  const handleBulk = async () => {
    if (selected.size === 0) return
    setBusy(true)
    await bulkUpdateOrderStatus(
      [...selected],
      bulkStatus,
    )
    setBusy(false)
    setBulkOpen(false)
    setSelected(new Set())
  }

  const handleRowUpdate = async () => {
    if (!rowDialog) return
    setBusy(true)
    await updateOrderStatus(
      rowDialog.id,
      rowStatus,
    )
    setBusy(false)
    setRowDialog(null)
  }

  return (
    <>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
          <span className="text-sm font-medium">
            {selected.size} seleccionados
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setBulkOpen(true)}
          >
            Cambiar estado
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setBulkStatus("cancelled")
              setBulkOpen(true)
            }}
          >
            Cancelar seleccionados
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
            className="ml-auto"
          >
            Deseleccionar
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="size-3.5 rounded border-input"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <button
                    onClick={() => handleSort("userName")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Cliente <SortIcon col="userName" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <button
                    onClick={() => handleSort("status")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Estado <SortIcon col="status" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <button
                    onClick={() => handleSort("total")}
                    className="inline-flex items-center gap-1 justify-end hover:text-foreground"
                  >
                    Total <SortIcon col="total" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <button
                    onClick={() => handleSort("createdAt")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Fecha <SortIcon col="createdAt" />
                  </button>
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No se encontraron pedidos.
                  </td>
                </tr>
              )}
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className={`border-b last:border-0 transition-colors ${
                    selected.has(order.id)
                      ? "bg-primary/5"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(order.id)}
                      onChange={() => toggle(order.id)}
                      className="size-3.5 rounded border-input"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="hover:underline"
                    >
                      <p className="font-medium">
                        {order.userName ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.userEmail ?? "—"}
                      </p>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setRowDialog({
                          id: order.id,
                          current: order.status,
                        })
                        setRowStatus(order.status)
                      }}
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all hover:ring-2 hover:ring-primary/20 cursor-pointer"
                      style={{
                        backgroundColor: `${statusMap.get(order.status)?.color ?? "#6b7280"}15`,
                        color: statusMap.get(order.status)?.color ?? "#6b7280",
                        borderColor: `${statusMap.get(order.status)?.color ?? "#6b7280"}40`,
                      }}
                    >
                      {statusMap.get(order.status)?.label ?? order.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    US$ {fmtAmount(order.total)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString(
                      "es-PY",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary + pagination */}
      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} pedido{total !== 1 ? "s" : ""} — página {page} de{" "}
            {totalPages}
          </span>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Bulk status dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar estado de {selected.size} pedidos</DialogTitle>
            <DialogDescription>
              Seleccione el nuevo estado para los pedidos seleccionados.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 py-2">
            {statuses.map((s) => (
              <button
                key={s.slug}
                onClick={() => setBulkStatus(s.slug)}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-all ${
                  bulkStatus === s.slug
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-foreground/30"
                }`}
              >
                {bulkStatus === s.slug && (
                  <Check className="size-3.5 text-primary" />
                )}
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkOpen(false)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button onClick={handleBulk} disabled={busy}>
              {busy && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Row-level status dialog */}
      <Dialog
        open={!!rowDialog}
        onOpenChange={(v) => !v && setRowDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar estado</DialogTitle>
            <DialogDescription>
              Pedido {rowDialog?.id.slice(0, 8)}… — actual:{" "}
              {statusMap.get(rowDialog?.current ?? "")?.label ?? rowDialog?.current}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 py-2">
            {statuses.map((s) => (
              <button
                key={s.slug}
                onClick={() => setRowStatus(s.slug)}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-all ${
                  rowStatus === s.slug
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-foreground/30"
                }`}
              >
                {rowStatus === s.slug && (
                  <Check className="size-3.5 text-primary" />
                )}
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRowDialog(null)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRowUpdate}
              disabled={busy || rowStatus === rowDialog?.current}
            >
              {busy && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
