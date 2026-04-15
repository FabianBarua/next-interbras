import type { I18nText, I18nRichText, I18nSpecs } from "./common"
import type { Category } from "./category"

export interface ExternalCode {
  id: string
  system: string
  code: string
  externalName: string | null
  priceUsd: number | null
  priceGs: number | null
  priceBrl: number | null
  metadata: any | null
}

export interface ProductImage {
  id: string
  productId: string
  variantId: string
  url: string
  alt: string | null
  isMain: boolean
  sortOrder: number
}

export interface Variant {
  id: string
  productId: string
  sku: string
  name: I18nText | null
  attributes: Record<string, any>
  stock: number | null
  images: ProductImage[]
  externalCode?: ExternalCode
}

export interface Product {
  id: string
  categoryId: string
  slug: string
  name: I18nText
  description: I18nRichText | null
  specs: I18nSpecs | null
  review: I18nRichText | null
  included: I18nRichText | null
  sortOrder: number
  active: boolean
  createdAt: string
  updatedAt: string

  category?: Category
  variants: Variant[]
}
