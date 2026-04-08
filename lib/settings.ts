import { eq, like } from "drizzle-orm"
import { db } from "@/lib/db"
import { settings } from "@/lib/db/schema"
import { encrypt, decrypt } from "@/lib/crypto"

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
