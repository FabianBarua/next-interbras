/**
 * Types for the PDF catalog builder.
 * Server data is immutable. All user customization lives in overrides
 * that are persisted client-side and merged at render time.
 */

import type { Locale } from "@/i18n/config"

// ─── Server-provided (read-only) ────────────────────────────────────

/** Flat entry coming from `cods_externo` joined with its variant/product. */
export interface CatalogEntry {
  /** external_codes.id (stable id used everywhere) */
  id: string
  /** external_codes.code */
  code: string
  /** external_codes.externalName (may be null) */
  externalName: string | null
  /** Variant id */
  variantId: string
  /** Product id */
  productId: string
  /** Category id (nullable) */
  categoryId: string | null
  /** Product name (i18n) */
  name: Record<string, string>
  /** Image URL (variant main image, or null) */
  imageUrl: string | null
  /** Variant SKU */
  sku: string
  /** Attributes key/value (from variant.options) */
  attributes: Record<string, string>
  /** Specs from product.specs (i18n) */
  specs: Record<string, Array<{ label: string; value: string }>> | null
  /** Voltage: "110V" | "220V" | "Bivolt" | other (derived from attributes.voltage) */
  voltage: string | null
  /** Quantity per box (derived from attributes: `boxQty` / `qtyPerBox` / `cantidadPorCaja`) */
  qtyPerBox: number | null
  /** Prices */
  priceUsd: number | null
  priceGs: number | null
  priceBrl: number | null
  /** Is this variant part of a promo? (currently derived from attributes.promo boolean) */
  promo: boolean
  /** Stock */
  stock: number | null
  /** Sort order within category */
  sortOrder: number
}

export interface CatalogCategory {
  id: string
  slug: string
  name: Record<string, string>
  sortOrder: number
}

// ─── Client-side persisted state ────────────────────────────────────

/** Overrides applied on top of a server entry. */
export interface EntryOverride {
  /** Hide this entry */
  hidden?: boolean
  /** Title override (i18n text, current locale) */
  name?: string
  /** Code override */
  code?: string
  /** Price override (numeric, in the display currency) */
  price?: number
  /** Free-text specs override (one per line) */
  specs?: string
  /** Voltage override */
  voltage?: string
  /** Qty per box override */
  qtyPerBox?: number
  /** Custom image data URL */
  imageDataUrl?: string
}

/** A fully user-created product (not from the DB). */
export interface ManualProduct {
  id: string
  name: string
  code: string
  price: number | null
  voltage: string | null
  qtyPerBox: number | null
  specs: string
  imageDataUrl: string | null
  /** Which section it belongs to (custom section id) */
  sectionId: string
}

/** A user-defined section (groups manual products + picked catalog entries). */
export interface CustomSection {
  id: string
  /** Display name */
  name: string
  /** Tailwind-compatible color class key (brand/blue/red/amber/slate) */
  color: string
  /** Phosphor or lucide icon name */
  icon: string
  /** Catalog entry ids included in this section */
  entryIds: string[]
  /** Order among custom sections */
  sortOrder: number
}

export type CatalogLanguage = Locale
export type CurrencyCode = "USD" | "GS" | "BRL"
export type Viewport = "desktop" | "mobile"

/** Persisted catalog settings (a single "project"). */
export interface CatalogSettings {
  showPrices: boolean
  currency: CurrencyCode
  language: CatalogLanguage
  coverImageDataUrl: string | null
  coverTitle: string
  coverSubtitle: string
  /** Ordered list of category ids — controls section rendering order. */
  categoryOrder: string[]
  /** Ids of categories the user has removed from the catalog entirely. */
  hiddenCategoryIds: string[]
  /** Overrides keyed by CatalogEntry.id */
  entryOverrides: Record<string, EntryOverride>
  /** Custom sections */
  customSections: CustomSection[]
  /** Manual products */
  manualProducts: ManualProduct[]
}

// ─── Rendering view-model ───────────────────────────────────────────

export interface RenderedItem {
  kind: "entry" | "manual"
  /** Stable id to use as key */
  id: string
  name: string
  code: string
  imageUrl: string | null
  price: number | null
  voltage: string | null
  qtyPerBox: number | null
  specs: Array<{ label: string; value: string }> | string
  attributes: Record<string, string>
  /** The raw entry id (for toggling hide). Null for manual products. */
  entryId: string | null
  /** Manual product id (only for manual). */
  manualId: string | null
  promo: boolean
}

export interface RenderedSection {
  id: string
  kind: "category" | "custom"
  name: string
  color: string
  icon: string | null
  items: RenderedItem[]
}
