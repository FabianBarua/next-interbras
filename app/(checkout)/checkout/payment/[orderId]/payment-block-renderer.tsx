"use client"

import type { PaymentBlockProps } from "@/lib/payments/types"
import { PixBlock } from "@/components/payment-blocks/pix-block"
import { CardBlock } from "@/components/payment-blocks/card-block"
import { CashBlock } from "@/components/payment-blocks/cash-block"
import { TransferBlock } from "@/components/payment-blocks/transfer-block"
import { CardPlaceholderBlock } from "@/components/payment-blocks/card-placeholder-block"

/** Map gateway type → payment UI block */
const BLOCK_MAP: Record<string, React.ComponentType<PaymentBlockProps>> = {
  // External gateways
  "pyxpay-pix": PixBlock,
  "pyxpay-card": CardBlock,
  "commpix-pix": PixBlock,
  // Manual / in-person methods
  "manual-cash": CashBlock,
  "manual-transfer": TransferBlock,
  "manual-card": CardPlaceholderBlock,
}

interface Props {
  gatewayType: string
  data: Record<string, unknown>
  orderId: string
}

export function PaymentBlockRenderer({ gatewayType, data, orderId }: Props) {
  const Block = BLOCK_MAP[gatewayType]

  if (!Block) {
    return (
      <div className="rounded-lg border border-destructive p-6 text-center">
        <p className="text-destructive">Gateway de pago no soportado: {gatewayType}</p>
      </div>
    )
  }

  return <Block data={data} orderId={orderId} />
}
