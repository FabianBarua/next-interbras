"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  createExternalCodeAction,
  searchVariantsBySkuAction,
} from "@/lib/actions/admin/external-codes"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Search } from "lucide-react"

const inputCls =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"

export function ExternalCodeCreateForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [variantId, setVariantId] = useState("")
  const [variantLabel, setVariantLabel] = useState("")
  const [system, setSystem] = useState("")
  const [code, setCode] = useState("")
  const [externalName, setExternalName] = useState("")
  const [priceUsd, setPriceUsd] = useState("")
  const [priceGs, setPriceGs] = useState("")
  const [priceBrl, setPriceBrl] = useState("")
  const [stock, setStock] = useState("")

  // Variant search
  const [skuSearch, setSkuSearch] = useState("")
  const [skuResults, setSkuResults] = useState<
    { id: string; sku: string; productName: string }[]
  >([])
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (skuSearch.length < 1) {
      setSkuResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      const res = await searchVariantsBySkuAction(skuSearch)
      setSkuResults(res)
      setShowResults(true)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [skuSearch])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const selectVariant = (v: { id: string; sku: string; productName: string }) => {
    setVariantId(v.id)
    setVariantLabel(`${v.sku} — ${v.productName}`)
    setSkuSearch("")
    setShowResults(false)
  }

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const res = await createExternalCodeAction({
        variantId: variantId || null,
        system,
        code,
        externalName: externalName || null,
        priceUsd: priceUsd || null,
        priceGs: priceGs || null,
        priceBrl: priceBrl || null,
        stock: stock !== "" ? parseInt(stock, 10) : null,
      })
      if ("error" in res) {
        setError(res.error!)
      } else {
        router.push(`/dashboard/external-codes/${res.id}`)
      }
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard/external-codes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Volver a códigos externos
      </Link>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Variant picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Variante (SKU)
          </label>
          {variantId ? (
            <div className="flex items-center gap-2">
              <span className="flex-1 rounded-lg border bg-muted/30 px-3 py-2 text-sm font-mono">
                {variantLabel}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setVariantId("")
                  setVariantLabel("")
                }}
              >
                Cambiar
              </Button>
            </div>
          ) : (
            <div ref={wrapperRef} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
                onFocus={() => skuResults.length > 0 && setShowResults(true)}
                placeholder="Buscar por SKU..."
                className={inputCls + " pl-9"}
              />
              {showResults && skuResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-60 overflow-y-auto">
                  {skuResults.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => selectVariant(v)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"
                    >
                      <span className="font-mono text-xs">{v.sku}</span>
                      <span className="text-muted-foreground text-xs truncate">
                        {v.productName}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {showResults && skuSearch.length >= 1 && skuResults.length === 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg px-3 py-3 text-sm text-muted-foreground">
                  Sin resultados
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Sistema
            </label>
            <input
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              placeholder="ej: SAP"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Código
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ej: 12345"
              className={inputCls + " font-mono"}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Nombre externo
          </label>
          <input
            value={externalName}
            onChange={(e) => setExternalName(e.target.value)}
            placeholder="Nombre del producto en el sistema externo"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Precio USD
            </label>
            <input
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
              placeholder="0.00"
              className={inputCls + " font-mono"}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Precio Gs
            </label>
            <input
              value={priceGs}
              onChange={(e) => setPriceGs(e.target.value)}
              placeholder="0"
              className={inputCls + " font-mono"}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Precio BRL
            </label>
            <input
              value={priceBrl}
              onChange={(e) => setPriceBrl(e.target.value)}
              placeholder="0.00"
              className={inputCls + " font-mono"}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Stock
          </label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="—"
            className={inputCls + " w-32 font-mono"}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={isPending || !system || !code}
        >
          {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
          Crear código externo
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/external-codes">Cancelar</Link>
        </Button>
      </div>
    </div>
  )
}
