import { redis } from "@/lib/redis"

/**
 * Simple sliding-window rate limiter backed by Redis.
 * Uses atomic INCR + EXPIRE via Lua script to prevent race conditions.
 * Returns { success: true } if allowed, { success: false, retryAfter } if blocked.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ success: boolean; retryAfter?: number }> {
  const redisKey = `rl:${key}`

  // Atomic: increment and set expiry only if key is new
  const current = await redis.eval(
    `local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return c`,
    1,
    redisKey,
    windowSeconds,
  ) as number

  if (current > limit) {
    const ttl = await redis.ttl(redisKey)
    return { success: false, retryAfter: ttl > 0 ? ttl : windowSeconds }
  }

  return { success: true }
}
