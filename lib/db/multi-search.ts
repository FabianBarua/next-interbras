import { sql, type SQL, type AnyColumn } from "drizzle-orm"

/** Escape SQL LIKE special characters (%, _, \) */
export function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&")
}

/**
 * Build a SQL condition where **every keyword** must match **at least one** of
 * the provided columns (ILIKE, case-insensitive).
 *
 * Example:
 *   multiSearch("n9 triciclo 8", [variants.sku, productNameEs])
 *
 * Produces:
 *   (sku ILIKE '%n9%' OR name ILIKE '%n9%')
 *   AND (sku ILIKE '%triciclo%' OR name ILIKE '%triciclo%')
 *   AND (sku ILIKE '%8%' OR name ILIKE '%8%')
 *
 * @param input  Raw user input (will be split on whitespace)
 * @param columns  Drizzle columns or raw SQL expressions to search in
 * @param opts.minLength  Skip keywords shorter than this (default 1)
 * @param opts.maxKeywords  Cap keywords to prevent abuse (default 8)
 * @returns A SQL condition or `undefined` when no valid keywords
 */
export function multiSearch(
  input: string,
  columns: (AnyColumn | SQL)[],
  opts?: { minLength?: number; maxKeywords?: number },
): SQL | undefined {
  const min = opts?.minLength ?? 1
  const max = opts?.maxKeywords ?? 8

  const keywords = input
    .trim()
    .split(/\s+/)
    .filter((k) => k.length >= min)
    .slice(0, max)

  if (keywords.length === 0 || columns.length === 0) return undefined

  const conditions = keywords.map((kw) => {
    // escape SQL LIKE special chars
    const escaped = escapeLike(kw)
    const pattern = `%${escaped}%`

    const colMatches = columns.map((col) =>
      sql`${col} ILIKE ${pattern}`,
    )
    // OR across all columns for this keyword
    return colMatches.length === 1
      ? colMatches[0]
      : sql`(${sql.join(colMatches, sql` OR `)})`
  })

  // AND across all keywords
  return conditions.length === 1
    ? conditions[0]
    : sql.join(conditions, sql` AND `)
}
