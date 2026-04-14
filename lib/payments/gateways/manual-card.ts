import type { PaymentGateway, CreatePaymentInput, PaymentResult } from "../types"

export interface ManualCardCreds {
  message?: string
}

export const manualCard: PaymentGateway = {
  name: "manual-card",
  displayName: "Tarjeta de crédito/débito (presencial)",

  extractExternalId(body) {
    return (body.orderId as string) ?? null
  },

  async createPayment(input: CreatePaymentInput, credentials: string): Promise<PaymentResult> {
    const creds = JSON.parse(credentials) as ManualCardCreds
    return {
      externalId: input.orderId,
      data: {
        placeholder: true,
        message: creds.message ?? "Realice el pago con su tarjeta al momento de retirar el pedido.",
      },
    }
  },

  async verifyWebhook() {
    return null
  },

  async refundPayment() {
    return false
  },
}
