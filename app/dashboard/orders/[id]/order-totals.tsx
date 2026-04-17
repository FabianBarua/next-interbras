import { formatUSD } from "@/lib/order-constants"
import { Badge } from "@/components/ui/badge"

interface Props {
  subtotal: string | number
  discount?: string | number | null
  shippingCost: string | number
  shippingMethod?: string | null
  total: string | number
}

export function OrderTotals({ subtotal, discount, shippingCost, shippingMethod, total }: Props) {
  const discountNum = Number(discount ?? 0)
  const shippingNum = Number(shippingCost)

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatUSD(subtotal)}</span>
      </div>
      {discountNum > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Descuento</span>
          <span className="text-green-600">-{formatUSD(discountNum)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-muted-foreground">
          Envio ({shippingMethod ?? "—"})
        </span>
        {shippingNum === 0 ? (
          <Badge variant="secondary" className="text-xs">Gratis</Badge>
        ) : (
          <span>{formatUSD(shippingNum)}</span>
        )}
      </div>
      <div className="border-t pt-2 flex justify-between font-semibold text-base">
        <span>Total</span>
        <span>{formatUSD(total)}</span>
      </div>
    </div>
  )
}
