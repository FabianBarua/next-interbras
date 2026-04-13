"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { AdminAttributeValue } from "@/services/admin/attributes"
import { updateAttributeValueAction, deleteAttributeValueAction } from "@/lib/actions/admin/attributes"
import { I18nInput } from "@/components/dashboard/i18n-input"
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

interface Props {
  attributeId: string
  attributeName: string
  value: AdminAttributeValue
}

export function ValueEditForm({ attributeId, attributeName, value }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [slug, setSlug] = useState(value.slug)
  const [nameEs, setNameEs] = useState(value.name.es ?? "")
  const [namePt, setNamePt] = useState(value.name.pt ?? "")
  const [sortOrder, setSortOrder] = useState(value.sortOrder)
  const [active, setActive] = useState(value.active)

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateAttributeValueAction(value.id, {
        slug,
        name: { es: nameEs, pt: namePt },
        sortOrder,
        active,
      })
      if ("error" in res) setError(res.error!)
      else router.push(`/dashboard/attributes/${attributeId}`)
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteAttributeValueAction(value.id)
      if ("error" in res) { setError(res.error!); setDeleteOpen(false) }
      else router.push(`/dashboard/attributes/${attributeId}`)
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/dashboard/attributes/${attributeId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Volver a {attributeName}
      </Link>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>

        <I18nInput label="Nombre" valueEs={nameEs} valuePt={namePt} onChangeEs={setNameEs} onChangePt={setNamePt} placeholder="Nombre" />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Orden</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Estado</label>
            <label className="flex items-center gap-2 h-9">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 rounded border-input" />
              <span className="text-sm">{active ? "Activo" : "Inactivo"}</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={isPending || !slug || !nameEs}>
          {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
          Guardar cambios
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/attributes/${attributeId}`}>Cancelar</Link>
        </Button>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="ml-auto">
          <Trash2 className="mr-1.5 size-3.5" /> Eliminar
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar valor</DialogTitle>
            <DialogDescription>¿Eliminar &quot;{value.name.es}&quot;? No se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
