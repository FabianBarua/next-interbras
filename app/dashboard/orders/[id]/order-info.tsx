import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PAYMENT_METHOD_LABELS } from "@/lib/order-constants"

interface Props {
  paymentMethod: string
  shippingMethod?: string | null
  trackingCode?: string | null
  sourceDomain?: string | null
  currency?: string | null
}

export function OrderInfo({ paymentMethod, shippingMethod, trackingCode, sourceDomain, currency }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles del pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <InfoRow
          label="Metodo de pago"
          value={PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod ?? "—"}
        />
        <InfoRow
          label="Metodo de envio"
          value={shippingMethod ?? "—"}
        />
        {trackingCode && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Codigo de rastreo</p>
            <Badge variant="outline" className="font-mono text-xs">
              {trackingCode}
            </Badge>
          </div>
        )}
        {sourceDomain && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Dominio</p>
            <Badge variant="secondary" className="font-mono text-xs">
              {sourceDomain}
            </Badge>
          </div>
        )}
        <InfoRow label="Moneda" value={currency ?? "USD"} />
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
