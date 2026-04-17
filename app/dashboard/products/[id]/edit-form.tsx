"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Category } from "@/types/category"
import type { I18nText, I18nRichText, I18nSpecs } from "@/types/common"
import { updateProductAction } from "@/lib/actions/admin/products"
import { createVariantAction, updateVariantAction, deleteVariantAction } from "@/lib/actions/admin/variants"
import { I18nInput } from "@/components/dashboard/i18n-input"
import { ImageUpload } from "@/components/dashboard/image-upload"
import type { AdminVariant } from "@/services/admin/variants"

interface ProductData {
  id: string
  categoryId: string
  slug: string
  name: I18nText
  description: I18nRichText | null
  specs: I18nSpecs | null
  review: I18nRichText | null
  included: I18nRichText | null
  sortOrder: number
  active: boolean

}

type AttrDef = { id: string; slug: string; name: I18nText; values: { id: string; slug: string; name: I18nText }[] }

export function ProductEditForm({
  product,
  categories,
  variants: initialVariants,
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
  const [sortOrder, setSortOrder] = useState(product.sortOrder)
  const [active, setActive] = useState(product.active)

  // Specs editor
  const [specsEs, setSpecsEs] = useState<{ label: string; value: string }[]>(
    product.specs?.es ?? []
  )
  const [specsPt, setSpecsPt] = useState<{ label: string; value: string }[]>(
    product.specs?.pt ?? []
  )

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
      const arr = [...specsEs]; arr[idx] = { ...arr[idx], [field]: val }; setSpecsEs(arr)
    } else {
      const arr = [...specsPt]; arr[idx] = { ...arr[idx], [field]: val }; setSpecsPt(arr)
    }
  }

  const handleSave = () => {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const specs: I18nSpecs = {}
      if (specsEs.length > 0) specs.es = specsEs.filter(s => s.label || s.value)
      if (specsPt.length > 0) specs.pt = specsPt.filter(s => s.label || s.value)

      const res = await updateProductAction(product.id, {
        categoryId,
        name: { es: nameEs, pt: namePt },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        specs: Object.keys(specs).length > 0 ? specs : undefined,
        review: reviewEs || reviewPt ? { es: reviewEs, pt: reviewPt } : undefined,
        included: includedEs || includedPt ? { es: includedEs, pt: includedPt } : undefined,
        sortOrder,
        active,
      })
      if ("error" in res) setError(res.error!)
      else {
        setSuccess(true)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Basic info */}
      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-base">Información básica</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Slug</label>
            <input value={product.slug} disabled className="w-full h-9 rounded-lg border px-3 text-sm font-mono opacity-50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Categoría</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full h-9 rounded-lg border px-3 text-sm">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name.es ?? c.slug}</option>)}
            </select>
          </div>
        </div>
        <I18nInput label="Nombre" valueEs={nameEs} valuePt={namePt} onChangeEs={setNameEs} onChangePt={setNamePt} placeholder="Nombre" />
        <I18nInput label="Descripción" valueEs={descEs} valuePt={descPt} onChangeEs={setDescEs} onChangePt={setDescPt} textarea placeholder="Descripción" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Orden</label>
            <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="w-full h-9 rounded-lg border px-3 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Activo</label>
            <label className="flex items-center gap-2 h-9">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" />
              <span className="text-sm">{active ? "Sí" : "No"}</span>
            </label>
          </div>
        </div>
      </section>

      {/* Specs */}
      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-base">Especificaciones técnicas</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpecsEditor locale="es" label="Español" specs={specsEs} onAdd={() => addSpec("es")} onRemove={(i) => removeSpec("es", i)} onUpdate={(i, f, v) => updateSpec("es", i, f, v)} />
          <SpecsEditor locale="pt" label="Português" specs={specsPt} onAdd={() => addSpec("pt")} onRemove={(i) => removeSpec("pt", i)} onUpdate={(i, f, v) => updateSpec("pt", i, f, v)} />
        </div>
      </section>

      {/* Review & Included */}
      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-base">Review / Contenido adicional</h2>
        <I18nInput label="Review" valueEs={reviewEs} valuePt={reviewPt} onChangeEs={setReviewEs} onChangePt={setReviewPt} textarea placeholder="Análisis / review" />
        <I18nInput label="Incluido en caja" valueEs={includedEs} valuePt={includedPt} onChangeEs={setIncludedEs} onChangePt={setIncludedPt} textarea placeholder="Contenido de la caja" />
      </section>

      {/* Variants inline */}
      <VariantsSection
        productId={product.id}
        initialVariants={initialVariants}
        attributeDefs={attributeDefs}
        onRefresh={() => router.refresh()}
      />

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={isPending}
          className="h-10 px-8 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
        <Link href={`/dashboard/products/${product.id}/variants`} className="h-10 px-6 inline-flex items-center border rounded-lg text-sm font-medium hover:bg-muted">
          Gestionar variantes →
        </Link>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">Guardado correctamente.</p>}
      </div>
    </div>
  )
}

function SpecsEditor({ locale, label, specs, onAdd, onRemove, onUpdate }: {
  locale: string
  label: string
  specs: { label: string; value: string }[]
  onAdd: () => void
  onRemove: (i: number) => void
  onUpdate: (i: number, field: "label" | "value", val: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">{label} ({locale.toUpperCase()})</span>
        <button type="button" onClick={onAdd} className="text-xs text-primary hover:underline">+ Agregar spec</button>
      </div>
      {specs.map((s, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={s.label} onChange={e => onUpdate(i, "label", e.target.value)} placeholder="Etiqueta" className="flex-1 h-8 rounded border px-2 text-sm" />
          <input value={s.value} onChange={e => onUpdate(i, "value", e.target.value)} placeholder="Valor" className="flex-1 h-8 rounded border px-2 text-sm" />
          <button type="button" onClick={() => onRemove(i)} className="text-destructive text-xs hover:underline shrink-0">✕</button>
        </div>
      ))}
      {specs.length === 0 && <p className="text-xs text-muted-foreground">Sin especificaciones.</p>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Variants Section — inline create / edit / delete
   ═══════════════════════════════════════════════════════════════════════ */

const inputCls = "w-full h-9 rounded-lg border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 transition-shadow"

function VariantsSection({
  productId,
  initialVariants,
  attributeDefs,
  onRefresh,
}: {
  productId: string
  initialVariants: AdminVariant[]
  attributeDefs: AttrDef[]
  onRefresh: () => void
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <section className="rounded-2xl border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">
          Variantes{" "}
          <span className="ml-1.5 text-xs font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
            {initialVariants.length}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => { setShowCreate(true); setEditingId(null) }}
          className="text-xs font-medium text-primary hover:underline"
        >
          + Agregar variante
        </button>
      </div>

      {/* Existing variants */}
      {initialVariants.length === 0 && !showCreate && (
        <p className="text-sm text-muted-foreground">No hay variantes todavía.</p>
      )}

      <div className="space-y-3">
        {initialVariants.map(v => (
          <VariantCard
            key={v.id}
            variant={v}
            productId={productId}
            attributeDefs={attributeDefs}
            isEditing={editingId === v.id}
            onEdit={() => setEditingId(editingId === v.id ? null : v.id)}
            onDone={() => { setEditingId(null); onRefresh() }}
          />
        ))}
      </div>

      {/* Inline create form */}
      {showCreate && (
        <InlineVariantCreate
          productId={productId}
          attributeDefs={attributeDefs}
          onCreated={() => { setShowCreate(false); onRefresh() }}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </section>
  )
}

/* ─── Variant Card (collapsed = summary, expanded = edit form) ─── */

function VariantCard({
  variant,
  productId,
  attributeDefs,
  isEditing,
  onEdit,
  onDone,
}: {
  variant: AdminVariant
  productId: string
  attributeDefs: AttrDef[]
  isEditing: boolean
  onEdit: () => void
  onDone: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Edit state
  const [sku, setSku] = useState(variant.sku)
  const [options, setOptions] = useState<{ key: string; value: string }[]>(
    Object.keys(variant.options).length > 0
      ? Object.entries(variant.options).map(([k, v]) => ({ key: k, value: v }))
      : [{ key: "", value: "" }]
  )
  const [unitsPerBox, setUnitsPerBox] = useState(variant.unitsPerBox?.toString() ?? "")
  const [sortOrder, setSortOrder] = useState(variant.sortOrder)
  const [active, setActive] = useState(variant.active)
  const [images, setImages] = useState<string[]>(variant.images.map(i => i.url))
  const [error, setError] = useState<string | null>(null)

  // External code state
  const [ecSystem, setEcSystem] = useState(variant.externalCode?.system ?? "cec")
  const [ecCode, setEcCode] = useState(variant.externalCode?.code ?? "")
  const [ecName, setEcName] = useState(variant.externalCode?.externalName ?? "")
  const [priceUsd, setPriceUsd] = useState(variant.externalCode?.priceUsd ?? "")
  const [priceGs, setPriceGs] = useState(variant.externalCode?.priceGs ?? "")
  const [priceBrl, setPriceBrl] = useState(variant.externalCode?.priceBrl ?? "")

  const handleSave = () => {
    setError(null)
    const optionsObj: Record<string, string> = {}
    for (const o of options) {
      if (o.key.trim()) optionsObj[o.key.trim()] = o.value.trim()
    }

    const ecData = ecCode.trim() ? {
      system: ecSystem || "cec",
      code: ecCode.trim(),
      externalName: ecName || undefined,
      priceUsd: priceUsd || undefined,
      priceGs: priceGs || undefined,
      priceBrl: priceBrl || undefined,
    } : undefined

    startTransition(async () => {
      const res = await updateVariantAction(variant.id, productId, {
        sku,
        options: optionsObj,
        unitsPerBox: unitsPerBox ? parseInt(unitsPerBox) : null,
        sortOrder,
        active,
        images,
        externalCode: ecData,
      })
      if ("error" in res && res.error) setError(res.error)
      else onDone()
    })
  }

  const handleDelete = () => {
    setDeleting(true)
    startTransition(async () => {
      const res = await deleteVariantAction(variant.id)
      if ("error" in res && res.error) { setError(res.error); setDeleting(false) }
      else onDone()
    })
  }

  const thumb = variant.images[0]?.url

  if (!isEditing) {
    // Collapsed summary
    return (
      <div className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/30 transition-colors">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {thumb ? (
            <Image src={thumb} alt={variant.sku} width={48} height={48} className="object-cover w-full h-full" />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-medium truncate">{variant.sku}</span>
            {!variant.active && <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">Inactivo</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {Object.entries(variant.options).map(([k, v]) => (
              <span key={k} className="text-[10px] bg-muted rounded-full px-2 py-0.5">{k}: {v}</span>
            ))}
            {variant.externalCode && (
              <span className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-full px-2 py-0.5">
                {variant.externalCode.system}: {variant.externalCode.code}
              </span>
            )}
            {variant.externalCode?.priceUsd && (
              <span className="text-[10px] font-medium text-green-700 dark:text-green-400">
                ${variant.externalCode.priceUsd}
              </span>
            )}
          </div>
        </div>
        <button onClick={onEdit} className="text-xs text-primary hover:underline shrink-0">Editar</button>
      </div>
    )
  }

  // Expanded edit form
  return (
    <div className="rounded-xl border border-primary/30 p-4 space-y-4 bg-primary/2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Editando: {variant.sku}</h3>
        <button onClick={onEdit} className="text-xs text-muted-foreground hover:underline">Cerrar</button>
      </div>

      {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-1.5">{error}</p>}

      {/* SKU + Sort + Active */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs text-muted-foreground">SKU</label>
          <input value={sku} onChange={e => setSku(e.target.value)} className={inputCls + " font-mono"} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Orden</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Activo</label>
          <label className="flex items-center gap-2 h-9">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" />
            <span className="text-sm">{active ? "Sí" : "No"}</span>
          </label>
        </div>
      </div>

      {/* Options */}
      <InlineOptions options={options} attributeDefs={attributeDefs} setOptions={setOptions} />

      {/* Units per box */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Uds/Caja</label>
          <input type="number" value={unitsPerBox} onChange={e => setUnitsPerBox(e.target.value)} placeholder="—" className={inputCls} />
        </div>
      </div>

      {/* External Code & Prices */}
      <div className="rounded-lg border p-3 space-y-3">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Código externo / Precios</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Sistema *</label>
            <select value={ecSystem} onChange={e => setEcSystem(e.target.value)} className={inputCls}>
              <option value="cec">CEC</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Código *</label>
            <input value={ecCode} onChange={e => setEcCode(e.target.value)} placeholder="Código externo" className={inputCls + " font-mono"} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Nombre externo</label>
            <input value={ecName} onChange={e => setEcName(e.target.value)} placeholder="Nombre en sistema externo" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Precio USD</label>
            <input value={priceUsd} onChange={e => setPriceUsd(e.target.value)} placeholder="0.00" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Precio Gs</label>
            <input value={priceGs} onChange={e => setPriceGs(e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Precio BRL</label>
            <input value={priceBrl} onChange={e => setPriceBrl(e.target.value)} placeholder="0.00" className={inputCls} />
          </div>
        </div>
        {variant.externalCode?.stock != null && (
          <div className="text-xs text-muted-foreground">
            Stock actual: <span className="font-medium text-foreground">{variant.externalCode.stock}</span>
          </div>
        )}
      </div>

      {/* Images */}
      <ImageUpload value={images} onChange={setImages} max={10} label="Imágenes" />

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t">
        <button onClick={handleSave} disabled={isPending || !sku.trim()}
          className="h-9 px-5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
          {isPending && !deleting ? "Guardando..." : "Guardar"}
        </button>
        <button onClick={onEdit} disabled={isPending} className="h-9 px-4 border rounded-lg text-sm hover:bg-muted">
          Cancelar
        </button>
        <div className="flex-1" />
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="text-xs text-destructive hover:underline">
            Eliminar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-destructive">¿Seguro?</span>
            <button onClick={handleDelete} disabled={isPending} className="text-xs text-destructive font-semibold hover:underline">
              {deleting ? "Eliminando..." : "Sí, eliminar"}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-muted-foreground hover:underline">No</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Inline Variant Create ─── */

function InlineVariantCreate({
  productId,
  attributeDefs,
  onCreated,
  onCancel,
}: {
  productId: string
  attributeDefs: AttrDef[]
  onCreated: () => void
  onCancel: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [sku, setSku] = useState("")
  const [options, setOptions] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }])
  const [unitsPerBox, setUnitsPerBox] = useState("")
  const [sortOrder, setSortOrder] = useState(0)
  const [active, setActive] = useState(true)
  const [images, setImages] = useState<string[]>([])

  const [ecSystem, setEcSystem] = useState("cec")
  const [ecCode, setEcCode] = useState("")
  const [ecName, setEcName] = useState("")
  const [priceUsd, setPriceUsd] = useState("")
  const [priceGs, setPriceGs] = useState("")
  const [priceBrl, setPriceBrl] = useState("")

  const handleCreate = () => {
    setError(null)
    const optionsObj: Record<string, string> = {}
    for (const o of options) {
      if (o.key.trim()) optionsObj[o.key.trim()] = o.value.trim()
    }

    const hasEc = ecCode.trim()
    const ecData = hasEc ? {
      system: ecSystem.trim() || "cec",
      code: ecCode.trim(),
      externalName: ecName || undefined,
      priceUsd: priceUsd || undefined,
      priceGs: priceGs || undefined,
      priceBrl: priceBrl || undefined,
    } : undefined

    startTransition(async () => {
      const res = await createVariantAction({
        productId,
        sku,
        options: optionsObj,
        unitsPerBox: unitsPerBox ? parseInt(unitsPerBox) : null,
        sortOrder,
        active,
        images,
        externalCode: ecData,
      })
      if ("error" in res && res.error) setError(res.error)
      else onCreated()
    })
  }

  return (
    <div className="rounded-xl border border-green-500/30 p-4 space-y-4 bg-green-500/2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-green-700 dark:text-green-400">Nueva variante</h3>
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:underline">Cancelar</button>
      </div>

      {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-1.5">{error}</p>}

      {/* SKU + Sort + Active */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs text-muted-foreground">SKU *</label>
          <input value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU-001" className={inputCls + " font-mono"} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Orden</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Activo</label>
          <label className="flex items-center gap-2 h-9">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" />
            <span className="text-sm">{active ? "Sí" : "No"}</span>
          </label>
        </div>
      </div>

      {/* Options */}
      <InlineOptions options={options} attributeDefs={attributeDefs} setOptions={setOptions} />

      {/* Units per box */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Uds/Caja</label>
          <input type="number" value={unitsPerBox} onChange={e => setUnitsPerBox(e.target.value)} placeholder="—" className={inputCls} />
        </div>
      </div>

      {/* External Code & Prices */}
      <div className="rounded-lg border p-3 space-y-3">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Código externo / Precios</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Sistema *</label>
            <select value={ecSystem} onChange={e => setEcSystem(e.target.value)} className={inputCls}>
              <option value="cec">CEC</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Código *</label>
            <input value={ecCode} onChange={e => setEcCode(e.target.value)} placeholder="Código externo" className={inputCls + " font-mono"} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Nombre externo</label>
            <input value={ecName} onChange={e => setEcName(e.target.value)} placeholder="Nombre en sistema externo" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Precio USD</label>
            <input value={priceUsd} onChange={e => setPriceUsd(e.target.value)} placeholder="0.00" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Precio Gs</label>
            <input value={priceGs} onChange={e => setPriceGs(e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Precio BRL</label>
            <input value={priceBrl} onChange={e => setPriceBrl(e.target.value)} placeholder="0.00" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Images */}
      <ImageUpload value={images} onChange={setImages} max={10} label="Imágenes de la variante" />

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t">
        <button onClick={handleCreate} disabled={isPending || !sku.trim()}
          className="h-9 px-5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
          {isPending ? "Creando..." : "Crear variante"}
        </button>
        <button onClick={onCancel} disabled={isPending} className="h-9 px-4 border rounded-lg text-sm hover:bg-muted">
          Cancelar
        </button>
      </div>
    </div>
  )
}

/* ─── Inline Options (shared between edit and create) ─── */

function InlineOptions({
  options,
  attributeDefs,
  setOptions,
}: {
  options: { key: string; value: string }[]
  attributeDefs: AttrDef[]
  setOptions: (opts: { key: string; value: string }[]) => void
}) {
  const addOption = () => setOptions([...options, { key: "", value: "" }])
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i))
  const updateOption = (i: number, field: "key" | "value", val: string) => {
    const arr = [...options]; arr[i] = { ...arr[i], [field]: val }; setOptions(arr)
  }
  const getValuesForKey = (key: string) => {
    const attr = attributeDefs.find(a => a.slug === key)
    return attr?.values ?? []
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Opciones / Atributos</h4>
        <button type="button" onClick={addOption} className="text-xs text-primary hover:underline">+ Agregar</button>
      </div>
      {options.map((o, i) => {
        const suggestedValues = getValuesForKey(o.key)
        const isPredefined = attributeDefs.some(a => a.slug === o.key)
        return (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1">
              {attributeDefs.length > 0 ? (
                <div className="flex gap-1">
                  <select
                    value={isPredefined ? o.key : "__custom__"}
                    onChange={e => {
                      if (e.target.value === "__custom__") updateOption(i, "key", "")
                      else { updateOption(i, "key", e.target.value); updateOption(i, "value", "") }
                    }}
                    className="h-8 rounded border px-2 text-xs flex-1"
                  >
                    <option value="__custom__">Personalizado...</option>
                    {attributeDefs.map(a => (
                      <option key={a.id} value={a.slug}>{a.name.es ?? a.slug}</option>
                    ))}
                  </select>
                  {!isPredefined && (
                    <input value={o.key} onChange={e => updateOption(i, "key", e.target.value)} placeholder="Clave" className="flex-1 h-8 rounded border px-2 text-sm" />
                  )}
                </div>
              ) : (
                <input value={o.key} onChange={e => updateOption(i, "key", e.target.value)} placeholder="Clave" className="w-full h-8 rounded border px-2 text-sm" />
              )}
            </div>
            <div className="flex-1">
              {suggestedValues.length > 0 ? (
                <select value={o.value} onChange={e => updateOption(i, "value", e.target.value)} className="w-full h-8 rounded border px-2 text-xs">
                  <option value="">— Seleccionar —</option>
                  {suggestedValues.map(v => (
                    <option key={v.id} value={v.name.es ?? v.slug}>{v.name.es ?? v.slug}</option>
                  ))}
                </select>
              ) : (
                <input value={o.value} onChange={e => updateOption(i, "value", e.target.value)} placeholder="Valor" className="w-full h-8 rounded border px-2 text-sm" />
              )}
            </div>
            <button type="button" onClick={() => removeOption(i)} className="text-destructive text-xs hover:underline shrink-0 mt-1">✕</button>
          </div>
        )
      })}
    </div>
  )
}
