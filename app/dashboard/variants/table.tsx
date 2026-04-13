"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { AdminVariantGlobal } from "@/services/admin/variants-global"
import type { Category } from "@/types/category"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { updateVariantAction } from "@/lib/actions/admin/variants"
import { Search, Eye } from "lucide-react"

const fmtAmount = (v: string | number | null) =>
  v ? Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"

interface Props {
  variants: AdminVariantGlobal[]
  total: number
  page: number
  totalPages: number
  categories: Category[]
}

export function VariantsTable({ variants, total, page, totalPages, categories }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Search
  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchValue) params.set("search", searchValue)
      else params.delete("search")
      params.delete("page")
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [searchValue]) // eslint-disable-line react-hooks/exhaustive-deps

  // Category filter
  const categoryId = searchParams.get("categoryId") ?? ""
  const setCategoryFilter = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set("categoryId", val)
    else params.delete("categoryId")
    params.delete("page")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  // Pagination
  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (p > 1) params.set("page", String(p)); else params.delete("page")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Buscar por SKU, producto..."
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name.es || c.slug}</option>
          ))}
        </select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-14 px-2 py-3" />
                <th className="text-left px-4 py-3 font-medium">SKU</th>
                <th className="text-left px-4 py-3 font-medium">Producto</th>
                <th className="text-left px-4 py-3 font-medium">Categoría</th>
                <th className="text-left px-4 py-3 font-medium">Opciones</th>
                <th className="text-center px-4 py-3 font-medium">Stock</th>
                <th className="text-right px-4 py-3 font-medium">USD</th>
                <th className="text-center px-4 py-3 font-medium">Estado</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {variants.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No se encontraron variantes.</td></tr>
              )}
              {variants.map((v) => (
                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-2 py-2">
                    {v.imageUrl ? (
                      <Image src={v.imageUrl} alt="" width={36} height={36} className="rounded object-cover" />
                    ) : (
                      <div className="size-9 rounded bg-muted" />
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{v.sku}</td>
                  <td className="px-4 py-2">
                    <p className="font-medium">{v.productName.es || v.productSlug}</p>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">
                    {v.categoryName?.es ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(v.options).map(([k, val]) => (
                        <Badge key={k} variant="secondary" className="text-[10px]">{k}: {val}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center tabular-nums">{v.stock ?? "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-xs">
                    {v.priceUsd ? `$${fmtAmount(v.priceUsd)}` : "—"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => startTransition(async () => { await updateVariantAction(v.id, v.productId, { active: !v.active }); router.refresh() })}
                      title={v.active ? "Desactivar" : "Activar"}
                    >
                      <Badge variant={v.active ? "default" : "secondary"} className="cursor-pointer hover:opacity-80 transition-opacity">{v.active ? "Activo" : "Inactivo"}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/dashboard/products/${v.productId}/variants/${v.id}`}
                      title="Ver variante"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Eye className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} variante{total !== 1 ? "s" : ""} — página {page} de {totalPages}</span>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(page - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>Siguiente</Button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
