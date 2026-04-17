import type { Locale } from "@/i18n/config"
import type { CatalogEntry, CurrencyCode } from "./types"

/** Read an i18n text field with fallback to the other locale then the first available. */
export function pickI18n(
  value: Record<string, string> | null | undefined,
  locale: Locale,
): string {
  if (!value) return ""
  if (value[locale]) return value[locale]
  const keys = Object.keys(value)
  for (const k of keys) if (value[k]) return value[k]
  return ""
}

/** Format a price for display. Returns empty string if value is null. */
export function formatPrice(
  value: number | null | undefined,
  currency: CurrencyCode,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return ""
  switch (currency) {
    case "GS":
      return "₲ " + new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 }).format(value)
    case "BRL":
      return "R$ " + new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
    case "USD":
      return "US$ " + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  }
}

/** Returns the price of an entry for the selected currency. */
export function getEntryPrice(entry: CatalogEntry, currency: CurrencyCode): number | null {
  switch (currency) {
    case "GS":  return entry.priceGs
    case "BRL": return entry.priceBrl
    case "USD": return entry.priceUsd
  }
}

/** Random id generator (avoids adding extra deps). */
export function shortId(): string {
  const seg = () => Math.random().toString(36).slice(2, 8)
  return seg() + seg()
}

/** Read a File as a data URL (base64). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * Downscale an image file through a canvas before storing it as a data URL.
 * Keeps localStorage payload small.
 */
export async function fileToScaledDataUrl(file: File, maxSide = 1200, quality = 0.82): Promise<string> {
  const src = await fileToDataUrl(file)
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error("image load failed"))
    el.src = src
  })
  const ratio = Math.min(1, maxSide / Math.max(img.width, img.height))
  if (ratio >= 1) return src
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(img.width * ratio)
  canvas.height = Math.round(img.height * ratio)
  const ctx = canvas.getContext("2d")
  if (!ctx) return src
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", quality)
}

/** Normalize voltage string for filtering. */
export function normalizeVoltageFilter(value: string | null | undefined): "110V" | "220V" | "Bivolt" | null {
  if (!value) return null
  const v = value.trim().toUpperCase()
  if (v === "110V" || v === "110") return "110V"
  if (v === "220V" || v === "220") return "220V"
  if (v.includes("BIV")) return "Bivolt"
  return null
}
