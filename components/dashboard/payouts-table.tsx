"use client"

import { useState, useTransition, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  bulkDeletePayouts,
  deletePayout,
  cancelPayout,
  completePayout,
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
import {
  MoreHorizontal,
  Trash2,
  XCircle,
  CheckCircle,
  ChevronRight,
  Wallet,
} from "lucide-react"

const PAYOUT_STATUS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pendiente", variant: "outline" },
  completed: { label: "Completado", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
}

interface Payout {
  id: string
  totalAmount: number
  affiliatesCount: number
  commissionsCount: number
  status: string
  createdByName: string | null
  notes: string | null
  createdAt: Date
}

export function PayoutsTable({ payouts }: { payouts: Payout[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<{
    ids: string[]
    label: string
  } | null>(null)
  const lastClickedIndex = useRef<number>(-1)

  const allIds = payouts.map((p) => p.id)
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
          ? await deletePayout(ids[0])
          : await bulkDeletePayouts(ids)
      if ("error" in res) alert(res.error)
      else refresh()
    })
  }

  function runCancel(payoutId: string) {
    if (
      !confirm(
        "¿Está seguro de cancelar este pago? Las comisiones serán restauradas.",
      )
    )
      return
    startTransition(async () => {
      const res = await cancelPayout(payoutId)
      if ("error" in res) alert(res.error)
      else refresh()
    })
  }

  function runComplete(payoutId: string) {
    if (
      !confirm(
        "¿Marcar este pago como completado? Las comisiones vinculadas serán marcadas como pagadas.",
      )
    )
      return
    startTransition(async () => {
      const res = await completePayout(payoutId)
      if ("error" in res) alert(res.error)
      else refresh()
    })
  }

  return (
    <>
      {someSelected && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                confirmDelete(
                  [...selected],
                  `${selected.size} pago${selected.size !== 1 ? "s" : ""}`,
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
              <TableHead>ID</TableHead>
              <TableHead className="w-28 text-right">Valor total</TableHead>
              <TableHead className="w-24 text-center">Afiliados</TableHead>
              <TableHead className="w-24 text-center">Comisiones</TableHead>
              <TableHead className="w-24 text-center">Estado</TableHead>
              <TableHead>Creado por</TableHead>
              <TableHead className="w-28">Fecha</TableHead>
              <TableHead className="hidden lg:table-cell">Notas</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-16 text-center">
                  <Wallet className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Ningún pago registrado.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              payouts.map((p, index) => (
                <TableRow
                  key={p.id}
                  className={selected.has(p.id) ? "bg-muted/40" : "group"}
                >
                  <TableCell className="px-4">
                    <Checkbox
                      checked={selected.has(p.id)}
                      onClick={(e) => toggleOne(p.id, index, e.shiftKey)}
                      aria-label="Seleccionar pago"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold">
                    {formatPrice(p.totalAmount)}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {p.affiliatesCount}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {p.commissionsCount}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        PAYOUT_STATUS[p.status]?.variant ?? "secondary"
                      }
                      className="text-[10px]"
                    >
                      {PAYOUT_STATUS[p.status]?.label ?? p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.createdByName ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.createdAt.toLocaleDateString("es-PY", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate text-xs text-muted-foreground lg:table-cell">
                    {p.notes ?? "—"}
                  </TableCell>
                  <TableCell>
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
                      <DropdownMenuContent align="end" className="w-44">
                        {p.status === "pending" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => runComplete(p.id)}
                            >
                              <CheckCircle className="mr-2 size-4 text-emerald-600" />
                              Completar pago
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => runCancel(p.id)}
                            >
                              <XCircle className="mr-2 size-4" />
                              Cancelar pago
                            </DropdownMenuItem>
                          </>
                        )}
                        {p.status === "completed" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => runCancel(p.id)}
                            >
                              <XCircle className="mr-2 size-4" />
                              Cancelar pago
                            </DropdownMenuItem>
                          </>
                        )}
                        {p.status === "cancelled" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                confirmDelete([p.id], "este pago")
                              }
                            >
                              <Trash2 className="mr-2 size-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              ¿Eliminar pago{deleteTarget?.ids.length !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Está a punto de eliminar{" "}
              <strong>{deleteTarget?.label}</strong>. Pagos completados serán
              ignorados. Para pagos pendientes, las comisiones serán
              restauradas. Esta acción no se puede deshacer.
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
