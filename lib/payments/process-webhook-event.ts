import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { payments, orders, orderPaymentDetails, users } from "@/lib/db/schema"
import { notifyPaymentUpdate } from "@/lib/payments/notify"
import { sendEmail } from "@/lib/email/send"
import { logEvent } from "@/lib/logging"
import { getSiteUrl } from "@/lib/get-base-url"
import { getFlowForOrder } from "@/lib/order-flow-resolver"
import type { WebhookEvent } from "./types"

const CAT = "webhook-payment"

type Payment = typeof payments.$inferSelect

/**
 * Shared webhook event processing — updates payment/order status,
 * sends emails, and notifies via Redis pub/sub.
 */
export async function processWebhookEvent(
  event: WebhookEvent,
  payment: Payment,
  webhookBody: Record<string, unknown>,
) {
  const externalId = event.externalId

  if (event.status === "paid") {
    await db
      .update(payments)
      .set({
        status: "succeeded",
        paidAt: event.paidAt ?? new Date(),
        metadata: {
          ...(payment.metadata as Record<string, unknown>),
          webhookRawStatus: event.rawStatus,
        },
      })
      .where(eq(payments.id, payment.id))

    // Advance order to next status from flow (typically "confirmed")
    const flow = await getFlowForOrder(payment.orderId)
    const currentOrder = await db.query.orders.findFirst({
      where: eq(orders.id, payment.orderId),
      columns: { status: true },
    })
    let nextStatus = "confirmed"
    if (flow && currentOrder) {
      const currentIdx = flow.steps.findIndex((s) => s.statusSlug === currentOrder.status)
      if (currentIdx >= 0 && currentIdx + 1 < flow.steps.length) {
        nextStatus = flow.steps[currentIdx + 1].statusSlug
      }
    }

    await db
      .update(orders)
      .set({ status: nextStatus })
      .where(eq(orders.id, payment.orderId))

    // Send confirmation email
    const paidOrder = await db.query.orders.findFirst({
      where: eq(orders.id, payment.orderId),
      columns: { userId: true },
    })
    if (paidOrder?.userId) {
      const paidUser = await db.query.users.findFirst({
        where: eq(users.id, paidOrder.userId),
        columns: { name: true, email: true },
      })
      if (paidUser) {
        await sendEmail(paidUser.email, "payment-confirmed", {
          nome: paidUser.name,
          pedidoId: payment.orderId.slice(0, 8),
        })
      }
    }

    await notifyPaymentUpdate(payment.orderId, "paid")

    // Save payer details from webhook
    if (event.payerDetails) {
      try {
        await db
          .insert(orderPaymentDetails)
          .values({
            orderId:               payment.orderId,
            gateway:               payment.gateway,
            transactionEndToEndId: event.payerDetails.transactionEndToEndId ?? null,
            externalId:            event.externalId,
            payerName:             event.payerDetails.payerName    ?? null,
            payerDocument:         event.payerDetails.payerDocument ?? null,
            payerBankName:         event.payerDetails.payerBankName ?? null,
            payerBankNumber:       event.payerDetails.payerBankNumber ?? null,
          })
          .onConflictDoUpdate({
            target: orderPaymentDetails.orderId,
            set: {
              transactionEndToEndId: event.payerDetails.transactionEndToEndId ?? null,
              externalId:            event.externalId,
              payerName:             event.payerDetails.payerName    ?? null,
              payerDocument:         event.payerDetails.payerDocument ?? null,
              payerBankName:         event.payerDetails.payerBankName ?? null,
              payerBankNumber:       event.payerDetails.payerBankNumber ?? null,
            },
          })
      } catch (detailsErr) {
        await logEvent({
          category: CAT, level: "warn", action: "save-details-failed",
          message: `Failed to save payment details: ${(detailsErr as Error).message}`,
          entity: "payment", entityId: payment.id,
          meta: { orderId: payment.orderId },
        })
      }
    }

    await logEvent({ category: CAT, level: "info", action: "payment-succeeded", message: `Payment succeeded for order ${payment.orderId.slice(0, 8)}`, entity: "payment", entityId: payment.id, meta: { externalId, orderId: payment.orderId, rawStatus: event.rawStatus, webhook: webhookBody } })
  } else if (event.status === "failed") {
    await db
      .update(payments)
      .set({ status: "failed" })
      .where(eq(payments.id, payment.id))

    await db
      .update(orders)
      .set({ status: "cancelled" })
      .where(eq(orders.id, payment.orderId))

    // Send cancellation email
    const failedOrder = await db.query.orders.findFirst({
      where: eq(orders.id, payment.orderId),
      columns: { userId: true },
    })
    if (failedOrder?.userId) {
      const failedUser = await db.query.users.findFirst({
        where: eq(users.id, failedOrder.userId),
        columns: { name: true, email: true },
      })
      if (failedUser) {
        const siteUrl = getSiteUrl()
        await sendEmail(failedUser.email, "order-cancelled", {
          nome: failedUser.name,
          pedidoId: payment.orderId.slice(0, 8),
          siteUrl,
        })
      }
    }

    await notifyPaymentUpdate(payment.orderId, "failed")

    await logEvent({ category: CAT, level: "warn", action: "payment-failed", message: `Payment failed for order ${payment.orderId.slice(0, 8)}`, entity: "payment", entityId: payment.id, meta: { externalId, orderId: payment.orderId, rawStatus: event.rawStatus, webhook: webhookBody } })
  } else if (event.status === "refunded") {
    await db
      .update(payments)
      .set({ status: "refunded" })
      .where(eq(payments.id, payment.id))

    await db
      .update(orders)
      .set({ status: "refunded" })
      .where(eq(orders.id, payment.orderId))

    await notifyPaymentUpdate(payment.orderId, "refunded")

    await logEvent({ category: CAT, level: "info", action: "payment-refunded", message: `Payment refunded for order ${payment.orderId.slice(0, 8)}`, entity: "payment", entityId: payment.id, meta: { externalId, orderId: payment.orderId, rawStatus: event.rawStatus, webhook: webhookBody } })
  }
}
