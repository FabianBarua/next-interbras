import { NextResponse, type NextRequest } from "next/server"
import { getProducts } from "@/services/products"
import { getVariantMainImage } from "@/lib/variant-images"

const MAX_RESULTS = 10
const MAX_QUERY_LENGTH = 100

/** Normalize text for accent-insensitive matching */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

export async function GET(req: NextRequest) {
  const rawQ = req.nextUrl.searchParams.get("q") ?? ""
  // Sanitize: trim, strip control chars, enforce max length
  // eslint-disable-next-line no-control-regex
  const q = rawQ.trim().replace(/[\x00-\x1f]/g, "").slice(0, MAX_QUERY_LENGTH)

  if (!q) {
    return NextResponse.json({ results: [] })
  }

  const normalizedQ = normalize(q)
  const products = await getProducts()

  const results: {
    id: string
    name: string
    slug: string
    categorySlug: string
    image: string | null
    price: number | null
    sku: string
  }[] = []

  for (const product of products) {
    if (results.length >= MAX_RESULTS) break

    const nameEs = normalize(product.name?.es ?? "")
    const namePt = normalize(product.name?.pt ?? "")
    const catNameEs = normalize(product.category?.name?.es ?? "")

    for (const variant of product.variants) {
      if (results.length >= MAX_RESULTS) break

      const sku = normalize(variant.sku)
      const matches =
        nameEs.includes(normalizedQ) ||
        namePt.includes(normalizedQ) ||
        catNameEs.includes(normalizedQ) ||
        sku.includes(normalizedQ)

      if (matches) {
        // Build the same slug format used by the product detail pages
        const slugParts = [product.slug]
        if (variant.sku) slugParts.push(variant.sku)
        if (variant.externalCode?.code) slugParts.push(variant.externalCode.code)
        const slug = slugParts
          .join("-")
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")

        const mainImage = getVariantMainImage(variant)

        results.push({
          id: variant.id,
          name: product.name?.es ?? product.slug,
          slug,
          categorySlug: product.category?.slug ?? "other",
          image: mainImage?.url ?? null,
          price: variant.externalCode?.priceUsd ?? null,
          sku: variant.sku,
        })
      }
    }
  }

  return NextResponse.json({ results })
}
