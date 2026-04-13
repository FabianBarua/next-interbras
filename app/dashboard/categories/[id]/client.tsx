"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Category } from "@/types/category"
import { updateCategoryAction, deleteCategoryAction } from "@/lib/actions/admin/categories"
import { I18nInput } from "@/components/dashboard/i18n-input"
import { ImageUpload } from "@/components/dashboard/image-upload"
import { IconPicker } from "@/components/dashboard/icon-picker"
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
  category: Category
}

export function CategoryEditForm({ category }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [slug, setSlug] = useState(category.slug)
  const [nameEs, setNameEs] = useState(category.name.es ?? "")
  const [namePt, setNamePt] = useState(category.name.pt ?? "")
  const [descEs, setDescEs] = useState((category.description as any)?.es ?? "")
  const [descPt, setDescPt] = useState((category.description as any)?.pt ?? "")
  const [shortDescEs, setShortDescEs] = useState(category.shortDescription?.es ?? "")
  const [shortDescPt, setShortDescPt] = useState(category.shortDescription?.pt ?? "")
  const [image, setImage] = useState(category.image ?? "")
  const [svgIcon, setSvgIcon] = useState<string | null>(category.svgIcon)
  const [svgIconMeta, setSvgIconMeta] = useState<{ library: string; name: string } | null>(category.svgIconMeta)
  const [sortOrder, setSortOrder] = useState(category.sortOrder)
  const [active, setActive] = useState(category.active)

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateCategoryAction(category.id, {
        slug,
        name: { es: nameEs, pt: namePt },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        shortDescription: shortDescEs || shortDescPt ? { es: shortDescEs, pt: shortDescPt } : undefined,
        image: image || undefined,
        svgIcon,
        svgIconMeta,
        sortOrder,
        active,
      })
      if ("error" in res) {
        setError(res.error!)
      } else {
        router.push("/dashboard/categories")
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteCategoryAction(category.id)
      if ("error" in res) {
        setError(res.error!)
        setDeleteOpen(false)
      } else {
        router.push("/dashboard/categories")
      }
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard/categories"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Volver a categorías
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
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>

        <I18nInput label="Nombre" valueEs={nameEs} valuePt={namePt} onChangeEs={setNameEs} onChangePt={setNamePt} placeholder="Nombre" />
        <I18nInput label="Descripción corta" valueEs={shortDescEs} valuePt={shortDescPt} onChangeEs={setShortDescEs} onChangePt={setShortDescPt} placeholder="Desc. corta" />
        <I18nInput label="Descripción" valueEs={descEs} valuePt={descPt} onChangeEs={setDescEs} onChangePt={setDescPt} textarea placeholder="Descripción completa" />

        <ImageUpload value={image ? [image] : []} onChange={(imgs) => setImage(imgs[0] ?? "")} max={1} label="Imagen" />

        <IconPicker
          value={svgIcon}
          meta={svgIconMeta}
          onChange={(svg, meta) => {
            setSvgIcon(svg)
            setSvgIconMeta(meta)
          }}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Orden</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
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
              <span className="text-sm">{active ? "Activa" : "Inactiva"}</span>
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
          <Link href="/dashboard/categories">Cancelar</Link>
        </Button>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="ml-auto">
          <Trash2 className="mr-1.5 size-3.5" /> Eliminar
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              ¿Eliminar &quot;{category.name.es}&quot;? Esta acción no se puede deshacer.
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
