import { cacheGet, cacheSet, redis } from "./redis"

/**
 * Two-level cache helper: checks Redis first, falls through to fn().
 * Result is stored in Redis with the given TTL.
 */
export async function cachedQuery<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds = 60,
): Promise<T> {
  try {
    const cached = await cacheGet(key)
    if (cached != null) return JSON.parse(cached) as T
  } catch {
    // Redis down or parse error — fall through to DB
  }

  const result = await fn()

  try {
    await cacheSet(key, JSON.stringify(result), ttlSeconds)
  } catch {
    // Don't fail the request if Redis write fails
  }

  return result
}

/**
 * Delete all Redis cache keys matching the given glob patterns.
 * Used for cache invalidation when admin mutates data.
 */
export async function invalidateCache(...patterns: string[]): Promise<void> {
  for (const pattern of patterns) {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) await redis.del(...keys)
    } catch {
      // Best-effort invalidation
    }
  }
}
