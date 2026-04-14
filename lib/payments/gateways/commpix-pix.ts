import type {
  PaymentGateway,
  CreatePaymentInput,
  PaymentResult,
  WebhookEvent,
} from "../types"
import { logEvent } from "@/lib/logging"
import { getSiteConfig } from "@/lib/site-config"
import crypto from "crypto"

const CAT = "commpix-pix"

interface CommpixCreds {
  email: string
  password: string
  apiUrl: string
  currency: string
  webhookSecret?: string
  nature?: string
  expireSeconds?: number
}

// ── JWT token cache (in-memory, ~15 min TTL, keyed by apiUrl) ──

const tokenCache = new Map<string, { token: string; expiresAt: number }>()

async function getToken(creds: CommpixCreds): Promise<string> {
  const cacheKey = `${creds.apiUrl}|${creds.email}`
  const cached = tokenCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now() + 3 * 60 * 1000) {
    return cached.token
  }

  const res = await fetch(`${creds.apiUrl}/v1/heimdall/account/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  })

  if (!res.ok) {
    const err = await res.text()
    await logEvent({
      category: CAT, level: "error", action: "auth-failed",
      message: `Auth failed: ${res.status}`, meta: { status: res.status, error: err.slice(0, 500) },
    })
    throw new Error(`Commpix auth failed: ${res.status}`)
  }

  const data = await res.json()
  const token = data.token ?? data.access_token
  if (!token) throw new Error("Commpix auth response missing token")

  tokenCache.set(cacheKey, { token, expiresAt: Date.now() + 15 * 60 * 1000 })
  return token
}

async function apiFetch(creds: CommpixCreds, path: string, init: RequestInit = {}) {
  const token = await getToken(creds)
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...init.headers,
  }

  const res = await fetch(`${creds.apiUrl}${path}`, { ...init, headers })

  // If 401, clear cache and retry once with fresh token
  if (res.status === 401) {
    tokenCache.delete(`${creds.apiUrl}|${creds.email}`)
    const newToken = await getToken(creds)
    return fetch(`${creds.apiUrl}${path}`, {
      ...init,
      headers: { ...headers, Authorization: `Bearer ${newToken}` },
    })
  }

  return res
}

// ── Webhook event → our status ──
const CHARGE_STATUS_MAP: Record<string, WebhookEvent["status"]> = {
  "charge.succeeded": "paid",
  "charge.failed": "failed",
  "charge.expired": "failed",
  "charge.canceled": "failed",
  "charge.refunded": "refunded",
  "PAYMENT_APPROVED": "paid",
  "PAYMENT_REFUNDED": "refunded",
  "PAYMENT_FAILED": "failed",
}

export { CHARGE_STATUS_MAP }

export const commpixPix: PaymentGateway = {
  name: "commpix-pix",
  displayName: "PIX (Commpix)",

  extractExternalId(body) {
    const data = body.data as Record<string, unknown> | undefined
    return data?.resourceId ? String(data.resourceId) : null
  },

  async createPayment(input: CreatePaymentInput, credentials: string): Promise<PaymentResult> {
    const creds = JSON.parse(credentials) as CommpixCreds

    // Step 1: Get quotation — reverse=true means amount is in BRL (what customer pays)
    const quotRes = await apiFetch(creds, "/vendors/v1/charges/quotation", {
      method: "POST",
      body: JSON.stringify({
        amount: input.amountCents,
        currency: creds.currency,
        reverse: true,
      }),
    })

    if (!quotRes.ok) {
      const err = await quotRes.text()
      await logEvent({
        category: CAT, level: "error", action: "quotation-error",
        message: `Quotation failed: ${quotRes.status}`,
        meta: { status: quotRes.status, error: err.slice(0, 500), orderId: input.orderId },
      })
      const error = new Error(`Commpix quotation error ${quotRes.status}`) as Error & { userMessage?: string }
      error.userMessage = "Erro ao obter cotação. Tente novamente."
      throw error
    }

    const quotation = await quotRes.json()
    const quotationId = quotation.id
    if (!quotationId) {
      await logEvent({
        category: CAT, level: "error", action: "quotation-no-id",
        message: "Missing quotation id",
        meta: { response: JSON.stringify(quotation).slice(0, 1000) },
      })
      throw new Error("Commpix quotation response missing id")
    }

    // Step 2: Create PIX charge
    const chargeRes = await apiFetch(creds, "/vendors/v1/charges", {
      method: "POST",
      body: JSON.stringify({
        quotationId,
        nature: creds.nature ?? "SERVICES_AND_OTHERS",
        paymentMethod: "PIX",
        paymentMethodDetails: {
          expire: creds.expireSeconds ?? 1800,
        },
        metadata: {
          orderId: input.orderId,
          targetUrl: `${(await getSiteConfig()).url}/api/webhooks/payment`,
        },
      }),
    })

    if (!chargeRes.ok) {
      const err = await chargeRes.text()
      await logEvent({
        category: CAT, level: "error", action: "charge-error",
        message: `Charge failed: ${chargeRes.status}`,
        meta: { status: chargeRes.status, error: err.slice(0, 500), orderId: input.orderId },
      })
      const error = new Error(`Commpix charge error ${chargeRes.status}`) as Error & { userMessage?: string }
      error.userMessage = "Erro ao criar cobrança PIX. Tente novamente."
      throw error
    }

    const charge = await chargeRes.json()

    const chargeId = charge.id
    const txn = charge.transaction ?? charge
    const dynamicPixCode = txn.dynamicPixCode ?? charge.dynamicPixCode
    const qrCodeUrl = txn.qrCodeUrl ?? charge.qrCodeUrl
    const expiredAt = charge.expiredAt ?? txn.expiredAt

    if (!chargeId) {
      await logEvent({
        category: CAT, level: "error", action: "charge-no-id",
        message: "Missing charge id",
        meta: { response: JSON.stringify(charge).slice(0, 1000) },
      })
      throw new Error("Commpix charge response missing id")
    }

    if (!dynamicPixCode) {
      await logEvent({
        category: CAT, level: "error", action: "charge-no-pix",
        message: "Missing PIX code in response",
        meta: { chargeId, response: JSON.stringify(charge).slice(0, 1000) },
      })
      throw new Error("Commpix charge response missing PIX code")
    }

    return {
      externalId: String(chargeId),
      data: {
        pixCopiaECola: dynamicPixCode,
        qrCodeUrl: qrCodeUrl ?? null,
        expiresAt: expiredAt ?? null,
        chargeId,
      },
    }
  },

  async verifyWebhook(request: Request, credentials: string): Promise<WebhookEvent | null> {
    const body = await request.text()
    const creds = JSON.parse(credentials) as CommpixCreds

    // Optional HMAC signature verification
    const signatureHeader = request.headers.get("x-webhook-signature")
    if (creds.webhookSecret && signatureHeader) {
      const tMatch = signatureHeader.match(/t=(\d+)/)
      const vMatch = signatureHeader.match(/v1=([a-f0-9]+)/i)
      if (!tMatch || !vMatch) return null

      const timestamp = tMatch[1]
      const signature = vMatch[1].toLowerCase()

      if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return null

      const expected = crypto
        .createHmac("sha256", creds.webhookSecret)
        .update(`${timestamp}.${body}`)
        .digest("hex")

      const sigBuf = Buffer.from(signature, "utf8")
      const expBuf = Buffer.from(expected, "utf8")
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return null
      }
    }

    let event: {
      type: string
      createdAt?: string
      data: {
        id: number | string
        resourceId?: string
        status?: string
        timestamp?: string
        transactionEndToEndId?: string
        paymentOrigin?: Record<string, unknown>
        metadata?: { orderId?: string; [k: string]: unknown }
        [k: string]: unknown
      }
    }

    try {
      event = JSON.parse(body)
    } catch {
      return null
    }

    if (!event.type || !event.data?.id) return null

    const status = CHARGE_STATUS_MAP[event.type]
    if (!status) return null

    const externalId = String(event.data.resourceId)
    const eventTime = event.data.timestamp ?? event.createdAt

    // Extract payer details from paymentOrigin (PIX sender info)
    const origin = event.data.paymentOrigin as Record<string, unknown> | undefined
    const payerDetails = origin
      ? {
          transactionEndToEndId: event.data.transactionEndToEndId
            ? String(event.data.transactionEndToEndId)
            : undefined,
          payerName:       origin.name       ? String(origin.name)       : undefined,
          payerDocument:   origin.document   ? String(origin.document)   : undefined,
          payerBankName:   origin.bankName   ? String(origin.bankName)   : undefined,
          payerBankNumber: origin.bankNumber ? String(origin.bankNumber) : undefined,
        }
      : undefined

    return {
      externalId,
      status,
      paidAt: status === "paid" ? new Date(eventTime ?? Date.now()) : undefined,
      rawStatus: event.type,
      payerDetails,
    }
  },

  async refundPayment(externalId: string, _amountCents: number, credentials: string): Promise<boolean> {
    try {
      const creds = JSON.parse(credentials) as CommpixCreds
      const res = await apiFetch(creds, `/vendors/v1/charges/${externalId}/refund`, {
        method: "POST",
      })
      return res.ok
    } catch {
      return false
    }
  },
}
