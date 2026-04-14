import { redis } from "@/lib/redis"

/**
 * Publish a payment status update via Redis pub/sub.
 * The SSE endpoint subscribes to this channel and pushes to the client.
 */
export async function notifyPaymentUpdate(
  orderId: string,
  status: "paid" | "failed" | "refunded",
) {
  await redis.publish(`order:${orderId}`, JSON.stringify({ status }))
}
