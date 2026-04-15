"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { AdminVariant } from "@/services/admin/variants"
import type { I18nText } from "@/types/common"
import { updateVariantAction, deleteVariantAction } from "@/lib/actions/admin/variants"
import { linkVariantAction, unlinkVariantAction, searchUnlinkedECsAction } from "@/lib/actions/admin/external-codes"
import { ImageUpload } from "@/components/dashboard/image-upload"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { PageHeader } from "@/components/dashboard/page-header"
import Link from "next/link"

type AttrDef = { id: string; slug: string; name: I18nText; values: { id: string; slug: string; name: I18nText }[] }

export function VariantEditClient({
  productId,
  productName,
  variant,
  attributeDefs,
}: {
  productId: string
  productName: string
  variant: AdminVariant
  attributeDefs: AttrDef[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [sku, setSku] = useState(variant.sku)
  const [options, setOptions] = useState<{ key: string; value: string }[]>(
    Object.entries(variant.options).length > 0
      ? Object.entries(variant.options).map(([key, value]) => ({ key, value }))
      : [{ key: "", value: "" }]
  )
  const [unitsPerBox, setUnitsPerBox] = useState(variant.unitsPerBox?.toString() ?? "")
  const [sortOrder, setSortOrder] = useState(variant.sortOrder)
  const [active, setActive] = useState(variant.active)
  const [images, setImages] = useState<string[]>(variant.images.map(i => i.url))

  // EC link search
  type ECResult = { id: string; system: string; code: string; externalName: string | null; stock: number | null }
  const [ecSearch, setEcSearch] = useState("")
  const [ecResults, setEcResults] = useState<ECResult[]>([])
  const [ecSearching, setEcSearching] = useState(false)
  const [ecLinking, setEcLinking] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!ecSearch.trim()) { setEcResults([]); return }
    searchTimer.current = setTimeout(async () => {
      setEcSearching(true)
      const res = await searchUnlinkedECsAction(ecSearch)
      setEcResults(res.items)
      setEcSearching(false)
    }, 300)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [ecSearch])

  const handleLink = async (ecId: string) => {
    setEcLinking(true)
    await linkVariantAction(ecId, variant.id)
    setEcSearch("")
    setEcResults([])
    setEcLinking(false)
    router.refresh()
  }

  const handleUnlink = async (ecId: string) => {
    if (!confirm("¿Desvincular este código externo?")) return
    setEcLinking(true)
    await unlinkVariantAction(ecId)
    setEcLinking(false)
    router.refresh()
  }

  const addOption = () => setOptions([...options, { key: "", value: "" }])
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i))
  const updateOption = (i: number, field: "key" | "value", val: string) => {
    const arr = [...options]; arr[i] = { ...arr[i], [field]: val }; setOptions(arr)
  }

  const pickAttribute = (i: number, attrSlug: string) => {
    updateOption(i, "key", attrSlug)
  }

  const getValuesForKey = (key: string) => {
    const attr = attributeDefs.find(a => a.slug === key)
    return attr?.values ?? []
  }

  const handleSubmit = () => {
    setError(null)
    setSaved(false)
    const optionsObj: Record<string, string> = {}
    for (const o of options) {
      if (o.key.trim()) optionsObj[o.key.trim()] = o.value.trim()
    }

    startTransition(async () => {
      const res = await updateVariantAction(variant.id, productId, {
        sku,
        options: optionsObj,
        unitsPerBox: unitsPerBox ? parseInt(unitsPerBox) : null,
        sortOrder,
        active,
        images,
      })
      if (res.error) setError(res.error)
      else {
        setSaved(true)
        router.refresh()
      }
    })
  }

  const handleDelete = () => {
    if (!confirm("¿Eliminar esta variante? Esta acción no se puede deshacer.")) return
    startTransition(async () => {
      await deleteVariantAction(variant.id)
      router.push(`/dashboard/products/${productId}/variants`)
    })
  }

  const inputCls = "w-full h-9 rounded-lg border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 transition-shadow"

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Productos", href: "/dashboard/products" },
        { label: productName, href: `/dashboard/products/${productId}` },
        { label: "Variantes", href: `/dashboard/products/${productId}/variants` },
        { label: variant.sku },
      ]} />
      <PageHeader
        label={`Editar: ${variant.sku}`}
        action={
          <button onClick={handleDelete} disabled={isPending} className="h-9 px-4 border border-destructive text-destructive text-sm font-medium rounded-lg hover:bg-destructive/10">
            Eliminar variante
          </button>
        }
      >
        Producto: {productName}
      </PageHeader>

      {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2">{error}</p>}
      {saved && <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2">Cambios guardados.</p>}

      {/* SKU + Sort */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">SKU *</label>
          <input value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU-001" className={inputCls + " font-mono"} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Orden</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className={inputCls} />
        </div>
      </div>

      {/* Options with attribute picker */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Opciones / Atributos</h3>
          <button type="button" onClick={addOption} className="text-xs text-primary hover:underline">+ Agregar opción</button>
        </div>

        {attributeDefs.length > 0 && (
          <p className="text-xs text-muted-foreground">Seleccione un atributo predefinido o escriba uno personalizado.</p>
        )}

        {options.map((o, i) => {
          const suggestedValues = getValuesForKey(o.key)
          return (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                {attributeDefs.length > 0 ? (
                  <div className="flex gap-1">
                    <select
                      value={attributeDefs.some(a => a.slug === o.key) ? o.key : "__custom__"}
                      onChange={e => {
                        if (e.target.value === "__custom__") updateOption(i, "key", "")
                        else pickAttribute(i, e.target.value)
                      }}
                      className="h-8 rounded border px-2 text-xs flex-1"
                    >
                      <option value="__custom__">Personalizado...</option>
                      {attributeDefs.map(a => (
                        <option key={a.id} value={a.slug}>{a.name.es ?? a.slug}</option>
                      ))}
                    </select>
                    {!attributeDefs.some(a => a.slug === o.key) && (
                      <input value={o.key} onChange={e => updateOption(i, "key", e.target.value)} placeholder="Clave" className="flex-1 h-8 rounded border px-2 text-sm" />
                    )}
                  </div>
                ) : (
                  <input value={o.key} onChange={e => updateOption(i, "key", e.target.value)} placeholder="Clave (ej: Color)" className="w-full h-8 rounded border px-2 text-sm" />
                )}
              </div>
              <div className="flex-1">
                {suggestedValues.length > 0 ? (
                  <select value={o.value} onChange={e => updateOption(i, "value", e.target.value)} className="w-full h-8 rounded border px-2 text-xs">
                    <option value="">— Seleccionar valor —</option>
                    {suggestedValues.map(v => (
                      <option key={v.id} value={v.name.es ?? v.slug}>{v.name.es ?? v.slug}</option>
                    ))}
                  </select>
                ) : (
                  <input value={o.value} onChange={e => updateOption(i, "value", e.target.value)} placeholder="Valor (ej: Blanco)" className="w-full h-8 rounded border px-2 text-sm" />
                )}
              </div>
              <button type="button" onClick={() => removeOption(i)} className="text-destructive text-xs hover:underline shrink-0 mt-1">✕</button>
            </div>
          )
        })}
      </div>

      {/* Units & Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Uds/Caja</label>
          <input type="number" value={unitsPerBox} onChange={e => setUnitsPerBox(e.target.value)} placeholder="—" className={inputCls} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Activo</label>
          <label className="flex items-center gap-2 h-9">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" />
            <span className="text-sm">{active ? "Sí" : "No"}</span>
          </label>
        </div>
      </div>

      {/* Código externo vinculado */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Código externo</h3>
        {variant.externalCode ? (
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground block">Sistema</span>
                  <span className="font-mono text-xs">{variant.externalCode.system}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground block">Código</span>
                  <span className="font-mono text-xs">{variant.externalCode.code}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground block">Nombre</span>
                  <span className="font-mono text-xs">{variant.externalCode.externalName ?? "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground block">Stock</span>
                  <span className="font-mono text-xs">{variant.externalCode.stock ?? "—"}</span>
                </div>
              </div>
              <div className="shrink-0 flex gap-2">
                <Link
                  href={`/dashboard/external-codes/${variant.externalCode.id}`}
                  className="h-8 px-3 inline-flex items-center rounded-md border text-xs font-medium hover:bg-muted transition-colors"
                >
                  Ver / Editar
                </Link>
                <button
                  type="button"
                  disabled={ecLinking}
                  onClick={() => handleUnlink(variant.externalCode!.id)}
                  className="h-8 px-3 inline-flex items-center rounded-md border border-destructive text-destructive text-xs font-medium hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                >
                  Desvincular
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <input
                value={ecSearch}
                onChange={e => setEcSearch(e.target.value)}
                placeholder="Buscar por código o nombre externo..."
                className={inputCls}
              />
              {ecSearching && <span className="absolute right-3 top-2 text-xs text-muted-foreground">Buscando...</span>}
            </div>
            {ecResults.length > 0 && (
              <div className="border rounded-md divide-y text-sm">
                {ecResults.map(ec => (
                  <div key={ec.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/50">
                    <div className="flex gap-4 text-xs">
                      <span className="font-mono font-medium">{ec.code}</span>
                      <span className="text-muted-foreground">{ec.externalName ?? "—"}</span>
                      <span className="text-muted-foreground">Stock: {ec.stock ?? "—"}</span>
                    </div>
                    <button
                      type="button"
                      disabled={ecLinking}
                      onClick={() => handleLink(ec.id)}
                      className="h-7 px-3 rounded border border-primary text-primary text-xs font-medium hover:bg-primary/10 disabled:opacity-50 transition-colors"
                    >
                      Vincular
                    </button>
                  </div>
                ))}
              </div>
            )}
            {ecSearch.trim() && !ecSearching && ecResults.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin resultados sin vincular.</p>
            )}
          </div>
        )}
      </div>

      {/* Images */}
      <ImageUpload value={images} onChange={setImages} max={10} label="Imágenes de la variante" />

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t">
        <button onClick={handleSubmit} disabled={isPending || !sku.trim()}
          className="h-10 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
        <button onClick={() => router.push(`/dashboard/products/${productId}/variants`)} disabled={isPending} className="h-10 px-4 border rounded-lg text-sm hover:bg-muted">
          Volver a variantes
        </button>
      </div>
    </div>
  )
}
