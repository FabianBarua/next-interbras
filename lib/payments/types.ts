import type { ComponentType } from "react"

// ─── What every gateway strategy must implement ───

export interface PaymentGateway {
  /** Gateway type key: "pyxpay-pix", "pyxpay-card", "commpix-pix", etc. */
  name: string
  /** Human-readable name: "PIX (PyxPay)", "Cartão (PyxPay)" */
  displayName: string
  /** Create a payment — credentials are passed in as decrypted JSON string */
  createPayment(input: CreatePaymentInput, credentials: string): Promise<PaymentResult>
  /** Extract the externalId from a raw webhook body. Return null if format doesn't match this gateway. */
  extractExternalId(body: Record<string, unknown>): string | null
  /** Verify webhook signature + parse event. Credentials passed as decrypted JSON string. */
  verifyWebhook(request: Request, credentials: string): Promise<WebhookEvent | null>
  /** Refund a payment by external ID. Credentials passed as decrypted JSON string. */
  refundPayment(externalId: string, amountCents: number, credentials: string): Promise<boolean>
}

// ─── Input / Output types ───

export interface CreatePaymentInput {
  orderId: string
  amountCents: number
  description: string
  customer: {
    name: string
    email: string
    cpf: string
  }
  /** Your public webhook URL the gateway should call back */
  postbackUrl: string
}

/** Returned by createPayment — the `data` bag is gateway-specific */
export interface PaymentResult {
  externalId: string
  /** Arbitrary data consumed by the payment block component (QR, URL, etc.) */
  data: Record<string, unknown>
}

/** Parsed from webhook by verifyWebhook */
export interface WebhookEvent {
  externalId: string
  status: "paid" | "failed" | "refunded"
  paidAt?: Date
  rawStatus?: string | number
  /** Optional payer details extracted from the webhook payload */
  payerDetails?: {
    transactionEndToEndId?: string
    payerName?: string
    payerDocument?: string
    payerBankName?: string
    payerBankNumber?: string
  }
}

// ─── Payment Block — the React component each gateway provides ───

export interface PaymentBlockProps {
  /** The `data` bag from PaymentResult */
  data: Record<string, unknown>
  /** Order ID for SSE connection */
  orderId: string
}

/** Each gateway registers a React component that renders its payment UI */
export type PaymentBlockComponent = ComponentType<PaymentBlockProps>
