"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { seoPages } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/auth/get-session"
import { cachedQuery, invalidateCache } from "@/lib/cache"

export async function getSeoPages() {
  await requireAdmin()
  return db.select().from(seoPages).orderBy(seoPages.path)
}

export async function getSeoPage(path: string) {
  await requireAdmin()
  return db.query.seoPages.findFirst({
    where: eq(seoPages.path, path),
  })
}

export async function getPublicSeo(path: string) {
  return cachedQuery(`q:seo:${path}`, async () => {
    try {
      return (
        (await db.query.seoPages.findFirst({
          where: eq(seoPages.path, path),
        })) ?? null
      )
    } catch {
      return null
    }
  }, 300)
}

interface SeoData {
  path: string
  title?: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  canonical?: string
  noIndex?: boolean
  noFollow?: boolean
  keywords?: string
  structuredData?: string
}

const PATH_REGEX = /^\/[a-zA-Z0-9\-_\/]*$/
const MAX_PATH_LENGTH = 255

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

function isValidImagePath(str: string): boolean {
  return str.startsWith("/uploads/") || isValidUrl(str)
}

export async function upsertSeoPage(data: SeoData) {
  await requireAdmin()

  const path = data.path.trim()
  if (!path.startsWith("/")) return { error: "Path debe comenzar con /" }
  if (path.length > MAX_PATH_LENGTH) return { error: `Path muy largo (max ${MAX_PATH_LENGTH} caracteres)` }
  if (!PATH_REGEX.test(path)) return { error: "Path contiene caracteres inválidos" }
  if (path.includes("..")) return { error: "Path inválido" }

  const canonical = data.canonical?.trim() || null
  if (canonical && !isValidUrl(canonical)) {
    return { error: "URL canónica inválida. Use una URL completa (https://...)" }
  }

  const ogImage = data.ogImage?.trim() || null
  if (ogImage && !isValidImagePath(ogImage)) {
    return { error: "URL de imagen OG inválida. Use un path /uploads/... o URL https://" }
  }

  const structuredData = data.structuredData?.trim() || null
  if (structuredData) {
    try {
      JSON.parse(structuredData)
    } catch {
      return { error: "JSON-LD inválido. Verifique la sintaxis del JSON." }
    }
  }

  const existing = await db.query.seoPages.findFirst({
    where: eq(seoPages.path, path),
  })

  const values = {
    path,
    title: data.title?.trim() || null,
    description: data.description?.trim() || null,
    ogTitle: data.ogTitle?.trim() || null,
    ogDescription: data.ogDescription?.trim() || null,
    ogImage,
    canonical,
    noIndex: data.noIndex ?? false,
    noFollow: data.noFollow ?? false,
    keywords: data.keywords?.trim() || null,
    structuredData,
  }

  if (existing) {
    await db.update(seoPages).set(values).where(eq(seoPages.id, existing.id))
  } else {
    await db.insert(seoPages).values(values)
  }

  revalidatePath(path)
  revalidatePath("/dashboard/seo")
  await invalidateCache("q:seo:*")
  return { success: true }
}

export async function deleteSeoPage(path: string) {
  await requireAdmin()
  await db.delete(seoPages).where(eq(seoPages.path, path))
  revalidatePath("/dashboard/seo")
  await invalidateCache("q:seo:*")
  return { success: true }
}
