import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  formatUSD,
  formatDateShort,
} from "@/lib/order-constants"

interface Payment {
  status: string
  gateway: string | null
  externalId: string | null
  amount: number
  paidAt: Date | string | null
  metadata: unknown
}

interface Props {
  payment: Payment | null
  paymentMethod: string
}

function metaStr(meta: Record<string, unknown>, key: string): string | null {
  const v = meta[key]
  return typeof v === "string" && v.length > 0 ? v : null
}

export function OrderPaymentDetails({ payment, paymentMethod }: Props) {
  if (!payment) return <p className="text-sm text-muted-foreground">Sin datos de pago.</p>

  const meta = (payment.metadata ?? {}) as Record<string, unknown>
  const receiptUrl = metaStr(meta, "receiptUrl")
  const receiptUploadedAt = metaStr(meta, "receiptUploadedAt")
  const statusColor = PAYMENT_STATUS_COLORS[payment.status] ?? "#6b7280"

  const badgeVariant = payment.status === "succeeded"
    ? "default" as const
    : payment.status === "failed" || payment.status === "refunded"
      ? "destructive" as const
      : "outline" as const

  return (
    <div className="space-y-4">
      {/* Status + Gateway info */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Estado del pago</span>
        <Badge
          variant={badgeVariant}
          className="text-[10px] uppercase tracking-wide"
          style={badgeVariant === "outline" ? {
            borderColor: statusColor,
            color: statusColor,
            backgroundColor: `${statusColor}15`,
          } : undefined}
        >
          {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <Row label="Gateway" value={payment.gateway ?? "—"} capitalize />
        {payment.externalId && (
          <Row label="ID externo" value={payment.externalId} mono breakAll />
        )}
        <Row label="Monto" value={formatUSD(payment.amount / 100)} bold />
        {payment.paidAt && (
          <Row label="Pagado" value={formatDateShort(payment.paidAt)} />
        )}
      </div>

      {/* Transfer metadata */}
      {paymentMethod === "transfer" && hasTransferMeta(meta) && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Datos bancarios</p>
            <MetaRow meta={meta} field="bankName" label="Banco" />
            <MetaRow meta={meta} field="accountType" label="Tipo" />
            <MetaRow meta={meta} field="holder" label="Titular" />
            <MetaRow meta={meta} field="accountNumber" label="Cuenta" mono />
          </div>
        </>
      )}

      {/* PIX metadata */}
      {paymentMethod === "pix" && (
        <>
          {metaStr(meta, "pixCode") && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Datos PIX</p>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Codigo PIX (copia e cola):</p>
                  <p className="text-xs font-mono bg-muted p-2 rounded break-all text-foreground">
                    {metaStr(meta, "pixCode")!.slice(0, 120)}...
                  </p>
                </div>
                {metaStr(meta, "expiresAt") && (
                  <Row
                    label="Expiracion"
                    value={new Date(metaStr(meta, "expiresAt")!).toLocaleString("es-PY")}
                  />
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Card metadata */}
      {paymentMethod === "card" && metaStr(meta, "checkoutUrl") && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Datos de tarjeta</p>
            <p className="text-sm">
              URL checkout:{" "}
              <a
                href={metaStr(meta, "checkoutUrl")!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline text-xs break-all"
              >
                {metaStr(meta, "checkoutUrl")!.slice(0, 60)}...
              </a>
            </p>
          </div>
        </>
      )}

      {/* Receipt image */}
      {receiptUrl && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Comprobante de pago</p>
            <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Image
                src={receiptUrl}
                alt="Comprobante de pago"
                width={320}
                height={400}
                className="rounded-lg border w-full object-contain max-h-[300px]"
                unoptimized
              />
            </a>
            <p className="text-xs text-muted-foreground">
              {receiptUploadedAt
                ? `Subido el ${formatDateShort(receiptUploadedAt)}`
                : "Clic para ver en tamano completo"}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ── Helpers ──

function hasTransferMeta(meta: Record<string, unknown>): boolean {
  return !!(metaStr(meta, "bankName") || metaStr(meta, "accountType") || metaStr(meta, "holder") || metaStr(meta, "accountNumber"))
}

function Row({ label, value, mono, bold, capitalize, breakAll }: {
  label: string
  value: string
  mono?: boolean
  bold?: boolean
  capitalize?: boolean
  breakAll?: boolean
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span
        className={[
          "text-foreground text-right",
          mono && "font-mono text-xs",
          bold && "font-semibold",
          capitalize && "capitalize",
          breakAll && "break-all",
        ].filter(Boolean).join(" ")}
      >
        {value}
      </span>
    </div>
  )
}

function MetaRow({ meta, field, label, mono }: {
  meta: Record<string, unknown>
  field: string
  label: string
  mono?: boolean
}) {
  const value = metaStr(meta, field)
  if (!value) return null
  return <Row label={label} value={value} mono={mono} />
}
