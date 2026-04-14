"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Country } from "@/types/country"
import { updateCountryAction, deleteCountryAction } from "@/lib/actions/admin/countries"
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
  country: Country
}

export function CountryEditForm({ country }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [code, setCode] = useState(country.code)
  const [flag, setFlag] = useState(country.flag)
  const [nameEs, setNameEs] = useState(country.name.es ?? "")
  const [namePt, setNamePt] = useState(country.name.pt ?? "")
  const [currency, setCurrency] = useState(country.currency)
  const [sortOrder, setSortOrder] = useState(country.sortOrder)
  const [active, setActive] = useState(country.active)

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateCountryAction(country.id, {
        code,
        name: { es: nameEs, pt: namePt },
        flag,
        currency,
        sortOrder,
        active,
      })
      if ("error" in res) {
        setError(res.error!)
      } else {
        router.push("/dashboard/countries")
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteCountryAction(country.id)
      if ("error" in res) {
        setError(res.error!)
        setDeleteOpen(false)
      } else {
        router.push("/dashboard/countries")
      }
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard/countries"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Volver a países
      </Link>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Código</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5))}
              className={inputClass + " font-mono uppercase"}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Bandera (emoji)</label>
            <input
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              className={inputClass + " text-center text-lg"}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Moneda</label>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 5))}
              className={inputClass + " font-mono"}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre (ES)</label>
            <input
              value={nameEs}
              onChange={(e) => setNameEs(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre (PT)</label>
            <input
              value={namePt}
              onChange={(e) => setNamePt(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        <Button onClick={handleSave} disabled={isPending || !code || !nameEs || !flag || !currency}>
          {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
          Guardar cambios
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/countries">Cancelar</Link>
        </Button>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="ml-auto">
          <Trash2 className="mr-1.5 size-3.5" /> Eliminar
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar país</DialogTitle>
            <DialogDescription>
              ¿Eliminar &quot;{country.flag} {country.name.es}&quot;? Se eliminarán también sus asignaciones de envío. Esta acción no se puede deshacer.
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
