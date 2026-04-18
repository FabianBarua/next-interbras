"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { Category } from "@/types/category"
import type { I18nText, I18nSpecs } from "@/types/common"
import { quickCreateProductWithVariantsAction } from "@/lib/actions/admin/products"
import { I18nInput } from "@/components/dashboard/i18n-input"
import { ImageUpload } from "@/components/dashboard/image-upload"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { PageHeader } from "@/components/dashboard/page-header"
import { AttributeAssignment } from "@/components/dashboard/form/attribute-assignment"

type AttrDef = {
  id: string
  slug: string
  name: I18nText
  values: { id: string; slug: string; name: I18nText }[]
}

interface VariantDraft {
  uid: string
  attributeValueIds: string[] // any combination, max one per attribute
  code: string
  externalName: string
  unitsPerBox: string
  stock: string
  priceUsd: string
  priceGs: string
  priceBrl: string
  images: string[]
}

let _uidSeq = 0
function newUid() {
  _uidSeq++
  return `v${Date.now()}-${_uidSeq}`
}

function emptyVariant(): VariantDraft {
  return {
    uid: newUid(),
    attributeValueIds: [],
    code: "",
    externalName: "",
    unitsPerBox: "",
    stock: "",
    priceUsd: "",
    priceGs: "",
    priceBrl: "",
    images: [],
  }
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const inputCls =
  "w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
const smallInputCls =
  "w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"

export function ProductCreateClient({
  categories,
  attributeDefs,
}: {
  categories: Category[]
  attributeDefs: AttrDef[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Product fields
  const [slug, setSlug] = useState("")
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [nameEs, setNameEs] = useState("")
  const [namePt, setNamePt] = useState("")
  const [active, setActive] = useState(true)

  // Advanced
  const [descEs, setDescEs] = useState("")
  const [descPt, setDescPt] = useState("")
  const [reviewEs, setReviewEs] = useState("")
  const [reviewPt, setReviewPt] = useState("")
  const [includedEs, setIncludedEs] = useState("")
  const [includedPt, setIncludedPt] = useState("")
  const [specsEs, setSpecsEs] = useState<{ label: string; value: string }[]>([])
  const [specsPt, setSpecsPt] = useState<{ label: string; value: string }[]>([])

  // Variants
  const [variantList, setVariantList] = useState<VariantDraft[]>([emptyVariant()])

  const autoSlug = slug || slugify(nameEs)
  const validVariants = variantList.filter((v) => v.code.trim())

  const updateVariant = (uid: string, patch: Partial<VariantDraft>) => {
    setVariantList((list) => list.map((v) => (v.uid === uid ? { ...v, ...patch } : v)))
  }
  const removeVariant = (uid: string) => {
    setVariantList((list) => (list.length === 1 ? list : list.filter((v) => v.uid !== uid)))
  }
  const addVariant = () => setVariantList((list) => [...list, emptyVariant()])
  const duplicateVariant = (uid: string) => {
    setVariantList((list) => {
      const src = list.find((v) => v.uid === uid)
      if (!src) return list
      const idx = list.indexOf(src)
      const copy: VariantDraft = { ...src, uid: newUid(), code: "", images: [...src.images] }
      const next = [...list]
      next.splice(idx + 1, 0, copy)
      return next
    })
  }

  // Specs
  const addSpec = (locale: "es" | "pt") => {
    if (locale === "es") setSpecsEs([...specsEs, { label: "", value: "" }])
    else setSpecsPt([...specsPt, { label: "", value: "" }])
  }
  const removeSpec = (locale: "es" | "pt", idx: number) => {
    if (locale === "es") setSpecsEs(specsEs.filter((_, i) => i !== idx))
    else setSpecsPt(specsPt.filter((_, i) => i !== idx))
  }
  const updateSpec = (locale: "es" | "pt", idx: number, field: "label" | "value", val: string) => {
    if (locale === "es") {
      const arr = [...specsEs]
      arr[idx] = { ...arr[idx], [field]: val }
      setSpecsEs(arr)
    } else {
      const arr = [...specsPt]
      arr[idx] = { ...arr[idx], [field]: val }
      setSpecsPt(arr)
    }
  }

  const handleSave = () => {
    setError(null)
    if (!nameEs.trim()) {
      setError("El nombre en español es obligatorio.")
      return
    }
    if (!categoryId) {
      setError("Seleccione una categoría.")
      return
    }
    if (validVariants.length === 0) {
      setError("Agregue al menos una variante con código (CEC).")
      return
    }
    const codes = validVariants.map((v) => v.code.trim().toUpperCase())
    const dup = codes.find((c, i) => codes.indexOf(c) !== i)
    if (dup) {
      setError(`Código duplicado en este formulario: ${dup}`)
      return
    }

    const specs: I18nSpecs = {}
    const cleanEs = specsEs.filter((s) => s.label || s.value)
    const cleanPt = specsPt.filter((s) => s.label || s.value)
    if (cleanEs.length > 0) specs.es = cleanEs
    if (cleanPt.length > 0) specs.pt = cleanPt

    const payload = {
      product: {
        categoryId,
        slug: autoSlug,
        name: { es: nameEs, pt: namePt || nameEs },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        specs: Object.keys(specs).length > 0 ? specs : undefined,
        review: reviewEs || reviewPt ? { es: reviewEs, pt: reviewPt } : undefined,
        included: includedEs || includedPt ? { es: includedEs, pt: includedPt } : undefined,
        active,
      },
      variants: validVariants.map((v) => ({
        attributeValueIds: v.attributeValueIds,
        unitsPerBox: v.unitsPerBox ? parseInt(v.unitsPerBox) : null,
        code: v.code.trim(),
        system: "cec",
        externalName: v.externalName.trim() || undefined,
        stock: v.stock ? parseInt(v.stock) : null,
        priceUsd: v.priceUsd || undefined,
        priceGs: v.priceGs || undefined,
        priceBrl: v.priceBrl || undefined,
        images: v.images.length > 0 ? v.images : undefined,
      })),
    }

    startTransition(async () => {
      const res = await quickCreateProductWithVariantsAction(payload)
      if ("error" in res && res.error) setError(res.error)
      else if ("id" in res && res.id) router.push(`/dashboard/products/${res.id}`)
    })
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Productos", href: "/dashboard/products" },
          { label: "Nuevo producto" },
        ]}
      />
      <PageHeader label="Nuevo producto">
        Cree el producto y sus variantes en un solo paso. Cada variante puede tener atributos opcionales,
        código CEC, precios e imágenes propias.
      </PageHeader>

      <div className="space-y-6 pb-24">
        {/* PRODUCT */}
        <section className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">Producto</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded"
              />
              Activo
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Categoría *</label>
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
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Slug <span className="text-muted-foreground/60">(auto si vacío)</span>
              </label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={autoSlug || "mi-producto"}
                className={inputCls + " font-mono"}
              />
              {autoSlug && !slug && (
                <p className="text-[10px] text-muted-foreground">→ {autoSlug}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nombre ES *</label>
              <input
                value={nameEs}
                onChange={(e) => setNameEs(e.target.value)}
                placeholder="Nombre en español"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nombre PT</label>
              <input
                value={namePt}
                onChange={(e) => setNamePt(e.target.value)}
                placeholder="(usa ES si vacío)"
                className={inputCls}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="text-xs text-primary hover:underline"
          >
            {showAdvanced
              ? "− Ocultar campos avanzados"
              : "+ Descripción, especificaciones, review, incluido"}
          </button>

          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t">
              <I18nInput
                label="Descripción"
                valueEs={descEs}
                valuePt={descPt}
                onChangeEs={setDescEs}
                onChangePt={setDescPt}
                textarea
                placeholder="Descripción"
              />
              <I18nInput
                label="Review"
                valueEs={reviewEs}
                valuePt={reviewPt}
                onChangeEs={setReviewEs}
                onChangePt={setReviewPt}
                textarea
                placeholder="Review / análisis"
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SpecsEditor
                  label="Especificaciones ES"
                  specs={specsEs}
                  onAdd={() => addSpec("es")}
                  onRemove={(i) => removeSpec("es", i)}
                  onUpdate={(i, f, v) => updateSpec("es", i, f, v)}
                />
                <SpecsEditor
                  label="Especificaciones PT"
                  specs={specsPt}
                  onAdd={() => addSpec("pt")}
                  onRemove={(i) => removeSpec("pt", i)}
                  onUpdate={(i, f, v) => updateSpec("pt", i, f, v)}
                />
              </div>
            </div>
          )}
        </section>

        {/* VARIANTS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-base">
                Variantes{" "}
                <span className="text-muted-foreground font-normal">
                  ({validVariants.length} con código)
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cada variante es independiente. Atributos opcionales. Sistema CEC por defecto.
              </p>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="h-9 px-4 text-sm rounded-lg border bg-card hover:bg-muted font-medium"
            >
              + Agregar variante
            </button>
          </div>

          <div className="space-y-3">
            {variantList.map((v, idx) => (
              <VariantCard
                key={v.uid}
                index={idx}
                variant={v}
                attributeDefs={attributeDefs}
                canRemove={variantList.length > 1}
                onChange={(patch) => updateVariant(v.uid, patch)}
                onRemove={() => removeVariant(v.uid)}
                onDuplicate={() => duplicateVariant(v.uid)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addVariant}
            className="w-full h-12 rounded-xl border-2 border-dashed border-muted-foreground/30 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors"
          >
            + Agregar otra variante
          </button>
        </section>
      </div>

      {/* STICKY ACTIONS */}
      <div className="sticky bottom-4 z-10">
        <div className="flex items-center gap-3 bg-background/90 backdrop-blur p-3 rounded-2xl border shadow-lg">
          <button
            onClick={handleSave}
            disabled={isPending || !nameEs.trim() || validVariants.length === 0}
            className="h-10 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending
              ? "Creando..."
              : `Crear producto + ${validVariants.length} variante${validVariants.length === 1 ? "" : "s"}`}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
            className="h-10 px-4 border rounded-lg text-sm hover:bg-muted"
          >
            Cancelar
          </button>
          {error && <p className="text-sm text-destructive flex-1">{error}</p>}
        </div>
      </div>
    </div>
  )
}

/* ─────────── VariantCard ─────────── */

function VariantCard({
  index,
  variant,
  attributeDefs,
  canRemove,
  onChange,
  onRemove,
  onDuplicate,
}: {
  index: number
  variant: VariantDraft
  attributeDefs: AttrDef[]
  canRemove: boolean
  onChange: (patch: Partial<VariantDraft>) => void
  onRemove: () => void
  onDuplicate: () => void
}) {
  const summary = useMemo(() => {
    if (variant.attributeValueIds.length === 0) return null
    const labels: string[] = []
    for (const attr of attributeDefs) {
      const valId = variant.attributeValueIds.find((id) => attr.values.some((v) => v.id === id))
      if (!valId) continue
      const val = attr.values.find((v) => v.id === valId)
      if (val) labels.push(val.name.es ?? val.slug)
    }
    return labels.join(" · ")
  }, [variant.attributeValueIds, attributeDefs])

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-semibold">
            {index + 1}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">
              {variant.code.trim() || <span className="text-muted-foreground italic">Sin código</span>}
              {variant.externalName && (
                <span className="text-muted-foreground font-normal"> — {variant.externalName}</span>
              )}
            </div>
            {summary && (
              <div className="text-[11px] text-muted-foreground truncate">{summary}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onDuplicate}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-background rounded"
            title="Duplicar"
          >
            Duplicar
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="h-7 w-7 inline-flex items-center justify-center text-destructive hover:bg-destructive/10 rounded"
              title="Eliminar"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* CEC + name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Código CEC *</label>
            <input
              value={variant.code}
              onChange={(e) => onChange({ code: e.target.value })}
              placeholder="Ej: 12345"
              className={inputCls + " font-mono"}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">
              Nombre externo <span className="text-muted-foreground/60">(opcional)</span>
            </label>
            <input
              value={variant.externalName}
              onChange={(e) => onChange({ externalName: e.target.value })}
              placeholder="Nombre tal como aparece en CEC"
              className={inputCls}
            />
          </div>
        </div>

        {/* Attributes */}
        {attributeDefs.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Atributos <span className="text-muted-foreground/60">(opcionales)</span>
            </label>
            <AttributeAssignment
              attributeDefs={attributeDefs}
              value={variant.attributeValueIds}
              onChange={(ids) => onChange({ attributeValueIds: ids })}
            />
          </div>
        )}

        {/* Prices + stock */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">USD</label>
            <input
              value={variant.priceUsd}
              onChange={(e) => onChange({ priceUsd: e.target.value })}
              placeholder="0.00"
              className={smallInputCls}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Gs</label>
            <input
              value={variant.priceGs}
              onChange={(e) => onChange({ priceGs: e.target.value })}
              placeholder="0"
              className={smallInputCls}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">BRL</label>
            <input
              value={variant.priceBrl}
              onChange={(e) => onChange({ priceBrl: e.target.value })}
              placeholder="0.00"
              className={smallInputCls}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Stock</label>
            <input
              value={variant.stock}
              onChange={(e) => onChange({ stock: e.target.value })}
              placeholder="—"
              className={smallInputCls}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Uds/Caja</label>
            <input
              value={variant.unitsPerBox}
              onChange={(e) => onChange({ unitsPerBox: e.target.value })}
              placeholder="—"
              className={smallInputCls}
            />
          </div>
        </div>

        {/* Images */}
        <ImageUpload
          value={variant.images}
          onChange={(imgs) => onChange({ images: imgs })}
          max={10}
          label="Imágenes (arrastra archivos aquí)"
        />
      </div>
    </div>
  )
}

/* ─────────── SpecsEditor ─────────── */

function SpecsEditor({
  label,
  specs,
  onAdd,
  onRemove,
  onUpdate,
}: {
  label: string
  specs: { label: string; value: string }[]
  onAdd: () => void
  onRemove: (i: number) => void
  onUpdate: (i: number, field: "label" | "value", val: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">{label}</h4>
        <button type="button" onClick={onAdd} className="text-xs text-primary hover:underline">
          + Agregar
        </button>
      </div>
      {specs.length === 0 && <p className="text-xs text-muted-foreground">Sin especificaciones.</p>}
      {specs.map((s, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={s.label}
            onChange={(e) => onUpdate(i, "label", e.target.value)}
            placeholder="Etiqueta"
            className="flex-1 h-8 rounded border px-2 text-sm"
          />
          <input
            value={s.value}
            onChange={(e) => onUpdate(i, "value", e.target.value)}
            placeholder="Valor"
            className="flex-1 h-8 rounded border px-2 text-sm"
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="text-destructive text-xs hover:underline px-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
