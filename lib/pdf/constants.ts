import type { CurrencyCode, Viewport } from "./types"

export const STORAGE_KEY = "interbras-pdf-catalog-v1"

export const CURRENCIES: Array<{ code: CurrencyCode; label: string; symbol: string }> = [
  { code: "GS", label: "Guaraníes", symbol: "₲" },
  { code: "BRL", label: "Reais", symbol: "R$" },
  { code: "USD", label: "Dólares", symbol: "US$" },
]

/** Available accent colors for custom sections (uses brand tokens + neutrals). */
export const SECTION_COLORS = [
  { key: "brand", label: "Verde", hex: "#36a53c", bg: "#e1f7e1", fg: "#1d4a21" },
  { key: "blue", label: "Azul", hex: "#2563eb", bg: "#dbeafe", fg: "#1e3a8a" },
  { key: "amber", label: "Ámbar", hex: "#d97706", bg: "#fef3c7", fg: "#78350f" },
  { key: "red", label: "Rojo", hex: "#dc2626", bg: "#fee2e2", fg: "#7f1d1d" },
  { key: "slate", label: "Neutro", hex: "#475569", bg: "#f1f5f9", fg: "#0f172a" },
  { key: "purple", label: "Violeta", hex: "#7c3aed", bg: "#ede9fe", fg: "#4c1d95" },
] as const

export type SectionColorKey = typeof SECTION_COLORS[number]["key"]

export function getSectionColor(key: string) {
  return SECTION_COLORS.find(c => c.key === key) ?? SECTION_COLORS[0]
}

/** PDF page dimensions (A4 portrait, in mm). */
export const PDF_PAGE = {
  width: 210,
  height: 297,
  margin: 10,
} as const

/** Viewport widths used for catalog preview + canvas capture, in px. */
export const VIEWPORT_WIDTH: Record<Viewport, number> = {
  desktop: 1050,
  mobile: 430,
}

/** Available icons for custom sections (phosphor duotone names). */
export const SECTION_ICONS = [
  "Star", "Fire", "Lightning", "Heart", "Tag", "Sparkle", "Gift", "Crown",
  "Package", "ShoppingCart", "Storefront", "Tools", "Wrench", "Lightbulb",
  "Fan", "DeviceMobile", "Laptop", "Television", "Headphones", "Plug",
] as const
