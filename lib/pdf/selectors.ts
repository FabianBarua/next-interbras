/**
 * Pure functions that compose server data + persisted overrides into a flat
 * view-model the UI can render.
 */

import type { Locale } from "@/i18n/config"
import type {
  CatalogCategory,
  CatalogEntry,
  CatalogSettings,
  ManualProduct,
  RenderedItem,
  RenderedSection,
} from "./types"
import { getEntryPrice, pickI18n } from "./helpers"
import { getSectionColor } from "./constants"

interface BuildArgs {
  entries: CatalogEntry[]
  categories: CatalogCategory[]
  settings: CatalogSettings
  locale: Locale
  /** Filters from the UI. */
  filters: {
    search: string
    categoryId: string | null
    voltage: "all" | "110V" | "220V" | "Bivolt"
  }
  /** Whether hidden entries should be excluded from render. */
  excludeHidden: boolean
}

export function buildRenderedSections({
  entries,
  categories,
  settings,
  locale,
  filters,
  excludeHidden,
}: BuildArgs): RenderedSection[] {
  const currency = settings.currency

  // --- Filter entries once, globally ---
  const search = filters.search.trim().toLowerCase()
  const passesFilters = (entry: CatalogEntry): boolean => {
    if (filters.categoryId && entry.categoryId !== filters.categoryId) return false
    if (filters.voltage !== "all") {
      const norm = entry.voltage?.trim().toUpperCase()
      if (filters.voltage === "Bivolt") {
        if (!norm || !norm.includes("BIV")) return false
      } else if (norm !== filters.voltage.toUpperCase()) {
        return false
      }
    }
    if (search) {
      const name = pickI18n(entry.name, locale).toLowerCase()
      const code = entry.code.toLowerCase()
      const ext = (entry.externalName ?? "").toLowerCase()
      if (!name.includes(search) && !code.includes(search) && !ext.includes(search)) {
        return false
      }
    }
    return true
  }

  const overrides = settings.entryOverrides

  const toItem = (entry: CatalogEntry): RenderedItem | null => {
    const ov = overrides[entry.id]
    if (excludeHidden && ov?.hidden) return null

    const price = ov?.price !== undefined ? ov.price : getEntryPrice(entry, currency)
    const specs: RenderedItem["specs"] =
      ov?.specs !== undefined
        ? ov.specs
        : (entry.specs?.[locale] ?? entry.specs?.["es"] ?? entry.specs?.["pt"] ?? [])

    return {
      kind: "entry",
      id: entry.id,
      name: ov?.name ?? pickI18n(entry.name, locale),
      code: ov?.code ?? entry.code,
      imageUrl: ov?.imageDataUrl ?? entry.imageUrl,
      price,
      voltage: ov?.voltage ?? entry.voltage,
      qtyPerBox: ov?.qtyPerBox ?? entry.qtyPerBox,
      specs,
      attributes: entry.attributes,
      entryId: entry.id,
      manualId: null,
      promo: entry.promo,
    }
  }

  const manualToItem = (m: ManualProduct): RenderedItem => ({
    kind: "manual",
    id: m.id,
    name: m.name,
    code: m.code,
    imageUrl: m.imageDataUrl,
    price: m.price,
    voltage: m.voltage,
    qtyPerBox: m.qtyPerBox,
    specs: m.specs,
    attributes: {},
    entryId: null,
    manualId: m.id,
    promo: false,
  })

  // --- Group entries by category ---
  const entryById = new Map(entries.map((e) => [e.id, e]))
  const entriesByCategory = new Map<string, CatalogEntry[]>()
  for (const e of entries) {
    if (!passesFilters(e)) continue
    const key = e.categoryId ?? "__uncategorized"
    const list = entriesByCategory.get(key) ?? []
    list.push(e)
    entriesByCategory.set(key, list)
  }

  const hidden = new Set(settings.hiddenCategoryIds)
  const orderedCategoryIds =
    settings.categoryOrder.length > 0
      ? settings.categoryOrder
      : categories.map((c) => c.id)

  const categorySections: RenderedSection[] = []
  for (const catId of orderedCategoryIds) {
    if (hidden.has(catId)) continue
    const cat = categories.find((c) => c.id === catId)
    if (!cat) continue
    const catEntries = entriesByCategory.get(catId) ?? []
    if (catEntries.length === 0) continue
    const items = catEntries
      .map(toItem)
      .filter((x): x is RenderedItem => x !== null)
    if (items.length === 0) continue
    categorySections.push({
      id: cat.id,
      kind: "category",
      name: pickI18n(cat.name, locale),
      description:
        (cat.shortDescription && pickI18n(cat.shortDescription, locale)) ||
        (cat.description && pickI18n(cat.description, locale)) ||
        null,
      color: "brand",
      icon: null,
      svgIcon: cat.svgIcon ?? null,
      svgIconMeta: cat.svgIconMeta ?? null,
      items,
    })
  }

  // --- Custom sections ---
  const customSections: RenderedSection[] = [...settings.customSections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((sec) => {
      const entryItems = sec.entryIds
        .map((eid) => entryById.get(eid))
        .filter((e): e is CatalogEntry => !!e && passesFilters(e))
        .map(toItem)
        .filter((x): x is RenderedItem => x !== null)
      const manualItems = settings.manualProducts
        .filter((m) => m.sectionId === sec.id)
        .map(manualToItem)
      return {
        id: sec.id,
        kind: "custom" as const,
        name: sec.name,
        description: null,
        color: getSectionColor(sec.color).key,
        icon: sec.icon,
        svgIcon: null,
        svgIconMeta: null,
        items: [...entryItems, ...manualItems],
      }
    })
    .filter((sec) => sec.items.length > 0)

  return [...customSections, ...categorySections]
}
