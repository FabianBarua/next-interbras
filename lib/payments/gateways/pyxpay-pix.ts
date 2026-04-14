import type {
  PaymentGateway,
  CreatePaymentInput,
  PaymentResult,
  WebhookEvent,
} from "../types"
import { logEvent } from "@/lib/logging"

const PYXPAY_BASE = "https://pyxpay.com.br/v1"

/** PyxPay has a typo: returns `identidicador` instead of `identificador`. Support both. */
function getTransactionId(obj: Record<string, unknown>): number | undefined {
  return (obj.identidicador ?? obj.identificador) as number | undefined
}

// PyxPay status enum → our status
const STATUS_MAP: Record<number, WebhookEvent["status"]> = {
  2: "paid",      // PAGO
  3: "paid",      // BOLETO_LIQUIDADO_COMPENSADO
  4: "failed",    // CANCELADO
  8: "refunded",  // ESTORNADO
  10: "failed",   // RECUSADO
  11: "refunded", // DEVOLVIDO
  16: "paid",     // TRANSFERIDO
  17: "failed",   // NAO_PAGO
  18: "paid",     // FINALIZADO
  19: "paid",     // CONFIRMADO
  20: "failed",   // REJEITADO
}

interface PyxPayCreds {
  apiKey: string
  taxa?: number // percentage fee PyxPay adds (e.g. 2.5 = 2.5%)
}

async function pyxFetch(path: string, apiKey: string, options: RequestInit = {}) {
  return fetch(`${PYXPAY_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
      ...options.headers,
    },
  })
}

export const pyxpayPix: PaymentGateway = {
  name: "pyxpay-pix",
  displayName: "PIX (PyxPay)",

  extractExternalId(body) {
    return body.transacaoId ? String(body.transacaoId) : null
  },

  async createPayment(input: CreatePaymentInput, credentials: string): Promise<PaymentResult> {
    const creds = JSON.parse(credentials) as PyxPayCreds
    const valorBruto = input.amountCents / 100

    // Discount the gateway fee so the user pays exactly the order amount
    const taxa = creds.taxa ?? 0
    const valorReais = taxa > 0
      ? Math.round((valorBruto / (1 + taxa / 100)) * 100) / 100
      : valorBruto

    const body = {
      valor: valorReais,
      nome: input.customer.name.slice(0, 60),
      documento: input.customer.cpf.replace(/\D/g, ""),
      postbackUrl: input.postbackUrl,
      metadata: JSON.stringify({ orderId: input.orderId }),
    }

    const res = await pyxFetch("/transacao/pix", creds.apiKey, {
      method: "POST",
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      await logEvent({ category: "webhook-pyxpay", level: "error", action: "pix-error", message: `PyxPay PIX error ${res.status}`, meta: { status: res.status, orderId: input.orderId, error: err } })
      const error = new Error(
        `PyxPay PIX error ${res.status}: ${JSON.stringify(err)}`,
      ) as Error & { userMessage?: string }
      error.userMessage = (err as { message?: string }).message ?? undefined
      throw error
    }

    const rawBody = await res.text()
    let tx: Record<string, unknown>
    try {
      tx = JSON.parse(rawBody)
    } catch {
      await logEvent({ category: "webhook-pyxpay", level: "error", action: "create-parse-error", message: "Failed to parse PyxPay response", meta: { rawBody: rawBody.slice(0, 1000) } })
      throw new Error("Invalid response from PyxPay")
    }

    const txId = getTransactionId(tx)

    if (!txId) {
      await logEvent({ category: "webhook-pyxpay", level: "error", action: "create-no-id", message: "PyxPay response missing identifier", meta: { rawBody: rawBody.slice(0, 1000) } })
      throw new Error("PyxPay did not return a transaction identifier")
    }

    return {
      externalId: String(txId),
      data: {
        pixCopiaECola: tx.pixChavePagamento as string,
        hashId: tx.hashId as string,
        expiresAt: null,
      },
    }
  },

  async verifyWebhook(request: Request, _credentials: string): Promise<WebhookEvent | null> {
    let body: {
      transacaoId: number
      statusAtual: number
      statusAnterior: number
      valor: number
      metaData?: string
    }

    try {
      body = await request.json()
    } catch {
      return null
    }

    if (!body.transacaoId || !body.statusAtual) return null
    if (!Number.isInteger(body.transacaoId) || body.transacaoId <= 0) return null

    const status = STATUS_MAP[body.statusAtual]
    if (!status) return null

    return {
      externalId: String(body.transacaoId),
      status,
      paidAt: status === "paid" ? new Date() : undefined,
      rawStatus: body.statusAtual,
    }
  },

  async refundPayment(_externalId: string, _amountCents: number, _credentials: string): Promise<boolean> {
    return false
  },
}
