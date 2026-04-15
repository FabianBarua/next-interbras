"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Category } from "@/types/category"
import type { I18nText, I18nRichText, I18nSpecs } from "@/types/common"
import { updateProductAction } from "@/lib/actions/admin/products"
import { I18nInput } from "@/components/dashboard/i18n-input"

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

export function ProductEditForm({ product, categories }: { product: ProductData; categories: Category[] }) {
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
