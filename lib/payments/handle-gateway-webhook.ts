import { NextRequest, NextResponse } from "next/server"
import { eq, and, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { payments, gatewayConfig } from "@/lib/db/schema"
import { getGateway } from "@/lib/payments/registry"
import { getGatewayInstanceBySlugInternal } from "@/lib/payments/get-gateway-creds"
import { processWebhookEvent } from "@/lib/payments/process-webhook-event"
import "@/lib/payments/init"
import { rateLimit } from "@/lib/rate-limit"
import { logEvent } from "@/lib/logging"
import { getClientIpFromHeaders } from "@/lib/get-client-ip"

/**
 * Shared handler for per-gateway webhook routes.
 * Each route file only needs to call this with the gateway name.
 */
export async function handleGatewayWebhook(req: NextRequest, gatewayName: string) {
  const cat = `webhook-${gatewayName}`
  const ip = getClientIpFromHeaders(req.headers)

  const rl = await rateLimit(`webhook:${ip}`, 100, 60)
  if (!rl.success) {
    await logEvent({ category: cat, level: "warn", action: "rate-limited", message: `Rate limited IP: ${ip}`, meta: { ip } })
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const body = await req.text()
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(body)
  } catch {
    await logEvent({ category: cat, level: "error", action: "invalid-json", message: "Invalid JSON body", meta: { ip, body: body.slice(0, 500) } })
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const gateway = getGateway(gatewayName)

  const externalId = gateway.extractExternalId(parsed)
  if (!externalId) {
    await logEvent({ category: cat, level: "warn", action: "missing-id", message: "Missing external ID", meta: { ip, parsed } })
    return NextResponse.json({ error: "Missing external ID" }, { status: 400 })
  }

  // Scope lookup: only match payments from instances of this gateway type
  const instanceSlugs = await db
    .select({ slug: gatewayConfig.slug })
    .from(gatewayConfig)
    .where(eq(gatewayConfig.type, gatewayName))
  const slugs = instanceSlugs.map((r) => r.slug)

  if (slugs.length === 0) {
    await logEvent({ category: cat, level: "warn", action: "no-instances", message: `No instances for ${gatewayName}`, meta: { externalId } })
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const payment = await db.query.payments.findFirst({
    where: and(eq(payments.externalId, externalId), inArray(payments.gateway, slugs)),
  })

  if (!payment) {
    await logEvent({ category: cat, level: "warn", action: "unknown-transaction", message: `Payment not found for externalId: ${externalId}`, meta: { externalId, parsed } })
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  // getGatewayInstanceBySlugInternal doesn't filter by active — fine for webhooks
  const instance = await getGatewayInstanceBySlugInternal(payment.gateway)
  if (!instance) {
    await logEvent({ category: cat, level: "error", action: "unknown-gateway", message: `Instance not found: ${payment.gateway}`, entity: "payment", entityId: payment.id })
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const verifyRequest = new Request(req.url, { method: "POST", headers: req.headers, body })

  let event
  try {
    event = await gateway.verifyWebhook(verifyRequest, instance.decryptedCredentials)
  } catch (err) {
    await logEvent({ category: cat, level: "error", action: "verify-error", message: `verifyWebhook threw: ${(err as Error).message}`, entity: "payment", entityId: payment.id, meta: { externalId, error: (err as Error).message } })
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  if (!event) return NextResponse.json({ ok: true }, { status: 200 })

  // Idempotency: skip if payment is already in a final state
  if (payment.status === "succeeded" || payment.status === "refunded") {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  await processWebhookEvent(event, payment, parsed)
  return NextResponse.json({ ok: true }, { status: 200 })
}
