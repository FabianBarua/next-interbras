"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Category } from "@/types/category"
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/lib/actions/admin/categories"
import { I18nInput } from "@/components/dashboard/i18n-input"
import { ImageUpload } from "@/components/dashboard/image-upload"
import { IconPicker } from "@/components/dashboard/icon-picker"
import {
  BackLink,
  ConfirmDeleteDialog,
  ErrorBanner,
  FormActions,
  Grid,
  SlugField,
  SwitchField,
  TextField,
} from "@/components/dashboard/form/primitives"

const LIST_HREF = "/dashboard/categories"

export function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter()
  const isEdit = !!category
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [slug, setSlug] = useState(category?.slug ?? "")
  const [nameEs, setNameEs] = useState(category?.name.es ?? "")
  const [namePt, setNamePt] = useState(category?.name.pt ?? "")
  const [descEs, setDescEs] = useState(((category?.description as { es?: string } | null)?.es) ?? "")
  const [descPt, setDescPt] = useState(((category?.description as { pt?: string } | null)?.pt) ?? "")
  const [shortDescEs, setShortDescEs] = useState(category?.shortDescription?.es ?? "")
  const [shortDescPt, setShortDescPt] = useState(category?.shortDescription?.pt ?? "")
  const [image, setImage] = useState(category?.image ?? "")
  const [svgIcon, setSvgIcon] = useState<string | null>(category?.svgIcon ?? null)
  const [svgIconMeta, setSvgIconMeta] = useState<{ library: string; name: string } | null>(
    category?.svgIconMeta ?? null
  )
  const [sortOrder, setSortOrder] = useState(category?.sortOrder ?? 0)
  const [active, setActive] = useState(category?.active ?? true)

  const handleSave = () => {
    setError(null)
    const payload = {
      slug,
      name: { es: nameEs, pt: namePt },
      description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
      shortDescription:
        shortDescEs || shortDescPt ? { es: shortDescEs, pt: shortDescPt } : undefined,
      image: image || undefined,
      svgIcon,
      svgIconMeta,
      sortOrder,
      active,
    }
    startTransition(async () => {
      const res = isEdit
        ? await updateCategoryAction(category!.id, payload)
        : await createCategoryAction(payload)
      if ("error" in res && res.error) setError(res.error)
      else router.push(LIST_HREF)
    })
  }

  const handleDelete = () => {
    if (!category) return
    startTransition(async () => {
      const res = await deleteCategoryAction(category.id)
      if ("error" in res && res.error) {
        setError(res.error)
        setDeleteOpen(false)
      } else router.push(LIST_HREF)
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <BackLink href={LIST_HREF}>Volver a categorías</BackLink>

      <ErrorBanner>{error}</ErrorBanner>

      <div className="space-y-5">
        <SlugField value={slug} onChange={setSlug} placeholder="ej: licuadoras" required />

        <I18nInput
          label="Nombre"
          valueEs={nameEs}
          valuePt={namePt}
          onChangeEs={setNameEs}
          onChangePt={setNamePt}
          placeholder="Nombre"
        />
        <I18nInput
          label="Descripción corta"
          valueEs={shortDescEs}
          valuePt={shortDescPt}
          onChangeEs={setShortDescEs}
          onChangePt={setShortDescPt}
          placeholder="Desc. corta"
        />
        <I18nInput
          label="Descripción"
          valueEs={descEs}
          valuePt={descPt}
          onChangeEs={setDescEs}
          onChangePt={setDescPt}
          textarea
          placeholder="Descripción completa"
        />

        <ImageUpload
          value={image ? [image] : []}
          onChange={(imgs) => setImage(imgs[0] ?? "")}
          max={1}
          label="Imagen"
        />

        <IconPicker
          value={svgIcon}
          meta={svgIconMeta}
          onChange={(svg, meta) => {
            setSvgIcon(svg)
            setSvgIconMeta(meta)
          }}
        />

        <Grid cols={2}>
          <TextField
            label="Orden"
            type="number"
            value={sortOrder.toString()}
            onChange={(v) => setSortOrder(Number(v) || 0)}
          />
          <SwitchField
            label="Estado"
            checked={active}
            onChange={setActive}
            trueLabel="Activa"
            falseLabel="Inactiva"
          />
        </Grid>
      </div>

      <FormActions
        onSave={handleSave}
        cancelHref={LIST_HREF}
        saveLabel={isEdit ? "Guardar cambios" : "Crear categoría"}
        pending={isPending}
        disabled={!slug || !nameEs}
        onDelete={isEdit ? () => setDeleteOpen(true) : undefined}
      />

      {isEdit && (
        <ConfirmDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Eliminar categoría"
          description={
            <>
              ¿Eliminar &quot;{category!.name.es}&quot;? Esta acción no se puede deshacer.
            </>
          }
          onConfirm={handleDelete}
          pending={isPending}
        />
      )}
    </div>
  )
}
