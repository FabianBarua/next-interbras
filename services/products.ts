import { db } from "@/lib/db"
import { products, categories, variants, productImages, externalCodes } from "@/lib/db/schema"
import { eq, and, desc, asc, ne, sql, inArray } from "drizzle-orm"
import { cachedQuery, invalidateCache } from "@/lib/cache"
import { toVariantSlug } from "@/lib/variant-slug"
import type { Product, Variant, ProductImage as FrontendImage, ExternalCode } from "@/types/product"
import type { Category } from "@/types/category"

export interface VariantEntry {
  product: Product
  variant: Variant
}

// ---------------------------------------------------------------------------
// Internal: load & map a full product with images, variants, externalCodes
// ---------------------------------------------------------------------------

async function loadProductRows(where?: ReturnType<typeof eq>) {
  const rows = await db
    .select({
      p: products,
      c: categories,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where ? and(eq(products.active, true), where) : eq(products.active, true))
    .orderBy(asc(products.sortOrder))

  if (rows.length === 0) return []

  const productIds = rows.map(r => r.p.id)

  // Batch load images, variants, external codes for all products
  const [imgRows, varRows] = await Promise.all([
    db.select().from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(asc(productImages.sortOrder)),
    db.select({
      v: variants,
      ec: externalCodes,
    }).from(variants)
      .leftJoin(externalCodes, eq(variants.id, externalCodes.variantId))
      .where(inArray(variants.productId, productIds))
      .orderBy(asc(variants.sortOrder)),
  ])

  // ---- Build FrontendImage objects ----
  const allImages: FrontendImage[] = imgRows.map(img => ({
    id: img.id,
    productId: img.productId,
    variantId: img.variantId ?? null,
    url: img.url,
    alt: (img.alt as any)?.es ?? (img.alt as any)?.pt ?? null,
    isMain: img.sortOrder === 0,
    sortOrder: img.sortOrder,
  }))

  // Group images: variant-specific (by variantId) and product-level (variantId=null, by productId)
  const imgByVariant = new Map<string, FrontendImage[]>()
  const imgByProduct = new Map<string, FrontendImage[]>()
  for (const img of allImages) {
    if (img.variantId) {
      const list = imgByVariant.get(img.variantId) ?? []
      list.push(img)
      imgByVariant.set(img.variantId, list)
    } else {
      const list = imgByProduct.get(img.productId) ?? []
      list.push(img)
      imgByProduct.set(img.productId, list)
    }
  }

  // ---- Build variants: skip CEC-less, add stock + images ----
  // First pass: collect all CEC-linked variants per product (need full list for sibling fallback)
  const varMap = new Map<string, Variant[]>()
  for (const { v, ec } of varRows) {
    if (!v.active) continue
    if (!ec) continue // CEC required for visibility

    const attrs = (v.options ?? {}) as Record<string, any>

    // Resolve images: direct → sibling with most matching attrs → product-level
    let images = imgByVariant.get(v.id) ?? []
    if (images.length === 0) {
      // Sibling fallback: find variant images sharing the most attributes (e.g. same color)
      const attrEntries = Object.entries(attrs)
      if (attrEntries.length > 0) {
        let bestImages: FrontendImage[] = []
        let bestScore = 0
        for (const [sibId, sibImgs] of imgByVariant) {
          if (sibId === v.id) continue
          // Find sibling variant data from varRows
          const sibRow = varRows.find(r => r.v.id === sibId)
          if (!sibRow || sibRow.v.productId !== v.productId) continue
          const sibAttrs = (sibRow.v.options ?? {}) as Record<string, any>
          let score = 0
          for (const [key, val] of attrEntries) {
            if (sibAttrs[key] === val) score++
          }
          if (score > bestScore) {
            bestScore = score
            bestImages = sibImgs
          }
        }
        if (bestImages.length > 0) images = bestImages
      }
    }
    if (images.length === 0) {
      // Fallback to product-level images
      images = imgByProduct.get(v.productId) ?? []
    }

    const mapped: Variant = {
      id: v.id,
      productId: v.productId,
      sku: v.sku,
      name: null,
      attributes: attrs,
      stock: v.stock ?? null,
      images,
      externalCode: {
        id: ec.id,
        system: ec.system,
        code: ec.code,
        externalName: ec.externalName ?? null,
        priceUsd: ec.priceUsd ? Number(ec.priceUsd) : null,
        priceGs: ec.priceGs ? Number(ec.priceGs) : null,
        priceBrl: ec.priceBrl ? Number(ec.priceBrl) : null,
        metadata: ec.metadata ?? null,
      } satisfies ExternalCode,
    }

    const list = varMap.get(v.productId) ?? []
    list.push(mapped)
    varMap.set(v.productId, list)
  }

  return rows.map(({ p, c }) => {
    const cat: Category | undefined = c ? {
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description ?? null,
      shortDescription: c.shortDescription ?? null,
      image: c.image ?? null,
      svgIcon: c.svgIcon ?? null,
      svgIconMeta: c.svgIconMeta as Category["svgIconMeta"],
      sortOrder: c.sortOrder,
      active: c.active,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    } : undefined

    return {
      id: p.id,
      categoryId: p.categoryId,
      slug: p.slug,
      name: p.name,
      description: p.description ?? null,
      specs: p.specs ?? null,
      review: p.review ?? null,
      included: p.included ?? null,
      sortOrder: p.sortOrder,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      category: cat,
      variants: varMap.get(p.id) ?? [],
    } satisfies Product
  }).filter(p => p.variants.length > 0)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getProducts(): Promise<Product[]> {
  return cachedQuery("products:all", () => loadProductRows(), 300)
}

export async function getVariantEntries(): Promise<VariantEntry[]> {
  return cachedQuery("variants:all", async () => {
    const prods = await loadProductRows()
    const entries: VariantEntry[] = []
    for (const product of prods) {
      for (const variant of product.variants) {
        entries.push({ product, variant })
      }
    }
    return entries
  }, 300)
}

export async function getVariantEntriesByCategory(categorySlug: string): Promise<VariantEntry[]> {
  return cachedQuery(`variants:cat:${categorySlug}`, async () => {
    const catRow = await db.select({ id: categories.id }).from(categories)
      .where(eq(categories.slug, categorySlug)).limit(1)
    if (catRow.length === 0) return []
    const prods = await loadProductRows(eq(products.categoryId, catRow[0].id))
    const entries: VariantEntry[] = []
    for (const product of prods) {
      for (const variant of product.variants) {
        entries.push({ product, variant })
      }
    }
    return entries
  }, 300)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return cachedQuery(`product:${slug}`, async () => {
    const prods = await loadProductRows(eq(products.slug, slug))
    return prods[0] ?? null
  }, 600)
}

export async function getProductByVariantSlug(variantSlug: string): Promise<VariantEntry | null> {
  // Try to find by iterating all active products — cached
  const allProducts = await getProducts()
  for (const product of allProducts) {
    for (const variant of product.variants) {
      if (toVariantSlug(product, variant) === variantSlug) {
        return { product, variant }
      }
    }
  }
  return null
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  return cachedQuery(`products:cat:${categorySlug}`, async () => {
    const catRow = await db.select({ id: categories.id }).from(categories)
      .where(eq(categories.slug, categorySlug)).limit(1)
    if (catRow.length === 0) return []
    return loadProductRows(eq(products.categoryId, catRow[0].id))
  }, 300)
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return cachedQuery("products:featured", async () => {
    const prods = await loadProductRows()
    const seen = new Set<string>()
    return prods.filter(p => {
      if (seen.has(p.categoryId)) return false
      seen.add(p.categoryId)
      return true
    }).slice(0, 8)
  }, 300)
}

export async function getNewProducts(): Promise<Product[]> {
  return cachedQuery("products:new", async () => {
    const prods = await loadProductRows()
    return prods.slice(-8).reverse()
  }, 300)
}
