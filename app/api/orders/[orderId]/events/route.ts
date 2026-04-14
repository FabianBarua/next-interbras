import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import Redis from "ioredis"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params
  const session = await auth()

  // Verify order ownership
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true, userId: true },
  })

  if (!session?.user?.id || !order || order.userId !== session.user.id) {
    return new Response("Not found", { status: 404 })
  }

  // Create a dedicated Redis subscriber (cannot reuse shared connection)
  const subscriber = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })

  const channel = `order:${orderId}`

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Send initial keepalive
      controller.enqueue(encoder.encode(": connected\n\n"))

      // Subscribe to Redis pub/sub channel for this order
      await subscriber.subscribe(channel)

      subscriber.on("message", (_ch: string, message: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`))

          // If payment is final, close after sending
          const parsed = JSON.parse(message) as { status: string }
          if (["paid", "failed", "refunded"].includes(parsed.status)) {
            setTimeout(() => {
              subscriber.unsubscribe(channel).catch(() => {})
              subscriber.quit().catch(() => {})
              controller.close()
            }, 500)
          }
        } catch {
          // Ignore malformed messages
        }
      })

      // Auto-close after 35 minutes (safety net)
      setTimeout(() => {
        subscriber.unsubscribe(channel).catch(() => {})
        subscriber.quit().catch(() => {})
        try {
          controller.close()
        } catch {
          // Already closed
        }
      }, 35 * 60 * 1000)
    },
    cancel() {
      subscriber.unsubscribe(channel).catch(() => {})
      subscriber.quit().catch(() => {})
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
