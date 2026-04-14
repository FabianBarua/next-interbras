import type { PaymentGateway, PaymentBlockComponent } from "./types"

// ─── Gateway Strategy Registry ───

const gateways = new Map<string, PaymentGateway>()
const blocks = new Map<string, PaymentBlockComponent>()

export function registerGateway(
  gateway: PaymentGateway,
  block: PaymentBlockComponent,
) {
  gateways.set(gateway.name, gateway)
  blocks.set(gateway.name, block)
}

export function getGateway(name: string): PaymentGateway {
  const gw = gateways.get(name)
  if (!gw) throw new Error(`Gateway "${name}" not registered`)
  return gw
}

export function getPaymentBlock(name: string): PaymentBlockComponent {
  const block = blocks.get(name)
  if (!block) throw new Error(`Payment block for "${name}" not registered`)
  return block
}

export function getRegisteredGateways(): string[] {
  return Array.from(gateways.keys())
}

/** Try each registered gateway to extract an externalId from a webhook body. */
export function extractExternalIdFromWebhook(body: Record<string, unknown>): string | null {
  for (const gw of gateways.values()) {
    const id = gw.extractExternalId(body)
    if (id) return id
  }
  return null
}
