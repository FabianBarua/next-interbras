"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createShippingMethodAction } from "@/lib/actions/admin/shipping-methods"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"

const inputClass = "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"

export function ShippingMethodForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [slug, setSlug] = useState("")
  const [nameEs, setNameEs] = useState("")
  const [namePt, setNamePt] = useState("")
  const [descEs, setDescEs] = useState("")
  const [descPt, setDescPt] = useState("")
  const [price, setPrice] = useState(0)
  const [sortOrder, setSortOrder] = useState(0)
  const [active, setActive] = useState(true)

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const res = await createShippingMethodAction({
        slug,
        name: { es: nameEs, pt: namePt },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        price,
        sortOrder,
        active,
      })
      if ("error" in res) {
        setError(res.error!)
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

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 50))}
            placeholder="envio-express"
            className={inputClass + " font-mono"}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre (ES)</label>
            <input
              value={nameEs}
              onChange={(e) => setNameEs(e.target.value)}
              placeholder="Envío Express"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre (PT)</label>
            <input
              value={namePt}
              onChange={(e) => setNamePt(e.target.value)}
              placeholder="Envio Expresso"
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

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={isPending || !slug || !nameEs}>
          {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
          Crear método de envío
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/shipping-methods">Cancelar</Link>
        </Button>
      </div>
    </div>
  )
}
