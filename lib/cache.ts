import { cacheGet, cacheSet, redis } from "./redis"

/* ------------------------------------------------------------------ */
/*  L1: In-memory cache (per-process) avoids Redis round-trips        */
/* ------------------------------------------------------------------ */

interface MemEntry {
  data: string
  expiresAt: number
}

const memCache = new Map<string, MemEntry>()
const MEM_TTL_MS = 30_000 // 30 s — short enough to pick up invalidations quickly

function memGet(key: string): string | null {
  const entry = memCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key)
    return null
  }
  return entry.data
}

function memSet(key: string, data: string): void {
  memCache.set(key, { data, expiresAt: Date.now() + MEM_TTL_MS })
}

/* ------------------------------------------------------------------ */
/*  Three-level cache: Memory → Redis → DB                            */
/* ------------------------------------------------------------------ */

/**
 * Three-level cache helper: Memory (L1) → Redis (L2) → fn() (DB).
 * L1 avoids network round-trips entirely for hot paths like header categories.
 */
export async function cachedQuery<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds = 60,
): Promise<T> {
  // L1: in-memory
  const mem = memGet(key)
  if (mem != null) {
    try { return JSON.parse(mem) as T } catch { /* fall through */ }
  }

  // L2: Redis
  try {
    const cached = await cacheGet(key)
    if (cached != null) {
      memSet(key, cached) // promote to L1
      return JSON.parse(cached) as T
    }
  } catch {
    // Redis down or parse error — fall through to DB
  }

  // L3: DB
  const result = await fn()
  const json = JSON.stringify(result)

  memSet(key, json) // populate L1

  try {
    await cacheSet(key, json, ttlSeconds)
  } catch {
    // Don't fail the request if Redis write fails
  }

  return result
}

/**
 * Delete all Redis cache keys matching the given glob patterns.
 * Also clears matching L1 in-memory entries.
 */
export async function invalidateCache(...patterns: string[]): Promise<void> {
  // Clear L1 entries matching the patterns
  for (const pattern of patterns) {
    const regex = new RegExp(
      "^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
    )
    for (const key of memCache.keys()) {
      if (regex.test(key)) memCache.delete(key)
    }
  }

  // Clear L2 (Redis)
  for (const pattern of patterns) {
    try {
      let cursor = "0"
      do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100)
        cursor = nextCursor
        if (keys.length > 0) await redis.del(...keys)
      } while (cursor !== "0")
    } catch {
      // Best-effort invalidation
    }
  }
}
