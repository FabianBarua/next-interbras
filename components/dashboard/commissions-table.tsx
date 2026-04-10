"use client"

import { useState, useTransition, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  bulkUpdateCommissionStatus,
  bulkDeleteCommissions,
  updateCommissionStatus,
  deleteCommission,
} from "@/lib/actions/admin/affiliates"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Trash2, CheckCircle, XCircle, Receipt } from "lucide-react"

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pendiente", variant: "outline" },
  approved: { label: "Aprobada", variant: "secondary" },
  rejected: { label: "Rechazada", variant: "destructive" },
  paid: { label: "Pagada", variant: "default" },
}

interface Commission {
  id: string
  affiliateId: string
  affiliateName: string | null
  refCode: string
  orderId: string
  orderTotal: number
  commissionRate: number
  commission: number
  status: string
  createdAt: Date
}

export function CommissionsTable({
  commissions,
}: {
  commissions: Commission[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<{
    ids: string[]
    label: string
  } | null>(null)
  const lastClickedIndex = useRef<number>(-1)

  const allIds = commissions.map((c) => c.id)
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id))
  const someSelected = selected.size > 0

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(allIds))
    lastClickedIndex.current = -1
  }

  const toggleOne = useCallback(
    (id: string, index: number, shiftKey: boolean) => {
      if (shiftKey && lastClickedIndex.current !== -1) {
        const from = Math.min(lastClickedIndex.current, index)
        const to = Math.max(lastClickedIndex.current, index)
        const rangeIds = allIds.slice(from, to + 1)
        setSelected((prev) => {
          const next = new Set(prev)
          const adding = !prev.has(id)
          if (adding) rangeIds.forEach((rid) => next.add(rid))
          else rangeIds.forEach((rid) => next.delete(rid))
          return next
        })
      } else {
        setSelected((prev) => {
          const next = new Set(prev)
          next.has(id) ? next.delete(id) : next.add(id)
          return next
        })
        lastClickedIndex.current = index
      }
    },
    [allIds],
  )

  function refresh() {
    router.refresh()
    setSelected(new Set())
  }

  function runBulkStatus(newStatus: "approved" | "rejected") {
    startTransition(async () => {
      const res = await bulkUpdateCommissionStatus([...selected], newStatus)
      if ("error" in res) alert(res.error)
      else refresh()
    })
  }

  function confirmDelete(ids: string[], label: string) {
    setDeleteTarget({ ids, label })
  }

  function runDelete() {
    if (!deleteTarget) return
    const { ids } = deleteTarget
    setDeleteTarget(null)
    startTransition(async () => {
      const res =
        ids.length === 1
          ? await deleteCommission(ids[0])
          : await bulkDeleteCommissions(ids)
      if ("error" in res) alert(res.error)
      else refresh()
    })
  }

  function runSingleStatus(id: string, newStatus: "approved" | "rejected") {
    startTransition(async () => {
      const res = await updateCommissionStatus(id, newStatus)
      if ("error" in res) alert(res.error)
      else refresh()
    })
  }

  return (
    <>
      {someSelected && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {selected.size} seleccionada{selected.size !== 1 ? "s" : ""}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => runBulkStatus("approved")}
            >
              <CheckCircle className="mr-1.5 size-3.5 text-emerald-600" />
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => runBulkStatus("rejected")}
            >
              <XCircle className="mr-1.5 size-3.5 text-red-500" />
              Rechazar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                confirmDelete(
                  [...selected],
                  `${selected.size} comisi${selected.size !== 1 ? "ones" : "ón"}`,
                )
              }
            >
              <Trash2 className="mr-1.5 size-3.5" />
              Eliminar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 px-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
              <TableHead>Afiliado</TableHead>
              <TableHead>Pedido</TableHead>
              <TableHead className="w-28 text-right">Valor pedido</TableHead>
              <TableHead className="w-16 text-center">Tasa</TableHead>
              <TableHead className="w-28 text-right">Comisión</TableHead>
              <TableHead className="w-24 text-center">Estado</TableHead>
              <TableHead className="hidden w-28 lg:table-cell">Fecha</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center">
                  <Receipt className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Ninguna comisión encontrada.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              commissions.map((c, index) => (
                <TableRow
                  key={c.id}
                  className={selected.has(c.id) ? "bg-muted/40" : "group"}
                >
                  <TableCell className="px-4">
                    <Checkbox
                      checked={selected.has(c.id)}
                      onClick={(e) => toggleOne(c.id, index, e.shiftKey)}
                      aria-label="Seleccionar comisión"
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/affiliates/${c.affiliateId}`}
                      className="hover:underline"
                    >
                      <p className="text-sm font-medium">
                        {c.affiliateName ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.refCode}
                      </p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/orders/${c.orderId}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {c.orderId.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatPrice(c.orderTotal)}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {c.commissionRate}%
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatPrice(c.commission)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        STATUS_LABELS[c.status]?.variant ?? "secondary"
                      }
                      className="text-[10px]"
                    >
                      {STATUS_LABELS[c.status]?.label ?? c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                    {c.createdAt.toLocaleDateString("es-PY", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    {c.status !== "paid" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={isPending}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {c.status !== "approved" && (
                            <DropdownMenuItem
                              onClick={() =>
                                runSingleStatus(c.id, "approved")
                              }
                            >
                              <CheckCircle className="mr-2 size-4 text-emerald-600" />
                              Aprobar
                            </DropdownMenuItem>
                          )}
                          {c.status !== "rejected" && (
                            <DropdownMenuItem
                              onClick={() =>
                                runSingleStatus(c.id, "rejected")
                              }
                            >
                              <XCircle className="mr-2 size-4 text-red-500" />
                              Rechazar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              confirmDelete([c.id], "esta comisión")
                            }
                          >
                            <Trash2 className="mr-2 size-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar comisi{deleteTarget?.ids.length !== 1 ? "ones" : "ón"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Está a punto de eliminar{" "}
              <strong>{deleteTarget?.label}</strong>. Comisiones pagadas o
              vinculadas a pagos serán ignoradas. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={runDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
