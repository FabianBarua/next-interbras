"use client"

import { useCallback, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

export const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const

export function useTableParams(
  defaults: {
    sortBy?: string
    sortDir?: "asc" | "desc"
    perPage?: number
  } = {},
) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const page = Math.max(1, Number(sp.get("page")) || 1)
  const perPage = Number(sp.get("perPage")) || defaults.perPage || 50
  const sortBy = sp.get("sortBy") || defaults.sortBy || ""
  const sortDir = (sp.get("sortDir") as "asc" | "desc") || defaults.sortDir || "asc"

  const push = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v === null) params.delete(k)
        else params.set(k, v)
      }
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [router, pathname, sp, startTransition],
  )

  const setSort = useCallback(
    (col: string) => {
      const newDir = sortBy === col && sortDir === "asc" ? "desc" : "asc"
      push({ sortBy: col, sortDir: newDir, page: null })
    },
    [sortBy, sortDir, push],
  )

  const setPage = useCallback((p: number) => push({ page: p > 1 ? String(p) : null }), [push])

  const setPerPage = useCallback(
    (n: number) =>
      push({ perPage: n !== (defaults.perPage ?? 50) ? String(n) : null, page: null }),
    [defaults.perPage, push],
  )

  return { page, perPage, sortBy, sortDir, setSort, setPage, setPerPage, isPending }
}
