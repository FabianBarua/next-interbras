import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { products, variants, categories, externalCodes, productImages } from "@/lib/db/schema"
import { eq, and, or, sql, asc, inArray } from "drizzle-orm"
import { rateLimit } from "@/lib/rate-limit"

const MAX_RESULTS = 10
const MAX_QUERY_LENGTH = 100

/** Escape LIKE/ILIKE special characters */
function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&")
}

export async function GET(req: NextRequest) {
  // Rate limit: 30 requests per minute per IP
  const forwarded = req.headers.get("x-forwarded-for")
  const ip = req.headers.get("x-real-ip")
    || (forwarded ? forwarded.split(",").pop()?.trim() : null)
    || "unknown"
  const rl = await rateLimit(`search:${ip}`, 30, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } },
    )
  }

  const rawQ = req.nextUrl.searchParams.get("q") ?? ""
  // Sanitize: trim, strip control chars, enforce max length
  // eslint-disable-next-line no-control-regex
  const q = rawQ.trim().replace(/[\x00-\x1f]/g, "").slice(0, MAX_QUERY_LENGTH)

  if (!q) {
    return NextResponse.json({ results: [] })
  }

  const pattern = `%${escapeLike(q)}%`

  // DB-level search: join products+variants+external_codes+categories, filter with ILIKE
  const rows = await db
    .select({
      variantId: variants.id,
      productName: products.name,
      productSlug: products.slug,
      categorySlug: categories.slug,
      ecCode: externalCodes.code,
      priceUsd: externalCodes.priceUsd,
    })
    .from(variants)
    .innerJoin(products, and(eq(variants.productId, products.id), eq(products.active, true)))
    .innerJoin(externalCodes, eq(externalCodes.variantId, variants.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      or(
        sql`${products.name}->>'es' ILIKE ${pattern}`,
        sql`${products.name}->>'pt' ILIKE ${pattern}`,
        sql`${categories.name}->>'es' ILIKE ${pattern}`,
        sql`${externalCodes.code} ILIKE ${pattern}`,
      )
    )
    .limit(MAX_RESULTS)

  if (rows.length === 0) {
    return NextResponse.json({ results: [] })
  }

  // Get first image per matched variant
  const variantIds = rows.map(r => r.variantId)
  const imgRows = await db.select()
    .from(productImages)
    .where(inArray(productImages.variantId, variantIds))
    .orderBy(asc(productImages.sortOrder))

  const imgMap = new Map<string, string>()
  for (const img of imgRows) {
    if (img.variantId && !imgMap.has(img.variantId)) {
      imgMap.set(img.variantId, img.url)
    }
  }

  const results = rows.map(row => {
    const name = (row.productName as Record<string, string>)?.es ?? row.productSlug
    const slugParts = [row.productSlug]
    if (row.ecCode) slugParts.push(row.ecCode)
    const slug = slugParts
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    return {
      id: row.variantId,
      name,
      slug,
      categorySlug: row.categorySlug ?? "other",
      image: imgMap.get(row.variantId) ?? null,
      price: row.priceUsd ? Number(row.priceUsd) : null,
      sku: row.ecCode,
    }
  })

  return NextResponse.json({ results })
}
