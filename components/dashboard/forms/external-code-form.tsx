"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, LinkIcon, Unlink } from "lucide-react"
import type { AdminExternalCode } from "@/services/admin/external-codes"
import {
  createExternalCodeAction,
  deleteExternalCodeAction,
  linkVariantAction,
  searchVariantsBySkuAction,
  unlinkVariantAction,
  updateExternalCodeAction,
} from "@/lib/actions/admin/external-codes"
import { Button } from "@/components/ui/button"
import {
  BackLink,
  ConfirmDeleteDialog,
  ErrorBanner,
  FormActions,
  inputCls,
} from "@/components/dashboard/form/primitives"
import {
  ExternalCodeFields,
  externalCodeFieldsToPayload,
  type ExternalCodeFieldsValue,
} from "@/components/dashboard/form/attribute-pickers"

const LIST_HREF = "/dashboard/external-codes"

export function ExternalCodeForm({ ec }: { ec?: AdminExternalCode }) {
  const router = useRouter()
  const isEdit = !!ec
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [value, setValue] = useState<ExternalCodeFieldsValue>(() => ({
    system: ec?.system ?? "cec",
    code: ec?.code ?? "",
    externalName: ec?.externalName ?? "",
    priceUsd: ec?.priceUsd ?? "",
    priceGs: ec?.priceGs ?? "",
    priceBrl: ec?.priceBrl ?? "",
    price1: ec?.price1 ?? "",
    price2: ec?.price2 ?? "",
    price3: ec?.price3 ?? "",
    stock: ec?.stock?.toString() ?? "",
  }))

  // Variant picker (only used when EC exists and is unlinked, OR on create)
  const [pickedVariantId, setPickedVariantId] = useState<string | null>(null)
  const [pickedVariantLabel, setPickedVariantLabel] = useState<string>("")

  const handleSave = () => {
    setError(null)
    const payload = externalCodeFieldsToPayload(value)
    startTransition(async () => {
      if (isEdit && ec) {
        const res = await updateExternalCodeAction(ec.id, payload)
        if ("error" in res && res.error) setError(res.error)
        else router.push(LIST_HREF)
      } else {
        const res = await createExternalCodeAction({
          ...payload,
          variantId: pickedVariantId,
        })
        if ("error" in res && res.error) setError(res.error)
        else router.push(LIST_HREF)
      }
    })
  }

  const handleDelete = () => {
    if (!ec) return
    startTransition(async () => {
      await deleteExternalCodeAction(ec.id)
      router.push(LIST_HREF)
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <BackLink href={LIST_HREF}>Volver a códigos externos</BackLink>

      <ErrorBanner>{error}</ErrorBanner>

      <ExternalCodeFields value={value} onChange={setValue} />

      {/* Variant link area */}
      {isEdit && ec ? (
        ec.variantId ? (
          <LinkedVariantBox ec={ec} onChanged={() => router.refresh()} pending={isPending} />
        ) : (
          <VariantSearchPicker
            onPick={(id) => {
              startTransition(async () => {
                const res = await linkVariantAction(ec.id, id)
                if ("error" in res && res.error) setError(res.error)
                else router.refresh()
              })
            }}
          />
        )
      ) : (
        <VariantSearchPicker
          selected={
            pickedVariantId ? { id: pickedVariantId, label: pickedVariantLabel } : null
          }
          onClear={() => {
            setPickedVariantId(null)
            setPickedVariantLabel("")
          }}
          onPick={(id, label) => {
            setPickedVariantId(id)
            setPickedVariantLabel(label)
          }}
        />
      )}

      <FormActions
        onSave={handleSave}
        cancelHref={LIST_HREF}
        saveLabel={isEdit ? "Guardar cambios" : "Crear código externo"}
        pending={isPending}
        disabled={!value.system || !value.code}
        onDelete={isEdit ? () => setDeleteOpen(true) : undefined}
      />

      {isEdit && (
        <ConfirmDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="¿Eliminar código externo?"
          description={
            <>
              Se eliminará el código &quot;{ec!.code}&quot; del sistema {ec!.system}. Esta
              acción no se puede deshacer.
            </>
          }
          onConfirm={handleDelete}
          pending={isPending}
        />
      )}
    </div>
  )
}

/* ─── Linked variant summary ─── */

function LinkedVariantBox({
  ec,
  onChanged,
  pending,
}: {
  ec: AdminExternalCode
  onChanged: () => void
  pending: boolean
}) {
  const [busy, startTransition] = useTransition()
  const handleUnlink = () => {
    startTransition(async () => {
      await unlinkVariantAction(ec.id)
      onChanged()
    })
  }
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
      <div className="flex-1">
        <span className="text-muted-foreground">Variante: </span>
        <Link
          href={`/dashboard/products/${ec.productId}/variants/${ec.variantId}`}
          className="font-mono text-primary hover:underline"
        >
          {ec.variantSku}
        </Link>
        <span className="text-muted-foreground"> · Producto: </span>
        <Link
          href={`/dashboard/products/${ec.productId}`}
          className="hover:underline"
        >
          {ec.productName?.es ?? ec.productSlug}
        </Link>
      </div>
      <Button variant="ghost" size="sm" onClick={handleUnlink} disabled={busy || pending}>
        <Unlink className="mr-1 size-3.5" /> Desvincular
      </Button>
    </div>
  )
}

/* ─── Variant search picker ─── */

function VariantSearchPicker({
  onPick,
  selected,
  onClear,
}: {
  onPick: (id: string, label: string) => void
  selected?: { id: string; label: string } | null
  onClear?: () => void
}) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<{ id: string; sku: string; productName: string }[]>([])
  const [searching, setSearching] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (term: string) => {
    if (term.length < 1) {
      setResults([])
      return
    }
    setSearching(true)
    const res = await searchVariantsBySkuAction(term)
    setResults(res)
    setSearching(false)
  }, [])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => doSearch(search), 300)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [search, doSearch])

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <span className="text-muted-foreground">Vincular a:</span>
        <span className="font-mono">{selected.label}</span>
        <button
          type="button"
          onClick={onClear}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          Quitar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar variante por SKU para vincular..."
            className={inputCls}
          />
          {searching ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          ) : (
            <LinkIcon className="size-3.5 text-muted-foreground" />
          )}
        </div>
        {results.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-md">
            {results.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(v.id, `${v.sku} — ${v.productName}`)
                    setSearch("")
                    setResults([])
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  <span className="font-mono">{v.sku}</span>
                  <span className="text-muted-foreground">— {v.productName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">Opcional: deja vacío para crear sin vincular.</p>
    </div>
  )
}
