import Link from "next/link"
import { notFound } from "next/navigation"
import { getCustomerDetail } from "@/lib/actions/admin/customers"
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
  CustomerRoleToggle,
  CustomerEditForm,
  CustomerDeleteButton,
} from "./customer-actions"

const fmt = (n: number | string) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ORDER_STATUS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pendiente", variant: "outline" },
  CONFIRMED: { label: "Confirmado", variant: "default" },
  PROCESSING: { label: "Procesando", variant: "secondary" },
  SHIPPED: { label: "Enviado", variant: "secondary" },
  DELIVERED: { label: "Entregado", variant: "default" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
}

const PAYMENT_STATUS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  succeeded: "Aprobado",
  failed: "Fallido",
  refunded: "Reembolsado",
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [data, tz] = await Promise.all([getCustomerDetail(id), getTimezone()])
  if (!data) notFound()

  const { user, authProvider, stats, recentOrders, recentPayments } = data

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link href="/dashboard/customers">&larr; Volver</Link>
        </Button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {(user.name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">{user.name ?? "Sin nombre"}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Badge
            variant={
              user.role === "admin"
                ? "default"
                : user.role === "support"
                  ? "secondary"
                  : "outline"
            }
            className={
              user.role === "support"
                ? "border-blue-400/50 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : ""
            }
          >
            {user.role === "admin" ? "Admin" : user.role === "support" ? "Soporte" : "Usuario"}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="mb-6 grid grid-cols-2 gap-4 rounded-md border p-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Teléfono</p>
          <p className="font-medium">{user.phone || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">CPF</p>
          <p className="font-mono">{user.cpf || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Registrado en</p>
          <p>{formatInTimeZone(user.createdAt, tz, "dd/MM/yyyy")}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Email verificado</p>
          <p>{user.emailVerified ? "Sí" : "No"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Login</p>
          <p className="capitalize">
            {authProvider === "google"
              ? "Google"
              : authProvider === "credentials"
                ? "Email/Contraseña"
                : authProvider ?? "—"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total pedidos" value={String(stats.totalOrders)} />
        <StatCard label="Total gastado" value={`US$ ${fmt(stats.totalSpent)}`} highlight />
        <StatCard label="Confirmados" value={String(stats.paidCount)} />
        <StatCard label="Pendientes" value={String(stats.pendingCount)} />
        <StatCard label="Cancelados" value={String(stats.cancelledCount)} />
        {stats.lastOrderAt && (
          <div className="col-span-2 rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Último pedido</p>
            <p className="text-sm font-medium">
              {formatInTimeZone(new Date(stats.lastOrderAt), tz, "dd/MM/yyyy HH:mm")}
            </p>
          </div>
        )}
      </div>

      {/* Role Management */}
      <div className="mb-6">
        <CustomerRoleToggle customer={user} />
      </div>

      {/* Secondary actions */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <CustomerEditForm customer={user} />
        <CustomerDeleteButton customerId={user.id} />
      </div>

      <Separator className="my-6" />

      {/* Recent Orders */}
      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold">
          Pedidos recientes ({recentOrders.length})
        </h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ningún pedido encontrado.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((o) => {
                  const st = ORDER_STATUS[o.status] ?? {
                    label: o.status,
                    variant: "outline" as const,
                  }
                  return (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/orders/${o.id}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {o.id.slice(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant} className="text-[10px]">
                          {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{o.paymentMethod || "—"}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        US$ {fmt(o.total)}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                        {formatInTimeZone(o.createdAt, tz, "dd/MM/yy")}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-base font-semibold">
            Pagos recientes ({recentPayments.length})
          </h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="hidden sm:table-cell">ID Externo</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">{p.gateway}</TableCell>
                    <TableCell>
                      <Badge
                        variant={p.status === "succeeded" ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {PAYMENT_STATUS[p.status] ?? p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      US$ {fmt(p.amount)}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                      {p.externalId ? `${p.externalId.slice(0, 12)}...` : "—"}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                      {formatInTimeZone(p.createdAt, tz, "dd/MM/yy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
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
      <p className={`text-sm font-bold ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  )
}
