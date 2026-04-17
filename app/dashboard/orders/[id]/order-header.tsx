import { Badge } from "@/components/ui/badge"
import { formatDate, formatUSD } from "@/lib/order-constants"

interface Props {
  orderId: string
  statusLabel: string
  statusColor: string
  createdAt: Date | string
  total: string | number
}

export function OrderHeader({ orderId, statusLabel, statusColor, createdAt, total }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">
            Pedido #{orderId.slice(0, 8)}
          </h1>
          <Badge
            variant="outline"
            className="text-xs font-semibold uppercase tracking-wide"
            style={{
              borderColor: statusColor,
              color: statusColor,
              backgroundColor: `${statusColor}15`,
            }}
          >
            {statusLabel}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDate(createdAt, { hour: undefined, minute: undefined })}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
        <p className="text-2xl font-bold tracking-tight">{formatUSD(total)}</p>
      </div>
    </div>
  )
}
