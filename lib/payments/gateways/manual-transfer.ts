import type { PaymentGateway, CreatePaymentInput, PaymentResult } from "../types"

export interface ManualTransferCreds {
  bankName: string
  accountNumber: string
  accountType?: string // "Cuenta Corriente" | "Cuenta de Ahorro" | etc.
  holder: string
  message?: string
}

export const manualTransfer: PaymentGateway = {
  name: "manual-transfer",
  displayName: "Transferencia bancaria / Transferência",

  extractExternalId(body) {
    return (body.orderId as string) ?? null
  },

  async createPayment(input: CreatePaymentInput, credentials: string): Promise<PaymentResult> {
    const creds = JSON.parse(credentials) as ManualTransferCreds
    return {
      externalId: input.orderId,
      data: {
        bankName: creds.bankName ?? "",
        accountNumber: creds.accountNumber ?? "",
        accountType: creds.accountType ?? "",
        holder: creds.holder ?? "",
        message: creds.message ?? "Envíe el comprobante de pago y procesaremos su pedido.",
      },
    }
  },

  async verifyWebhook() {
    return null // confirmed by admin after reviewing receipt
  },

  async refundPayment() {
    return false // manual refund
  },
}
