"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import type { AdminVariant } from "@/services/admin/variants"
import {
  createVariantAction,
  updateVariantAction,
  deleteVariantAction,
} from "@/lib/actions/admin/variants"
import {
  searchUnlinkedECsAction,
  linkVariantAction,
  unlinkVariantAction,
} from "@/lib/actions/admin/external-codes"
import { ImageUpload } from "@/components/dashboard/image-upload"
import {
  ErrorBanner,
  Field,
  FormActions,
  Grid,
  inputCls,
  SectionCard,
  SuccessBanner,
  SwitchField,
  TextField,
} from "./primitives"
import {
  emptyExternalCode,
  ExternalCodeFields,
  externalCodeFieldsToPayload,
  type AttrDef,
  type ExternalCodeFieldsValue,
} from "./attribute-pickers"
import { AttributeAssignment } from "./attribute-assignment"

/**
 * VariantEditor — single component used for:
 *  - creating a new variant (mode="create")
 *  - editing an existing variant (mode="edit")
 *
 * In edit mode it also exposes link / unlink to existing external codes,
 * delete, and live save.
 */
export function VariantEditor({
  productId,
  attributeDefs,
  variant,
  onDone,
  onCancel,
  redirectAfter,
  showHeader = true,
  highlight = "auto",
}: {
  productId: string
  attributeDefs: AttrDef[]
  /** If provided, edit mode. Otherwise, create mode. */
  variant?: AdminVariant
  /** Called after successful save / create (refresh data). */
  onDone?: () => void
  /** Called when user cancels (only used inline, when not redirecting). */
  onCancel?: () => void
  /** When provided, navigates here after successful create/save. */
  redirectAfter?: string
  showHeader?: boolean
  highlight?: "create" | "edit" | "auto" | "none"
}) {
  const isEdit = !!variant
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [attributeValueIds, setAttributeValueIds] = useState<string[]>(
    variant?.attributeValues.map((v) => v.valueId) ?? []
  )
  const [unitsPerBox, setUnitsPerBox] = useState(variant?.unitsPerBox?.toString() ?? "")
  const [active, setActive] = useState(variant?.active ?? true)
  const [images, setImages] = useState<string[]>(variant?.images.map((i) => i.url) ?? [])

  // External-code editor state (only relevant when no EC is currently linked,
  // or in create mode). When an EC is linked in edit-mode we render a compact
  // summary with Link/Unlink controls — the EC fields themselves are edited
  // through the dedicated /dashboard/external-codes/[id] page.
  const [ec, setEc] = useState<ExternalCodeFieldsValue>(() => {
    const existing = variant?.externalCode
    if (!existing) return emptyExternalCode
    return {
      system: existing.system,
      code: existing.code,
      externalName: existing.externalName ?? "",
      priceUsd: existing.priceUsd ?? "",
      priceGs: existing.priceGs ?? "",
      priceBrl: existing.priceBrl ?? "",
      price1: existing.price1 ?? "",
      price2: existing.price2 ?? "",
      price3: existing.price3 ?? "",
      stock: existing.stock?.toString() ?? "",
    }
  })

  const handleSave = () => {
    setError(null)
    setSaved(false)

    const ecPayload = ec.code.trim() ? externalCodeFieldsToPayload(ec) : undefined
    const unitsParsed = unitsPerBox ? parseInt(unitsPerBox) : null

    startTransition(async () => {
      if (isEdit && variant) {
        const res = await updateVariantAction(variant.id, productId, {
          attributeValueIds,
          unitsPerBox: unitsParsed,
          active,
          images,
          externalCode: ecPayload,
        })
        if ("error" in res && res.error) setError(res.error)
        else {
          setSaved(true)
          onDone?.()
        }
      } else {
        const res = await createVariantAction({
          productId,
          attributeValueIds,
          unitsPerBox: unitsParsed,
          active,
          images,
          externalCode: ecPayload,
        })
        if ("error" in res && res.error) setError(res.error)
        else onDone?.()
      }
    })
  }

  const handleDelete = () => {
    if (!variant) return
    if (!confirm("¿Eliminar esta variante? No se puede deshacer.")) return
    startTransition(async () => {
      const res = await deleteVariantAction(variant.id)
      if ("error" in res && res.error) setError(res.error)
      else onDone?.()
    })
  }

  const ringClass =
    highlight === "none"
      ? ""
      : highlight === "create" || (highlight === "auto" && !isEdit)
        ? "border-green-500/30 bg-green-500/[0.02]"
        : "border-primary/30 bg-primary/[0.02]"

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${ringClass}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {isEdit ? (
              <>
                Editando: <span className="font-mono">{variant?.externalCode?.code ?? "(sin código)"}</span>
              </>
            ) : (
              "Nueva variante"
            )}
          </h3>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-muted-foreground hover:underline"
            >
              Cerrar
            </button>
          )}
        </div>
      )}

      <ErrorBanner>{error}</ErrorBanner>
      <SuccessBanner>{saved ? "Cambios guardados." : null}</SuccessBanner>

      {/* Attributes */}
      <Field label="Atributos (opcionales)">
        <AttributeAssignment
          attributeDefs={attributeDefs}
          value={attributeValueIds}
          onChange={setAttributeValueIds}
        />
      </Field>

      {/* Meta */}
      <Grid cols={3}>
        <TextField
          label="Uds/Caja"
          value={unitsPerBox}
          onChange={setUnitsPerBox}
          type="number"
          min={1}
          placeholder="—"
        />
        <SwitchField label="Estado" checked={active} onChange={setActive} trueLabel="Activa" falseLabel="Inactiva" />
      </Grid>

      {/* External code */}
      {isEdit && variant?.externalCode ? (
        <LinkedExternalCodeBox variant={variant} onChange={onDone} />
      ) : (
        <SectionCard title="Código externo / Precios" className="bg-background!">
          {isEdit && variant && !variant.externalCode && (
            <UnlinkedECPicker variantId={variant.id} onLinked={onDone} />
          )}
          <ExternalCodeFields value={ec} onChange={setEc} />
          {!ec.code.trim() && (
            <p className="text-[11px] text-muted-foreground">
              Ingrese un código para crear el código externo asociado a esta variante.
            </p>
          )}
        </SectionCard>
      )}

      {/* Images */}
      <ImageUpload value={images} onChange={setImages} max={10} label="Imágenes (drag &amp; drop)" />

      <FormActions
        onSave={handleSave}
        onCancel={onCancel}
        cancelHref={!onCancel && redirectAfter ? redirectAfter : undefined}
        saveLabel={isEdit ? "Guardar cambios" : "Crear variante"}
        pending={isPending}
        onDelete={isEdit ? handleDelete : undefined}
        deleteLabel="Eliminar variante"
      />
    </div>
  )
}

/* ─── Linked EC summary box ─── */

function LinkedExternalCodeBox({
  variant,
  onChange,
}: {
  variant: AdminVariant
  onChange?: () => void
}) {
  const [pending, startTransition] = useTransition()
  const ec = variant.externalCode!
  const handleUnlink = () => {
    if (!confirm("¿Desvincular el código externo de esta variante?")) return
    startTransition(async () => {
      await unlinkVariantAction(ec.id)
      onChange?.()
    })
  }

  return (
    <SectionCard title="Código externo vinculado" className="bg-background!">
      <Grid cols={4}>
        <Info label="Sistema" value={<span className="font-mono">{ec.system}</span>} />
        <Info label="Código" value={<span className="font-mono">{ec.code}</span>} />
        <Info label="Nombre" value={ec.externalName ?? "—"} />
        <Info label="Stock" value={ec.stock ?? "—"} />
      </Grid>
      <Grid cols={3}>
        <Info label="USD" value={ec.priceUsd ?? "—"} mono />
        <Info label="Gs" value={ec.priceGs ?? "—"} mono />
        <Info label="BRL" value={ec.priceBrl ?? "—"} mono />
      </Grid>
      <div className="flex items-center gap-2 pt-1">
        <Link
          href={`/dashboard/external-codes/${ec.id}`}
          className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
        >
          Editar código externo
        </Link>
        <button
          type="button"
          onClick={handleUnlink}
          disabled={pending}
          className="inline-flex h-8 items-center rounded-md border border-destructive px-3 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          Desvincular
        </button>
      </div>
    </SectionCard>
  )
}

function Info({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <span className="block text-[10px] uppercase text-muted-foreground">{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  )
}

/* ─── Search & link an existing un-linked EC ─── */

function UnlinkedECPicker({
  variantId,
  onLinked,
}: {
  variantId: string
  onLinked?: () => void
}) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<
    { id: string; system: string; code: string; externalName: string | null; stock: number | null }[]
  >([])
  const [searching, setSearching] = useState(false)
  const [linking, setLinking] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (!search.trim()) {
      setResults([])
      return
    }
    timer.current = setTimeout(async () => {
      setSearching(true)
      const res = await searchUnlinkedECsAction(search)
      setResults(res.items)
      setSearching(false)
    }, 300)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [search])

  const handleLink = async (ecId: string) => {
    setLinking(true)
    await linkVariantAction(ecId, variantId)
    setSearch("")
    setResults([])
    setLinking(false)
    onLinked?.()
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed bg-muted/20 p-3">
      <p className="text-xs font-medium text-muted-foreground">
        ¿Vincular un código externo existente? Búscalo por código o nombre:
      </p>
      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar EC sin vincular..."
          className={inputCls}
        />
        {searching && (
          <span className="absolute right-3 top-2 text-xs text-muted-foreground">…</span>
        )}
      </div>
      {results.length > 0 && (
        <div className="divide-y rounded-md border bg-background text-sm">
          {results.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2">
              <div className="flex gap-3 text-xs">
                <span className="font-mono font-medium">{r.code}</span>
                <span className="text-muted-foreground">{r.externalName ?? "—"}</span>
                <span className="text-muted-foreground">Stock: {r.stock ?? "—"}</span>
              </div>
              <button
                type="button"
                disabled={linking}
                onClick={() => handleLink(r.id)}
                className="h-7 rounded border border-primary px-3 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
              >
                Vincular
              </button>
            </div>
          ))}
        </div>
      )}
      {search.trim() && !searching && results.length === 0 && (
        <p className="text-xs text-muted-foreground">Sin resultados sin vincular.</p>
      )}
      <p className="text-[11px] text-muted-foreground">
        O completá los campos abajo para crear uno nuevo asociado a esta variante.
      </p>
    </div>
  )
}
