import { productsMock } from "../mock/products"
import type { Product, Variant } from "../types/product"
import { toVariantSlug } from "@/lib/variant-slug"

const DELAY = 500

export interface VariantEntry {
  product: Product
  variant: Variant
}

export async function getProducts(): Promise<Product[]> {
  return new Promise((resolve) => setTimeout(() => resolve(productsMock.filter(p => p.active)), DELAY))
}

/** Flatten all products into variant-level entries for listings */
export async function getVariantEntries(): Promise<VariantEntry[]> {
  const products = productsMock.filter(p => p.active)
  const entries: VariantEntry[] = []
  for (const product of products) {
    if (product.variants.length === 0) {
      entries.push({ product, variant: undefined as any })
    } else {
      for (const variant of product.variants) {
        entries.push({ product, variant })
      }
    }
  }
  return new Promise((resolve) => setTimeout(() => resolve(entries), DELAY))
}

/** Flatten variants for a specific category */
export async function getVariantEntriesByCategory(categorySlug: string): Promise<VariantEntry[]> {
  const products = productsMock.filter(p => p.category?.slug === categorySlug && p.active)
  const entries: VariantEntry[] = []
  for (const product of products) {
    if (product.variants.length === 0) {
      entries.push({ product, variant: undefined as any })
    } else {
      for (const variant of product.variants) {
        entries.push({ product, variant })
      }
    }
  }
  return new Promise((resolve) => setTimeout(() => resolve(entries), DELAY))
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return new Promise((resolve) => 
    setTimeout(() => {
      const product = productsMock.find(p => p.slug === slug)
      resolve(product || null)
    }, DELAY)
  )
}

/** Resolve a variant-level slug back to a product + variant pair */
export async function getProductByVariantSlug(variantSlug: string): Promise<VariantEntry | null> {
  const products = productsMock.filter(p => p.active)
  for (const product of products) {
    for (const variant of product.variants) {
      if (toVariantSlug(product, variant) === variantSlug) {
        return { product, variant }
      }
    }
    // Fallback: product with no matching variant (single-variant or slug = product slug)
    if (product.slug === variantSlug) {
      return { product, variant: product.variants[0] }
    }
  }
  return null
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  return new Promise((resolve) => 
    setTimeout(() => {
      const products = productsMock.filter(p => p.category?.slug === categorySlug && p.active)
      resolve(products)
    }, DELAY)
  )
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return new Promise((resolve) => 
    setTimeout(() => {
      // Pick first active product from each category
      const seen = new Set<string>()
      const featured = productsMock.filter(p => {
        if (!p.active || seen.has(p.categoryId)) return false
        seen.add(p.categoryId)
        return true
      })
      resolve(featured.slice(0, 8))
    }, DELAY)
  )
}

export async function getNewProducts(): Promise<Product[]> {
  return new Promise((resolve) => 
    setTimeout(() => {
      // Pick last 8 active products (newest by sort_order)
      const active = productsMock.filter(p => p.active)
      resolve(active.slice(-8).reverse())
    }, DELAY)
  )
}
