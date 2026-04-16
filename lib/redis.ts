import Redis from "ioredis"

const globalForRedis = globalThis as unknown as { redis: Redis }

function createRedisClient() {
  const client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })
  // Prevent unhandled error events from crashing the process (e.g. during build)
  client.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message)
  })
  return client
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis

export async function cacheGet(key: string): Promise<string | null> {
  return redis.get(key)
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<void> {
  if (ttlSeconds) {
    await redis.set(key, value, "EX", ttlSeconds)
  } else {
    await redis.set(key, value)
  }
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key)
}

/**
 * Acquire a distributed lock using Redis SET NX EX.
 * Returns the lock value (a random token) on success, or null if already locked.
 */
export async function acquireLock(
  key: string,
  ttlSeconds = 30,
): Promise<string | null> {
  const token = crypto.randomUUID()
  const result = await redis.set(key, token, "EX", ttlSeconds, "NX")
  return result === "OK" ? token : null
}

/**
 * Release a distributed lock only if we still own it.
 */
export async function releaseLock(
  key: string,
  token: string,
): Promise<void> {
  const script = `if redis.call("get",KEYS[1])==ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end`
  await redis.eval(script, 1, key, token)
}
