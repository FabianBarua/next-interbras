/** 0 means "All" (no limit) */
export const PER_PAGE_OPTIONS = [10, 25, 50, 100, 0] as const

/** Server-side parser: clamp to valid option, 0 = all (maps to high limit) */
export function parsePerPage(raw: string | number | undefined, fallback = 50): number {
  if (raw === undefined || raw === "") return fallback
  const n = Number(raw)
  if (isNaN(n)) return fallback
  if (n === 0) return 0 // "All"
  if (n > 100) return 0
  const valid = PER_PAGE_OPTIONS.filter((o) => o > 0)
  return valid.includes(n as any) ? n : fallback
}

/** Convert perPage to the actual SQL limit (0 → 10000) */
export function perPageToLimit(perPage: number): number {
  return perPage === 0 ? 10000 : perPage
}
