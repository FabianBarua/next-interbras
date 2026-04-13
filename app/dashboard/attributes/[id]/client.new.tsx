"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { AdminAttributeFull, AdminAttributeValue } from "@/services/admin/attributes"
import {
  updateAttributeAction,
  deleteAttributeAction,
  deleteAttributeValueAction,
} from "@/lib/actions/admin/attributes"
import { I18nInput } from "@/components/dashboard/i18n-input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ArrowLeft, Loader2, Trash2, Plus } from "lucide-react"

export function AttributeEditClient({ attribute }: { attribute: AdminAttributeFull }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteValueId, setDeleteValueId] = useState<string | null>(null)

  // Attribute fields
  const [slug, setSlug] = useState(attribute.slug)
  const [nameEs, setNameEs] = useState(attribute.name.es ?? "")
  const [namePt, setNamePt] = useState(attribute.name.pt ?? "")
  const [descEs, setDescEs] = useState(attribute.description?.es ?? "")
  const [descPt, setDescPt] = useState(attribute.description?.pt ?? "")
  const [sortOrder, setSortOrder] = useState(attribute.sortOrder)
  const [active, setActive] = useState(attribute.active)

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateAttributeAction(attribute.id, {
        slug,
        name: { es: nameEs, pt: namePt },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        sortOrder,
        active,
      })
      if ("error" in res) setError(res.error!)
      else router.refresh()
    })
  }

  const handleDeleteAttribute = () => {
    startTransition(async () => {
      const res = await deleteAttributeAction(attribute.id)
      if ("error" in res) { setError(res.error!); setDeleteOpen(false) }
      else router.push("/dashboard/attributes")
    })
  }

  const handleDeleteValue = (id: string) => {
    startTransition(async () => {
      await deleteAttributeValueAction(id)
      setDeleteValueId(null)
      router.refresh()
    })
  }

  return (
    <div className="max-w-3xl space-y-8">
      <Link href="/dashboard/attributes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Volver a atributos
      </Link>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* Attribute edit form */}
      <div className="rounded-lg border p-5 space-y-5">
        <h2 className="text-sm font-semibold">Datos del atributo</h2>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>

        <I18nInput label="Nombre" valueEs={nameEs} valuePt={namePt} onChangeEs={setNameEs} onChangePt={setNamePt} placeholder="Nombre" />
        <I18nInput label="Descripción" valueEs={descEs} valuePt={descPt} onChangeEs={setDescEs} onChangePt={setDescPt} textarea placeholder="Descripción" />

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

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} disabled={isPending || !slug || !nameEs}>
            {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Guardar cambios
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-1.5 size-3.5" /> Eliminar atributo
          </Button>
        </div>
      </div>

      {/* Values section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Valores ({attribute.values.length})</h2>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/attributes/${attribute.id}/values/bulk`}
              className="inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium hover:bg-muted"
            >
              Crear en lote
            </Link>
            <Link
              href={`/dashboard/attributes/${attribute.id}/values/new`}
              className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-1 size-3" /> Nuevo valor
            </Link>
          </div>
        </div>

        {attribute.values.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No hay valores definidos.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Nombre</th>
                  <th className="text-left px-4 py-2 font-medium">Slug</th>
                  <th className="text-center px-4 py-2 font-medium">Orden</th>
                  <th className="text-center px-4 py-2 font-medium">Estado</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {attribute.values.map((val) => (
                  <tr key={val.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <Link href={`/dashboard/attributes/${attribute.id}/values/${val.id}`} className="hover:underline">
                        <span className="font-medium">{val.name.es || val.name.pt || "—"}</span>
                        {val.name.pt && val.name.es && <span className="text-xs text-muted-foreground ml-2">{val.name.pt}</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{val.slug}</td>
                    <td className="px-4 py-2 text-center tabular-nums">{val.sortOrder}</td>
                    <td className="px-4 py-2 text-center">
                      <Badge variant={val.active ? "default" : "secondary"}>{val.active ? "Activo" : "Inactivo"}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <Link href={`/dashboard/attributes/${attribute.id}/values/${val.id}`} className="text-xs text-muted-foreground hover:text-foreground">
                          Editar
                        </Link>
                        <button onClick={() => setDeleteValueId(val.id)} className="text-xs text-destructive hover:text-destructive/80 ml-2">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete attribute dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar atributo</DialogTitle>
            <DialogDescription>¿Eliminar &quot;{attribute.name.es}&quot; y todos sus valores? No se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteAttribute} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete value dialog */}
      <Dialog open={!!deleteValueId} onOpenChange={(v) => !v && setDeleteValueId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar valor</DialogTitle>
            <DialogDescription>¿Eliminar este valor? No se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteValueId(null)} disabled={isPending}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteValueId && handleDeleteValue(deleteValueId)} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
