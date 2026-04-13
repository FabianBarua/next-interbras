import { eq, like } from "drizzle-orm"
import { db } from "@/lib/db"
import { settings } from "@/lib/db/schema"
import { encrypt, decrypt } from "@/lib/crypto"
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis"

const ECOMMERCE_CACHE_KEY = "setting:site.ecommerce"
const ECOMMERCE_CACHE_TTL = 300 // 5 minutes

/**
 * Check if ecommerce is enabled. Uses Redis cache with 5-min TTL.
 * Defaults to false if no setting exists.
 */
export async function isEcommerceEnabled(): Promise<boolean> {
  try {
    const cached = await cacheGet(ECOMMERCE_CACHE_KEY)
    if (cached !== null) return cached === "true"
  } catch {
    // Redis down — fall through to DB
  }

  const value = await getSetting("site.ecommerce")
  const enabled = value === "true"

  try {
    await cacheSet(ECOMMERCE_CACHE_KEY, String(enabled), ECOMMERCE_CACHE_TTL)
  } catch {
    // Best-effort cache write
  }

  return enabled
}

/**
 * Invalidate the ecommerce cache after toggling.
 */
export async function invalidateEcommerceCache(): Promise<void> {
  try {
    await cacheDel(ECOMMERCE_CACHE_KEY)
  } catch {
    // Best-effort
  }
}

/**
 * Get a single setting value by key. Returns null if not found.
 * Automatically decrypts if the setting is marked as encrypted.
 */
export async function getSetting(key: string): Promise<string | null> {
  const row = await db.query.settings.findFirst({
    where: eq(settings.key, key),
  })
  if (!row) return null
  if (row.encrypted) {
    try {
      return decrypt(row.value)
    } catch {
      return null
    }
  }
  return row.value
}

/**
 * Set a setting value. Creates or updates (upsert).
 * If encrypted=true, the value is encrypted before storing.
 */
export async function setSetting(
  key: string,
  value: string,
  encrypted = false,
): Promise<void> {
  const storedValue = encrypted ? encrypt(value) : value
  await db
    .insert(settings)
    .values({ key, value: storedValue, encrypted })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: storedValue, encrypted },
    })
}

/**
 * Get all settings matching a prefix (e.g. "smtp.").
 * Returns a record of key → decrypted value.
 */
export async function getSettings(
  prefix: string,
): Promise<Record<string, string>> {
  const safePrefix = prefix.replace(/[%_\\]/g, "\\$&")
  const rows = await db
    .select()
    .from(settings)
    .where(like(settings.key, `${safePrefix}%`))

  const result: Record<string, string> = {}
  for (const row of rows) {
    if (row.encrypted) {
      try {
        result[row.key] = decrypt(row.value)
      } catch {
        result[row.key] = ""
      }
    } else {
      result[row.key] = row.value
    }
  }
  return result
}
