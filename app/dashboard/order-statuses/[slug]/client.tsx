"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { OrderStatusRecord } from "@/types/order-flow"
import {
  updateOrderStatusAction,
  deleteOrderStatusAction,
} from "@/lib/actions/admin/order-statuses"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Loader2, ArrowLeft, Trash2 } from "lucide-react"

const inputClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"

const COLOR_OPTIONS = [
  { label: "Gris", value: "#6b7280" },
  { label: "Azul", value: "#3b82f6" },
  { label: "Amarillo", value: "#eab308" },
  { label: "Verde", value: "#22c55e" },
  { label: "Rojo", value: "#ef4444" },
  { label: "Naranja", value: "#f97316" },
  { label: "Violeta", value: "#8b5cf6" },
  { label: "Cyan", value: "#06b6d4" },
]

const ICON_OPTIONS = [
  "Circle",
  "Clock",
  "CreditCard",
  "CheckCircle",
  "Package",
  "PackageCheck",
  "Truck",
  "MapPin",
  "CircleCheck",
  "XCircle",
  "RotateCcw",
]

export function OrderStatusEditForm({ status }: { status: OrderStatusRecord }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [nameEs, setNameEs] = useState(status.name.es ?? "")
  const [namePt, setNamePt] = useState(status.name.pt ?? "")
  const [descEs, setDescEs] = useState(status.description?.es ?? "")
  const [descPt, setDescPt] = useState(status.description?.pt ?? "")
  const [color, setColor] = useState(status.color)
  const [icon, setIcon] = useState(status.icon)
  const [isFinal, setIsFinal] = useState(status.isFinal)
  const [sortOrder, setSortOrder] = useState(status.sortOrder)
  const [active, setActive] = useState(status.active)

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateOrderStatusAction(status.slug, {
        name: { es: nameEs, pt: namePt },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        color,
        icon,
        isFinal,
        sortOrder,
        active,
      })
      if ("error" in res) {
        setError(res.error!)
      } else {
        router.push("/dashboard/order-statuses")
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteOrderStatusAction(status.slug)
      if ("error" in res) {
        setError(res.error!)
        setDeleteOpen(false)
      } else {
        router.push("/dashboard/order-statuses")
      }
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard/order-statuses"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Volver a estados
      </Link>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Slug</label>
          <input
            value={status.slug}
            disabled
            className={inputClass + " font-mono opacity-60 cursor-not-allowed"}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre (ES)</label>
            <input
              value={nameEs}
              onChange={(e) => setNameEs(e.target.value)}
              placeholder="Preparando"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre (PT)</label>
            <input
              value={namePt}
              onChange={(e) => setNamePt(e.target.value)}
              placeholder="Preparando"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Descripción (ES)</label>
            <input
              value={descEs}
              onChange={(e) => setDescEs(e.target.value)}
              placeholder="Opcional"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Descripción (PT)</label>
            <input
              value={descPt}
              onChange={(e) => setDescPt(e.target.value)}
              placeholder="Opcional"
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setColor(opt.value)}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  color === opt.value
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-input hover:bg-muted/40"
                }`}
              >
                <span
                  className="inline-block size-3 rounded-full"
                  style={{ backgroundColor: opt.value }}
                />
                {opt.label}
              </button>
            ))}
          </div>
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#6b7280"
            className={inputClass + " mt-2 font-mono max-w-[200px]"}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Icono</label>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setIcon(opt)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  icon === opt
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-input hover:bg-muted/40"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Orden</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Estado final</label>
            <label className="flex items-center gap-2 h-9">
              <input
                type="checkbox"
                checked={isFinal}
                onChange={(e) => setIsFinal(e.target.checked)}
                className="size-4 rounded border-input"
              />
              <span className="text-sm">{isFinal ? "Sí" : "No"}</span>
            </label>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Activo</label>
            <label className="flex items-center gap-2 h-9">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="size-4 rounded border-input"
              />
              <span className="text-sm">{active ? "Activo" : "Inactivo"}</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={isPending || !nameEs}>
          {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
          Guardar cambios
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/order-statuses">Cancelar</Link>
        </Button>
        <Button
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
          className="ml-auto"
        >
          <Trash2 className="mr-1.5 size-3.5" /> Eliminar
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar estado de pedido</DialogTitle>
            <DialogDescription>
              ¿Eliminar &quot;{status.name.es ?? status.slug}&quot;? Esta acción no se
              puede deshacer. Si el estado está en uso por algún flujo, la
              eliminación fallará.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
