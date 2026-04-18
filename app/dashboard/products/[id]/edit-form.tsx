"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Category } from "@/types/category"
import type { I18nText, I18nRichText, I18nSpecs } from "@/types/common"
import { updateProductAction } from "@/lib/actions/admin/products"
import { I18nInput } from "@/components/dashboard/i18n-input"
import type { AdminVariant } from "@/services/admin/variants"
import {
  ErrorBanner,
  Field,
  FormActions,
  Grid,
  inputCls,
  SectionCard,
  smallInputCls,
  SuccessBanner,
  SwitchField,
} from "@/components/dashboard/form/primitives"
import { VariantEditor } from "@/components/dashboard/form/variant-editor"
import type { AttrDef } from "@/components/dashboard/form/attribute-pickers"

interface ProductData {
  id: string
  categoryId: string
  slug: string
  name: I18nText
  description: I18nRichText | null
  specs: I18nSpecs | null
  review: I18nRichText | null
  included: I18nRichText | null
  active: boolean
}

export function ProductEditForm({
  product,
  categories,
  variants,
  attributeDefs,
}: {
  product: ProductData
  categories: Category[]
  variants: AdminVariant[]
  attributeDefs: AttrDef[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [categoryId, setCategoryId] = useState(product.categoryId)
  const [nameEs, setNameEs] = useState(product.name.es ?? "")
  const [namePt, setNamePt] = useState(product.name.pt ?? "")
  const [descEs, setDescEs] = useState(product.description?.es ?? "")
  const [descPt, setDescPt] = useState(product.description?.pt ?? "")
  const [reviewEs, setReviewEs] = useState(product.review?.es ?? "")
  const [reviewPt, setReviewPt] = useState(product.review?.pt ?? "")
  const [includedEs, setIncludedEs] = useState(product.included?.es ?? "")
  const [includedPt, setIncludedPt] = useState(product.included?.pt ?? "")
  const [active, setActive] = useState(product.active)

  const [specsEs, setSpecsEs] = useState<{ label: string; value: string }[]>(product.specs?.es ?? [])
  const [specsPt, setSpecsPt] = useState<{ label: string; value: string }[]>(product.specs?.pt ?? [])

  const handleSave = () => {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const specs: I18nSpecs = {}
      if (specsEs.length > 0) specs.es = specsEs.filter((s) => s.label || s.value)
      if (specsPt.length > 0) specs.pt = specsPt.filter((s) => s.label || s.value)

      const res = await updateProductAction(product.id, {
        categoryId,
        name: { es: nameEs, pt: namePt },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        specs: Object.keys(specs).length > 0 ? specs : undefined,
        review: reviewEs || reviewPt ? { es: reviewEs, pt: reviewPt } : undefined,
        included: includedEs || includedPt ? { es: includedEs, pt: includedPt } : undefined,
        active,
      })
      if ("error" in res && res.error) setError(res.error)
      else {
        setSuccess(true)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-8">
      <ErrorBanner>{error}</ErrorBanner>
      <SuccessBanner>{success ? "Cambios guardados." : null}</SuccessBanner>

      <SectionCard title="Información básica">
        <Grid cols={2}>
          <Field label="Slug">
            <input value={product.slug} disabled className={`${inputCls} font-mono opacity-50`} />
          </Field>
          <Field label="Categoría">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputCls}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.es ?? c.slug}
                </option>
              ))}
            </select>
          </Field>
        </Grid>
        <I18nInput
          label="Nombre"
          valueEs={nameEs}
          valuePt={namePt}
          onChangeEs={setNameEs}
          onChangePt={setNamePt}
          placeholder="Nombre"
        />
        <I18nInput
          label="Descripción"
          valueEs={descEs}
          valuePt={descPt}
          onChangeEs={setDescEs}
          onChangePt={setDescPt}
          textarea
          placeholder="Descripción"
        />
        <SwitchField label="Activo" checked={active} onChange={setActive} trueLabel="Sí" falseLabel="No" />
      </SectionCard>

      <SectionCard title="Especificaciones técnicas">
        <Grid cols={2}>
          <SpecsEditor locale="ES" specs={specsEs} onChange={setSpecsEs} />
          <SpecsEditor locale="PT" specs={specsPt} onChange={setSpecsPt} />
        </Grid>
      </SectionCard>

      <SectionCard title="Review / Contenido adicional">
        <I18nInput
          label="Review"
          valueEs={reviewEs}
          valuePt={reviewPt}
          onChangeEs={setReviewEs}
          onChangePt={setReviewPt}
          textarea
          placeholder="Análisis / review"
        />
        <I18nInput
          label="Incluido en caja"
          valueEs={includedEs}
          valuePt={includedPt}
          onChangeEs={setIncludedEs}
          onChangePt={setIncludedPt}
          textarea
          placeholder="Contenido de la caja"
        />
      </SectionCard>

      <FormActions
        onSave={handleSave}
        cancelHref="/dashboard/products"
        saveLabel="Guardar cambios"
        pending={isPending}
        extra={
          <Link
            href={`/dashboard/products/${product.id}/variants`}
            className="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
          >
            Gestionar variantes →
          </Link>
        }
      />

      <VariantsSection
        productId={product.id}
        variants={variants}
        attributeDefs={attributeDefs}
        onRefresh={() => router.refresh()}
      />
    </div>
  )
}

/* ─── Specs editor ─── */

function SpecsEditor({
  locale,
  specs,
  onChange,
}: {
  locale: string
  specs: { label: string; value: string }[]
  onChange: (next: { label: string; value: string }[]) => void
}) {
  const update = (i: number, field: "label" | "value", val: string) =>
    onChange(specs.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)))
  const remove = (i: number) => onChange(specs.filter((_, idx) => idx !== i))
  const add = () => onChange([...specs, { label: "", value: "" }])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">{locale}</span>
        <button type="button" onClick={add} className="text-xs text-primary hover:underline">
          + Agregar spec
        </button>
      </div>
      {specs.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={s.label}
            onChange={(e) => update(i, "label", e.target.value)}
            placeholder="Etiqueta"
            className={smallInputCls}
          />
          <input
            value={s.value}
            onChange={(e) => update(i, "value", e.target.value)}
            placeholder="Valor"
            className={smallInputCls}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="shrink-0 text-xs text-destructive hover:underline"
          >
            ✕
          </button>
        </div>
      ))}
      {specs.length === 0 && <p className="text-xs text-muted-foreground">Sin especificaciones.</p>}
    </div>
  )
}

/* ─── Variants section ─── */

function VariantsSection({
  productId,
  variants,
  attributeDefs,
  onRefresh,
}: {
  productId: string
  variants: AdminVariant[]
  attributeDefs: AttrDef[]
  onRefresh: () => void
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <SectionCard
      title={
        <>
          Variantes{" "}
          <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {variants.length}
          </span>
        </>
      }
      action={
        <button
          type="button"
          onClick={() => {
            setShowCreate(true)
            setEditingId(null)
          }}
          className="text-xs font-medium text-primary hover:underline"
        >
          + Agregar variante
        </button>
      }
    >
      {variants.length === 0 && !showCreate && (
        <p className="text-sm text-muted-foreground">No hay variantes todavía.</p>
      )}

      <div className="space-y-3">
        {variants.map((v) =>
          editingId === v.id ? (
            <VariantEditor
              key={v.id}
              productId={productId}
              attributeDefs={attributeDefs}
              variant={v}
              onCancel={() => setEditingId(null)}
              onDone={() => {
                setEditingId(null)
                onRefresh()
              }}
              highlight="edit"
            />
          ) : (
            <VariantSummary key={v.id} variant={v} onEdit={() => setEditingId(v.id)} />
          )
        )}
      </div>

      {showCreate && (
        <VariantEditor
          productId={productId}
          attributeDefs={attributeDefs}
          onCancel={() => setShowCreate(false)}
          onDone={() => {
            setShowCreate(false)
            onRefresh()
          }}
          highlight="create"
        />
      )}
    </SectionCard>
  )
}

/* ─── Variant summary card ─── */

function VariantSummary({
  variant,
  onEdit,
}: {
  variant: AdminVariant
  onEdit: () => void
}) {
  const thumb = variant.images[0]?.url
  const code = variant.externalCode?.code ?? "(sin código)"

  return (
    <div className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/30">
      <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={code} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">—</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-mono text-sm font-medium">{code}</span>
          {!variant.active && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Inactivo</span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {variant.attributeValues.map((av) => (
            <span key={av.valueId} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
              {av.attributeName.es ?? av.attributeSlug}: {av.valueName.es ?? av.valueSlug}
            </span>
          ))}
          {variant.externalCode?.priceUsd && (
            <span className="text-[10px] font-medium text-green-700 dark:text-green-400">
              ${variant.externalCode.priceUsd}
            </span>
          )}
        </div>
      </div>
      <button onClick={onEdit} className="shrink-0 text-xs text-primary hover:underline">
        Editar
      </button>
    </div>
  )
}
