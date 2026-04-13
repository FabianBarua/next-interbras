import Link from "next/link"
import { notFound } from "next/navigation"
import {
  getAffiliateDetail,
  getAffiliateCommissions,
} from "@/lib/actions/admin/affiliates"
import { formatPrice } from "@/lib/utils"
import { formatInTimeZone } from "date-fns-tz"
import { getTimezone } from "@/lib/timezone"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AffiliateStatusActions,
  AffiliateEditForm,
  AffiliateDeleteButton,
} from "@/components/dashboard/affiliate-actions"

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pendiente", variant: "outline" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
}

const COMMISSION_STATUS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pendiente", variant: "outline" },
  approved: { label: "Aprobada", variant: "secondary" },
  rejected: { label: "Rechazada", variant: "destructive" },
  paid: { label: "Pagada", variant: "default" },
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold ${highlight ? "text-primary" : ""}`}>
        {value}
      </p>
    </div>
  )
}

export default async function AffiliateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ commissionsPage?: string }>
}) {
  const { id } = await params
  const sp = await searchParams

  const detail = await getAffiliateDetail(id)
  if (!detail) notFound()

  const commissionsPage = Math.max(
    1,
    parseInt(sp.commissionsPage ?? "1", 10) || 1,
  )
  const [commissionsResult, tz] = await Promise.all([
    getAffiliateCommissions(id, commissionsPage),
    getTimezone(),
  ])

  const pixLabel = detail.pixType
    ? (
        {
          cpf: "CPF",
          email: "Email",
          phone: "Teléfono",
          random: "Aleatoria",
        } as Record<string, string>
      )[detail.pixType] ?? detail.pixType
    : "—"

  return (
    <div className="mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link href="/dashboard/affiliates">&larr; Afiliados</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {(detail.userName ?? "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">
                  {detail.userName ?? "Afiliado"}
                </h1>
                <Badge
                  variant={
                    STATUS_LABELS[detail.status]?.variant ?? "secondary"
                  }
                >
                  {STATUS_LABELS[detail.status]?.label ?? detail.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {detail.userEmail}
              </p>
            </div>
          </div>
          <AffiliateStatusActions
            affiliateId={detail.id}
            currentStatus={detail.status}
          />
        </div>
      </div>

      {/* Info grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 rounded-md border p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Código de referencia</p>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            {detail.refCode}
          </code>
        </div>
        <div>
          <p className="text-muted-foreground">Tasa de comisión</p>
          <p className="font-medium">{detail.commissionRate}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Clave PIX ({pixLabel})</p>
          <p className="break-all font-medium">{detail.pixKey ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Teléfono</p>
          <p>{detail.userPhone ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Documento</p>
          <p className="font-mono">{detail.userDocumentNumber ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Desde</p>
          <p>{formatInTimeZone(detail.createdAt, tz, "dd/MM/yyyy")}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total ganado"
          value={formatPrice(detail.totalEarned)}
          highlight
        />
        <StatCard
          label="Total pagado"
          value={formatPrice(detail.totalPaid)}
        />
        <StatCard
          label="Comisiones"
          value={String(detail.commissionStats.total)}
        />
        <StatCard
          label="Pendientes"
          value={String(detail.commissionStats.pending)}
        />
        <StatCard
          label="Aprobadas"
          value={String(detail.commissionStats.approved)}
        />
        <StatCard
          label="Pagadas"
          value={String(detail.commissionStats.paid)}
        />
        <StatCard
          label="Rechazadas"
          value={String(detail.commissionStats.rejected)}
        />
      </div>

      {/* Actions */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <AffiliateEditForm
          affiliateId={detail.id}
          currentRate={detail.commissionRate}
          currentRefCode={detail.refCode}
          currentPixKey={detail.pixKey}
          currentPixType={detail.pixType}
        />
        <AffiliateDeleteButton
          affiliateId={detail.id}
          affiliateName={detail.userName}
        />
      </div>

      <Separator className="my-6" />

      {/* Commissions table */}
      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold">
          Comisiones ({commissionsResult.total})
        </h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead className="w-28 text-right">
                  Valor pedido
                </TableHead>
                <TableHead className="w-16 text-center">Tasa</TableHead>
                <TableHead className="w-28 text-right">Comisión</TableHead>
                <TableHead className="w-24 text-center">Estado</TableHead>
                <TableHead className="hidden w-28 sm:table-cell">
                  Fecha
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissionsResult.commissions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Ninguna comisión registrada.
                  </TableCell>
                </TableRow>
              ) : (
                commissionsResult.commissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {c.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/orders/${c.orderId}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {c.orderId.slice(0, 8)}...
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatPrice(c.orderTotal)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {c.commissionRate}%
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {formatPrice(c.commission)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          COMMISSION_STATUS[c.status]?.variant ?? "secondary"
                        }
                        className="text-[10px]"
                      >
                        {COMMISSION_STATUS[c.status]?.label ?? c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                      {formatInTimeZone(c.createdAt, tz, "dd/MM/yy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {commissionsResult.totalPages > 1 && (
          <div className="mt-3 flex justify-end gap-2">
            {commissionsResult.page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/affiliates/${id}?commissionsPage=${commissionsResult.page - 1}`}
                >
                  Anterior
                </Link>
              </Button>
            )}
            {commissionsResult.page < commissionsResult.totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/affiliates/${id}?commissionsPage=${commissionsResult.page + 1}`}
                >
                  Siguiente
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
