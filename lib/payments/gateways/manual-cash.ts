import type { PaymentGateway, CreatePaymentInput, PaymentResult } from "../types"

export interface ManualCashCreds {
  storeAddress: string
  storePhone?: string
  storeHours?: string
  pickupMessage?: string
}

export const manualCash: PaymentGateway = {
  name: "manual-cash",
  displayName: "Efectivo / Dinheiro",

  extractExternalId(body) {
    return (body.orderId as string) ?? null
  },

  async createPayment(input: CreatePaymentInput, credentials: string): Promise<PaymentResult> {
    const creds = JSON.parse(credentials) as ManualCashCreds
    return {
      externalId: input.orderId,
      data: {
        storeAddress: creds.storeAddress ?? "",
        storePhone: creds.storePhone ?? "",
        storeHours: creds.storeHours ?? "",
        pickupMessage: creds.pickupMessage ?? "Diríjase a nuestra tienda para abonar y retirar su pedido.",
      },
    }
  },

  async verifyWebhook() {
    return null // no external webhooks — order confirmed manually by admin
  },

  async refundPayment() {
    return false // manual refund — handled by admin
  },
}
