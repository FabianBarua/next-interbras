import Redis from "ioredis"

const globalForRedis = globalThis as unknown as { redis: Redis }

function createRedisClient() {
  const client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })
  // Prevent unhandled error events from crashing the process (e.g. during build)
  client.on("error", () => {})
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
