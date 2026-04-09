import type { Locale } from "./config"
import { defaultLocale } from "./config"

/**
 * Map of canonical (ES) paths → PT translated paths.
 * Only segments that change need entries.
 */
const ptPaths: Record<string, string> = {
  "/productos": "/produtos",
  "/carrito": "/carrinho",
  "/checkout/confirmacion": "/checkout/confirmacao",
  "/cuenta": "/conta",
  "/cuenta/pedidos": "/conta/pedidos",
  "/cuenta/wishlist": "/conta/wishlist",
  "/cuenta/direcciones": "/conta/enderecos",
  "/quienes-somos": "/quem-somos",
  "/donde-estamos": "/onde-estamos",
  "/soporte": "/suporte",
}

// Reverse map: PT path → canonical (ES) path
const ptToCanonical: Record<string, string> = {}
for (const [es, pt] of Object.entries(ptPaths)) {
  ptToCanonical[pt] = es
}

/**
 * Convert a canonical (ES) path to a localized path with prefix.
 * e.g. localePath("/productos", "pt") → "/pt/produtos"
 *      localePath("/productos", "es") → "/es/productos"
 */
export function localePath(canonicalPath: string, locale: Locale): string {
  // Separate path from query string and hash
  const [pathPart, ...rest] = canonicalPath.split(/(?=[?#])/)
  const suffix = rest.join("")

  if (locale === "pt") {
    const translated = translateCanonicalToPt(pathPart)
    return `/pt${translated}${suffix}`
  }
  return `/es${pathPart}${suffix}`
}

/**
 * Translate a canonical (ES) path to PT. Handles prefix matching
 * for dynamic routes like /productos/[category]/[slug]
 */
function translateCanonicalToPt(path: string): string {
  // Exact match
  if (ptPaths[path]) return ptPaths[path]

  // Prefix match: find longest matching prefix
  let bestMatch = ""
  let bestTranslation = ""
  for (const [es, pt] of Object.entries(ptPaths)) {
    if (path.startsWith(es + "/") && es.length > bestMatch.length) {
      bestMatch = es
      bestTranslation = pt
    }
  }
  if (bestMatch) {
    return bestTranslation + path.slice(bestMatch.length)
  }

  return path
}

/**
 * Given a localized path (without locale prefix), convert back to canonical (ES).
 * e.g. "/produtos/tvs/some-slug" → "/productos/tvs/some-slug"
 */
export function toCanonicalPath(localizedPath: string): string {
  // Exact match
  if (ptToCanonical[localizedPath]) return ptToCanonical[localizedPath]

  // Prefix match
  let bestMatch = ""
  let bestCanonical = ""
  for (const [pt, es] of Object.entries(ptToCanonical)) {
    if (localizedPath.startsWith(pt + "/") && pt.length > bestMatch.length) {
      bestMatch = pt
      bestCanonical = es
    }
  }
  if (bestMatch) {
    return bestCanonical + localizedPath.slice(bestMatch.length)
  }

  return localizedPath
}

/**
 * Translate a canonical path to the given locale.
 * Returns the path WITHOUT locale prefix.
 */
export function translatePath(canonicalPath: string, locale: Locale): string {
  if (locale === "pt") return translateCanonicalToPt(canonicalPath)
  return canonicalPath
}
