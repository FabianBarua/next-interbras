"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { ShippingMethod } from "@/types/shipping-method"
import type { Country } from "@/types/country"
import { updateShippingMethodAction, deleteShippingMethodAction } from "@/lib/actions/admin/shipping-methods"
import { updateShippingCountriesAction } from "@/lib/actions/admin/shipping-countries"
import { updatePaymentRulesAction } from "@/lib/actions/admin/shipping-payment-rules"
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

const inputClass = "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"

interface Props {
  method: ShippingMethod
  allCountries: Country[]
  assignedCountryIds: string[]
  allGatewayTypes: { type: string; displayName: string }[]
  assignedGatewayTypes: string[]
}

export function ShippingMethodEditForm({
  method,
  allCountries,
  assignedCountryIds,
  allGatewayTypes,
  assignedGatewayTypes,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  /* ── Basic fields ──────────────── */
  const [slug, setSlug] = useState(method.slug)
  const [nameEs, setNameEs] = useState(method.name.es ?? "")
  const [namePt, setNamePt] = useState(method.name.pt ?? "")
  const [descEs, setDescEs] = useState(method.description?.es ?? "")
  const [descPt, setDescPt] = useState(method.description?.pt ?? "")
  const [price, setPrice] = useState(method.price)
  const [sortOrder, setSortOrder] = useState(method.sortOrder)
  const [active, setActive] = useState(method.active)

  /* ── Country assignments ───────── */
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set(assignedCountryIds))
  const [countriesDirty, setCountriesDirty] = useState(false)

  const toggleCountry = (id: string) => {
    setSelectedCountries((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setCountriesDirty(true)
  }

  /* ── Payment assignments ────────── */
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set(assignedGatewayTypes))
  const [paymentsDirty, setPaymentsDirty] = useState(false)

  const togglePayment = (type: string) => {
    setSelectedPayments((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
    setPaymentsDirty(true)
  }

  /* ── Save ───────────────────────── */
  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateShippingMethodAction(method.id, {
        slug,
        name: { es: nameEs, pt: namePt },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        price,
        sortOrder,
        active,
      })
      if ("error" in res) {
        setError(res.error!)
        return
      }

      if (countriesDirty) {
        const cr = await updateShippingCountriesAction(method.id, Array.from(selectedCountries))
        if ("error" in cr) {
          setError(cr.error!)
          return
        }
      }

      if (paymentsDirty) {
        const pr = await updatePaymentRulesAction(method.id, Array.from(selectedPayments))
        if ("error" in pr) {
          setError(pr.error!)
          return
        }
      }

      router.push("/dashboard/shipping-methods")
    })
  }

  /* ── Delete ─────────────────────── */
  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteShippingMethodAction(method.id)
      if ("error" in res) {
        setError(res.error!)
        setDeleteOpen(false)
      } else {
        router.push("/dashboard/shipping-methods")
      }
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard/shipping-methods"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Volver a métodos de envío
      </Link>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Basic fields ──────────────── */}
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 50))}
            className={inputClass + " font-mono"}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre (ES)</label>
            <input value={nameEs} onChange={(e) => setNameEs(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre (PT)</label>
            <input value={namePt} onChange={(e) => setNamePt(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Descripción (ES)</label>
            <input value={descEs} onChange={(e) => setDescEs(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Descripción (PT)</label>
            <input value={descPt} onChange={(e) => setDescPt(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Precio (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className={inputClass + " font-mono"}
            />
          </div>
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
            <label className="text-xs font-medium text-muted-foreground">Estado</label>
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

      {/* ── Countries assignment ─────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Países habilitados</h2>
        {allCountries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay países configurados.</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {allCountries.map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedCountries.has(c.id)}
                  onChange={() => toggleCountry(c.id)}
                  className="size-4 rounded border-input"
                />
                <span className="text-sm">{c.flag} {c.name.es ?? c.code}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* ── Payments assignment ────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Medios de pago habilitados</h2>
        {allGatewayTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay medios de pago configurados.</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {allGatewayTypes.map((g) => (
              <label key={g.type} className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedPayments.has(g.type)}
                  onChange={() => togglePayment(g.type)}
                  className="size-4 rounded border-input"
                />
                <span className="text-sm">{g.displayName}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* ── Actions ───────────────────── */}
      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={isPending || !slug || !nameEs}>
          {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
          Guardar cambios
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/shipping-methods">Cancelar</Link>
        </Button>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="ml-auto">
          <Trash2 className="mr-1.5 size-3.5" /> Eliminar
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar método de envío</DialogTitle>
            <DialogDescription>
              ¿Eliminar &quot;{method.name.es ?? method.slug}&quot;? Se eliminarán también sus asignaciones de países y pagos. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>
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
