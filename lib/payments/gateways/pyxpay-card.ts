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

const STATUS_MAP: Record<number, WebhookEvent["status"]> = {
  2: "paid",
  3: "paid",
  4: "failed",
  8: "refunded",
  10: "failed",
  11: "refunded",
  16: "paid",
  17: "failed",
  18: "paid",
  19: "paid",
  20: "failed",
}

interface PyxPayCreds {
  apiKey: string
  taxa?: number
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

export const pyxpayCard: PaymentGateway = {
  name: "pyxpay-card",
  displayName: "Cartão (PyxPay)",

  extractExternalId(body) {
    return body.transacaoId ? String(body.transacaoId) : null
  },

  async createPayment(input: CreatePaymentInput, credentials: string): Promise<PaymentResult> {
    const creds = JSON.parse(credentials) as PyxPayCreds
    const valorBruto = input.amountCents / 100

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

    const res = await pyxFetch("/transacao/cartao", creds.apiKey, {
      method: "POST",
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      await logEvent({ category: "webhook-pyxpay", level: "error", action: "card-error", message: `PyxPay Card error ${res.status}`, meta: { status: res.status, orderId: input.orderId, error: err } })
      const error = new Error(
        `PyxPay Card error ${res.status}: ${JSON.stringify(err)}`,
      ) as Error & { userMessage?: string }
      error.userMessage = (err as { message?: string }).message ?? undefined
      throw error
    }

    const tx = (await res.json()) as Record<string, unknown>
    const txId = getTransactionId(tx)

    return {
      externalId: String(txId ?? ""),
      data: {
        checkoutUrl: tx.link as string,
        hashId: tx.hashId as string,
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
