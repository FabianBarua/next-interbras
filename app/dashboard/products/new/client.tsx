"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Category } from "@/types/category"
import type { I18nSpecs } from "@/types/common"
import { createProductAction } from "@/lib/actions/admin/products"
import { I18nInput } from "@/components/dashboard/i18n-input"
import { ImageUpload } from "@/components/dashboard/image-upload"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { PageHeader } from "@/components/dashboard/page-header"

export function ProductCreateClient({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [slug, setSlug] = useState("")
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [nameEs, setNameEs] = useState("")
  const [namePt, setNamePt] = useState("")
  const [descEs, setDescEs] = useState("")
  const [descPt, setDescPt] = useState("")
  const [reviewEs, setReviewEs] = useState("")
  const [reviewPt, setReviewPt] = useState("")
  const [includedEs, setIncludedEs] = useState("")
  const [includedPt, setIncludedPt] = useState("")
  const [sortOrder, setSortOrder] = useState(0)
  const [active, setActive] = useState(true)
  const [images, setImages] = useState<string[]>([])

  const [specsEs, setSpecsEs] = useState<{ label: string; value: string }[]>([])
  const [specsPt, setSpecsPt] = useState<{ label: string; value: string }[]>([])

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

  const autoSlug = slug || nameEs.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  const handleSave = () => {
    setError(null)
    const specs: I18nSpecs = {}
    if (specsEs.length > 0) specs.es = specsEs.filter(s => s.label || s.value)
    if (specsPt.length > 0) specs.pt = specsPt.filter(s => s.label || s.value)

    startTransition(async () => {
      const res = await createProductAction({
        categoryId,
        slug: autoSlug,
        name: { es: nameEs, pt: namePt },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        specs: Object.keys(specs).length > 0 ? specs : undefined,
        review: reviewEs || reviewPt ? { es: reviewEs, pt: reviewPt } : undefined,
        included: includedEs || includedPt ? { es: includedEs, pt: includedPt } : undefined,
        sortOrder,
        active,
        images,
      })
      if ("error" in res) setError(res.error ?? "Error")
      else if ("id" in res) router.push(`/dashboard/products/${res.id}`)
    })
  }

  const inputCls = "w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"

  return (
    <div>
      <Breadcrumbs items={[
        { label: "Productos", href: "/dashboard/products" },
        { label: "Nuevo producto" },
      ]} />
      <PageHeader label="Nuevo producto">
        Complete la información y guarde para luego agregar variantes.
      </PageHeader>

      <div className="space-y-6">
        {/* Basic info */}
        <section className="rounded-2xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-base">Información básica</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Slug (auto-generado si vacío)</label>
              <input value={slug} onChange={e => setSlug(e.target.value)} placeholder={autoSlug || "mi-producto"} className={inputCls + " font-mono"} />
              {autoSlug && !slug && <p className="text-[10px] text-muted-foreground">→ {autoSlug}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Categoría</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputCls}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name.es ?? c.slug}</option>)}
              </select>
            </div>
          </div>
          <I18nInput label="Nombre" valueEs={nameEs} valuePt={namePt} onChangeEs={setNameEs} onChangePt={setNamePt} placeholder="Nombre del producto" />
          <I18nInput label="Descripción" valueEs={descEs} valuePt={descPt} onChangeEs={setDescEs} onChangePt={setDescPt} textarea placeholder="Descripción" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Orden</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className={inputCls} />
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

        {/* Images */}
        <section className="rounded-2xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-base">Imágenes del producto</h2>
          <ImageUpload value={images} onChange={setImages} max={15} />
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
          <button onClick={handleSave} disabled={isPending || !nameEs.trim()}
            className="h-10 px-8 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {isPending ? "Creando..." : "Crear producto"}
          </button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  )
}

function SpecsEditor({ locale, label, specs, onAdd, onRemove, onUpdate }: {
  locale: string; label: string; specs: { label: string; value: string }[]
  onAdd: () => void; onRemove: (i: number) => void; onUpdate: (i: number, field: "label" | "value", val: string) => void
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
